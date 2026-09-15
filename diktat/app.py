#!/usr/bin/env python3
"""diktat – hlasové diktovanie po slovensky do Claude Code (a hocijakého iného okna).

Beh:  python app.py                 (daemon v konzole, globálna skratka)
      python app.py --tray          (skrytý beh s ikonou v lište; na autoštart: install.py --autostart)
      python app.py --file x.wav    (prepíš + vyčisti audio súbor, vypíš)
      python app.py --text "..."    (len vyčisti text, vypíš)
      python app.py --list-devices  (zoznam mikrofónov)
      python app.py --keys          (diagnostika: kódy stlačených klávesov)

Tok: skratka → nahrávanie → priebežný prepis kúskov (Whisper sk) počas rozprávania → po stope
dorobiť posledný kúsok → light vyčistenie → vloženie do aktívneho okna.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import logging
import os
import queue
import sys
import threading
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")   # Windows: neškodné varovanie pri sťahovaní modelu

from diktat_core import cleanup, config as cfgmod, hotkey as hotkeymod, inject, overlay as overlaymod, tray as traymod  # noqa: E402

log = logging.getLogger("diktat")


class DiktatApp:
    def __init__(self, cfg: dict, no_paste: bool = False):
        self.cfg = cfg
        self.no_paste = no_paste
        self.busy = threading.Lock()          # záverečné spracovanie + vkladanie
        self.recorder = None
        self.stt = None
        self.tray = traymod.NoTray()
        self.overlay = overlaymod.NoOverlay()
        self.log_dir = (HERE / cfg.get("log_dir", "logs")) if cfg.get("log_dir") else None
        # priebežný prepis
        self._queue: queue.Queue = queue.Queue()
        self._results: dict[int, str] = {}
        self._seq = 0
        self._worker = None
        self._segmenter = None
        self._t0 = 0.0
        self._listener = None

    # -- inicializácia ---------------------------------------------------------------------------
    def prepare(self, with_overlay: bool = True) -> None:
        from diktat_core import audio, stt
        ov = self.cfg.get("overlay", {})
        if with_overlay and ov.get("enabled", True):
            self.overlay = overlaymod.Overlay(alpha=ov.get("alpha", 0.92), font_size=ov.get("font_size", 12))
            self.overlay.start()
        self.overlay.show("⏳ diktat štartuje – načítavam model…", "info")
        a = self.cfg["audio"]
        self.recorder = audio.Recorder(
            sample_rate=a.get("sample_rate", 16000),
            device=a.get("device"),
            silence_auto_stop_seconds=a.get("silence_auto_stop_seconds", 0),
            max_seconds=a.get("max_seconds", 900),
            on_auto_stop=self._auto_stop,
            gate_rms=a.get("gate_rms", 0),
            gate_hangover_seconds=a.get("gate_hangover_seconds", 0.4),
        )
        self.stt = stt.make_backend(self.cfg)
        loader = getattr(self.stt, "load", None)
        if loader:
            loader()   # stiahni/načítaj model hneď, nie až pri prvom diktáte
        warm = getattr(self.stt, "warm_up", None)
        if warm:
            try:
                warm(self.cfg.get("language", "sk"))   # CUDA→CPU fallback + rozbeh modelu ešte pred prvým diktátom
            except Exception as exc:  # noqa: BLE001
                log.warning("rozbeh modelu zlyhal: %s", exc)
        try:
            self.recorder.open()   # stream beží stále → stlačenie skratky začne nahrávať okamžite
            log.info("mikrofón pripravený")
        except Exception as exc:  # noqa: BLE001
            log.warning("mikrofón sa nepodarilo otvoriť vopred: %s (skús --list-devices a audio.device v configu)", exc)
            self.overlay.show(f"❌ mikrofón: {exc}", "error", timeout=8)
        self._worker = threading.Thread(target=self._stt_worker, daemon=True, name="stt-worker")
        self._worker.start()
        self.overlay.show(f"✅ diktat pripravený – stlač {self.cfg.get('hotkey', 'skratku')}", "ready", timeout=4)

    # -- ovládanie ----------------------------------------------------------------------------------
    def toggle(self) -> None:
        if self.recorder.recording:
            self.stop_and_process()
        else:
            self.start_recording()

    def on_hotkey(self) -> None:
        """Volané z vlákna klávesnice – nič v ňom nerob, len odovzdaj ďalej (inak sa kláves zdrží)."""
        threading.Thread(target=self._hotkey_worker, daemon=True).start()

    def _hotkey_worker(self) -> None:
        print(f"⌨  skratka ({dt.datetime.now():%H:%M:%S})", flush=True)
        self.toggle()

    def start_recording(self) -> None:
        if self.busy.locked():
            print("⏳ ešte vkladám predchádzajúci diktát…", flush=True)
            return
        from diktat_core import audio
        print("🔴 NAHRÁVAM – hovor. (skratka znova = stop)", flush=True)
        self.tray.set_state("rec")
        self.overlay.recording("🔴 NAHRÁVAM – hovor, skratka = stop")
        if self.cfg.get("tray", {}).get("notify_start_stop", True):
            self.tray.notify("🔴 Nahrávam – hovor. Skratka znova = stop.")
        if self.cfg["audio"].get("beep"):
            audio.beep("start")
        self._results = {}
        self._seq = 0
        self._t0 = time.monotonic()
        self.recorder.start()
        if float(self.cfg["stt"].get("chunk_seconds") or 0) > 0:
            self._segmenter = threading.Thread(target=self._segment_loop, daemon=True, name="segmenter")
            self._segmenter.start()

    def _auto_stop(self) -> None:
        print("🤫 ticho / limit – zastavujem", flush=True)
        self.stop_and_process()

    def stop_and_process(self) -> None:
        if not self.recorder.recording:
            return
        from diktat_core import audio
        rest = self.recorder.stop()
        if self.cfg["audio"].get("beep"):
            audio.beep("stop")
        self.tray.set_state("stt")
        self.overlay.show("📝 prepisujem…", "stt")
        if self.cfg.get("tray", {}).get("notify_start_stop", True):
            self.tray.notify(f"⏹ Nahrávanie skončilo ({self.recorder.total_seconds:.0f} s) – prepisujem…")
        if len(rest) >= self.recorder.sample_rate * 0.3:
            self._enqueue(rest)
        threading.Thread(target=self._finalize, daemon=True).start()

    # -- priebežný prepis -------------------------------------------------------------------------------
    def _segment_loop(self) -> None:
        stt_cfg = self.cfg["stt"]
        min_s = float(stt_cfg.get("chunk_seconds") or 15)
        max_s = float(stt_cfg.get("chunk_max_seconds") or 30)
        sil = float(stt_cfg.get("chunk_silence_rms") or 0.008)
        while self.recorder.recording:
            chunk = self.recorder.take_chunk(min_s, max_s, sil)
            if chunk is not None and len(chunk):
                self._enqueue(chunk)
            time.sleep(0.25)

    def _enqueue(self, audio) -> None:
        self._seq += 1
        self._queue.put((self._seq, audio))

    def _stt_worker(self) -> None:
        """Jedno vlákno prepisuje kúsky v poradí; beží po celý čas programu."""
        prev_text = ""
        while True:
            seq, audio = self._queue.get()
            try:
                if seq == 1:
                    prev_text = ""
                secs = len(audio) / float(self.cfg["audio"].get("sample_rate", 16000))
                t = time.monotonic()
                text = self.stt.transcribe(audio, language=self.cfg.get("language", "sk"),
                                           context=prev_text[-300:] or None)
                self._results[seq] = text
                prev_text = (prev_text + " " + text).strip()
                print(f"📝 časť {seq}: {secs:.0f} s audia → {time.monotonic() - t:.1f} s  „{text[:70]}{'…' if len(text) > 70 else ''}“",
                      flush=True)
                if self.recorder.recording:
                    self.overlay.recording(f"🔴 NAHRÁVAM – prepísaná časť {seq}")
                else:
                    self.overlay.show(f"📝 prepisujem… časť {seq} hotová", "stt")
            except Exception as exc:  # noqa: BLE001
                log.exception("prepis časti %d zlyhal", seq)
                self._results[seq] = ""
                print(f"❌ prepis časti {seq} zlyhal: {exc}", flush=True)
            finally:
                self._queue.task_done()

    def _finalize(self) -> None:
        with self.busy:
            if self._seq == 0:
                print("… príliš krátke, ignorujem", flush=True)
                self.tray.set_state("idle")
                self.overlay.show("… príliš krátke, ignorujem", "info", timeout=2)
                return
            print(f"⏳ dokončujem prepis ({self._seq} častí, {self.recorder.total_seconds:.0f} s audia)…", flush=True)
            self._queue.join()
            raw = " ".join(self._results.get(i, "") for i in range(1, self._seq + 1)).strip()
            self._finish(raw, self._t0)
            self.tray.set_state("idle")

    # -- dokončenie -------------------------------------------------------------------------------------
    def process_text(self, raw: str) -> cleanup.CleanResult:
        return cleanup.clean(raw, self.cfg)

    def _finish(self, raw: str, t0: float) -> None:
        from diktat_core import audio
        if not raw.strip():
            print("… nič som nerozpoznal", flush=True)
            self.overlay.show("… nič som nerozpoznal", "info", timeout=3)
            return
        print(f"   surové: {raw}", flush=True)
        result = self.process_text(raw)
        text = result.text
        if not text:
            print("… po vyčistení nič neostalo", flush=True)
            return
        marker = self.cfg["output"].get("marker") or ""
        final = f"{marker}{text}" if marker and not text.startswith(marker.strip()) else text
        print(f"✅ ({result.method}, {time.monotonic() - t0:.1f} s od štartu nahrávania)"
              f"{' → ODOSIELAM' if result.send else ''}:\n{final}\n", flush=True)
        self._log(raw, result)
        if self.no_paste:
            self.overlay.hide()
            return
        try:
            inject.deliver(final, self.cfg["output"], send=result.send)
            if self.cfg["audio"].get("beep"):
                audio.beep("done")
            msg = f"✅ vložené {len(final)} znakov" + (" + Enter" if result.send else "")
            self.tray.notify(msg)
            self.overlay.show(msg, "ok", timeout=3)
        except Exception as exc:  # noqa: BLE001
            log.exception("vloženie zlyhalo")
            print(f"❌ vloženie zlyhalo: {exc}\nText je v schránke – vlož ho ručne (Ctrl+V).", flush=True)
            self.tray.set_state("error")
            self.tray.notify("Vloženie zlyhalo – text je v schránke, stlač Ctrl+V.")
            self.overlay.show("❌ vloženie zlyhalo – text je v schránke, stlač Ctrl+V", "error", timeout=8)

    def _log(self, raw: str, result: cleanup.CleanResult) -> None:
        if not self.log_dir:
            return
        try:
            self.log_dir.mkdir(parents=True, exist_ok=True)
            path = self.log_dir / f"{dt.date.today():%Y-%m-%d}.jsonl"
            with open(path, "a", encoding="utf-8") as fh:
                fh.write(json.dumps({
                    "ts": dt.datetime.now().isoformat(timespec="seconds"),
                    "raw": raw, "clean": result.text, "method": result.method, "send": result.send,
                }, ensure_ascii=False) + "\n")
        except Exception:  # noqa: BLE001
            log.debug("log sa nepodarilo zapísať", exc_info=True)

    # -- klávesnica ----------------------------------------------------------------------------------
    def banner(self) -> None:
        hotkey = self.cfg.get("hotkey", "numpad_decimal")
        mode = (self.cfg.get("mode") or "toggle").lower()
        clean_mode = self.cfg["cleanup"].get("mode")
        clean_desc = f"{clean_mode}/{self.cfg['cleanup'].get('model')}" if clean_mode in ("llm", "auto") else clean_mode
        stt_desc = f"{self.cfg['stt'].get('backend')}/{self.cfg['stt'].get('model')}"
        if getattr(self.stt, "device", None):
            stt_desc += f" ({self.stt.device}/{self.stt.compute_type})"
        chunk = self.cfg["stt"].get("chunk_seconds") or 0
        gate = self.cfg["audio"].get("gate_rms") or 0
        print(f"🎤 diktat beží.  Skratka: {hotkey}  režim: {mode}  jazyk: {self.cfg.get('language')}"
              f"  STT: {stt_desc}  priebežný prepis: {'po ~' + str(chunk) + ' s' if chunk else 'vypnutý'}"
              f"  brána: {gate if gate else 'vypnutá (--calibrate)'}  čistenie: {clean_desc}", flush=True)
        print("   Klikni do okna Claude Code, stlač skratku, hovor, stlač znova. Ctrl+C ukončí.", flush=True)
        if sys.platform == "win32" and not inject.running_as_admin():
            print("   (Ak cieľové okno beží „ako správca“, Windows simulované Ctrl+V zahodí – spusti aj diktat ako správca.)",
                  flush=True)
        print(flush=True)

    def start_listener(self):
        """Spustí globálnu skratku na pozadí a vráti pynput Listener."""
        from pynput import keyboard
        hotkey = self.cfg.get("hotkey", "numpad_decimal")
        mode = (self.cfg.get("mode") or "toggle").lower()
        parsed = hotkeymod.parse_hotkey(hotkey)

        if parsed["kind"] == "vk":
            import platform

            def on_press():
                if mode == "hold":
                    threading.Thread(target=self.start_recording, daemon=True).start()
                else:
                    self.on_hotkey()

            def on_release():
                if mode == "hold":
                    threading.Thread(target=self.stop_and_process, daemon=True).start()

            matcher = hotkeymod.RawKeyMatcher(parsed["vks"], parsed["nonext_vks"], parsed["ext_vks"],
                                              on_press=on_press, on_release=on_release, suppress=True)
            if platform.system() == "Windows":
                listener = keyboard.Listener(win32_event_filter=matcher.filter)
            else:
                listener = keyboard.Listener(on_press=matcher.press, on_release=matcher.release)
            matcher.listener = listener
        elif mode == "hold":
            combo = keyboard.HotKey.parse(hotkey)
            hk = keyboard.HotKey(combo, lambda: threading.Thread(target=self.start_recording, daemon=True).start())
            listener_ref = {}

            def on_press(key):
                hk.press(listener_ref["l"].canonical(key))

            def on_release(key):
                hk.release(listener_ref["l"].canonical(key))
                if self.recorder.recording and listener_ref["l"].canonical(key) in combo:
                    threading.Thread(target=self.stop_and_process, daemon=True).start()

            listener = keyboard.Listener(on_press=on_press, on_release=on_release)
            listener_ref["l"] = listener
        else:
            listener = keyboard.GlobalHotKeys({hotkey: self.on_hotkey})

        listener.start()
        self._listener = listener
        return listener

    def run(self, use_tray: bool = False) -> None:
        self.banner()
        listener = self.start_listener()
        if use_tray and traymod.available():
            log_path = str(self.log_dir / "diktat.log") if self.log_dir else None
            self.tray = traymod.Tray(on_quit=self.shutdown, log_path=log_path,
                                     notify_enabled=bool(self.cfg.get("tray", {}).get("notify", True)),
                                     on_update=self.update_and_restart if sys.platform == "win32" else None,
                                     on_calibrate=lambda: threading.Thread(target=self.calibrate, daemon=True).start())
            self.tray.run()          # blokuje v hlavnom vlákne až po „Ukončiť“
        else:
            if use_tray:
                log.warning("pystray/Pillow nie sú nainštalované – bežím bez ikony (pip install -r requirements.txt)")
            listener.join()

    # -- kalibrácia brány (len môj hlas z pracovnej vzdialenosti) ------------------------------------
    def calibrate(self, seconds: float = 5.0) -> dict | None:
        """Zmeria úroveň tvojej reči a ruchu v pozadí, navrhne prah brány a uloží ho do config.json."""
        from diktat_core import audio
        if self.recorder is None or self.recorder.recording:
            self.overlay.show("Kalibrácia: najprv ukonči nahrávanie", "error", timeout=3)
            return None
        if not self.busy.acquire(blocking=False):
            return None
        try:
            old_gate = self.recorder.gate_rms
            self.recorder.gate_rms = 0.0
            self.tray.set_state("rec")

            def measure(prompt: str) -> list[float]:
                print(prompt, flush=True)
                self.tray.notify(prompt)
                for i in (3, 2, 1):
                    self.overlay.show(f"{prompt}  (štart o {i})", "stt")
                    time.sleep(1)
                self.recorder.levels_probe = []
                self.recorder.start()
                t0 = time.monotonic()
                while time.monotonic() - t0 < seconds:
                    self.overlay.show(f"{prompt}  {int(seconds - (time.monotonic() - t0)) + 1} s", "rec")
                    time.sleep(0.2)
                self.recorder.stop()
                levels, self.recorder.levels_probe = self.recorder.levels_probe, None
                return levels

            speech = measure("🎙 1/2 HOVOR normálne z miesta, kde pracuješ")
            noise = measure("🤫 2/2 TICHO – nech hovoria ostatní / hrá hudba, ty mlč")
            res = audio.suggest_gate(speech, noise)
            self.recorder.gate_rms = res["gate"] if res["gate"] > 0 else old_gate
            if res["gate"] > 0:
                path = cfgmod.save_value(self.cfg, "audio.gate_rms", res["gate"])
                self.cfg["audio"]["gate_rms"] = res["gate"]
            else:
                path = None
            ratio = f"{res['ratio']:.1f}×" if res["ratio"] != float("inf") else "∞"
            summary = (f"reč {res['speech']:.4f}, ruch {res['noise']:.4f} (pomer {ratio}) → brána {res['gate']:.4f}"
                       + (f", uložené do {path.name}" if path else ""))
            print("📐 kalibrácia: " + summary, flush=True)
            if not res["ok"]:
                msg = "⚠ rozdiel reč/ruch je malý – brána bude nespoľahlivá. Priblíž sa k mikrofónu alebo stíš pozadie a skús znova."
                print(msg, flush=True)
                self.overlay.show(msg, "error", timeout=8)
                self.tray.notify(msg)
            else:
                self.overlay.show("✅ kalibrácia hotová – " + summary, "ok", timeout=6)
                self.tray.notify("Kalibrácia hotová: " + summary)
            return res
        finally:
            self.tray.set_state("idle")
            self.busy.release()

    def update_and_restart(self) -> None:
        """Spustí update_diktat.bat (git pull + pip + nový štart cez diktat_tray.vbs) a tento proces ukončí."""
        import subprocess
        bat = HERE / "update_diktat.bat"
        if not bat.is_file():
            self.tray.notify("Chýba update_diktat.bat")
            return
        self.tray.notify("Aktualizujem… diktat sa o chvíľu spustí znova.")
        subprocess.Popen(["cmd", "/c", "start", "", str(bat)], cwd=str(HERE))   # noqa: S603 – vlastný skript
        threading.Timer(1.0, lambda: (self.shutdown(), self.tray.stop(), os._exit(0))).start()

    def shutdown(self) -> None:
        try:
            if self.recorder is not None:
                self.recorder.close()
            if self._listener is not None:
                self._listener.stop()
        except Exception:  # noqa: BLE001
            pass
        try:
            if self.log_dir and (self.log_dir / "diktat.pid").is_file():
                (self.log_dir / "diktat.pid").unlink()
        except Exception:  # noqa: BLE001
            pass


# -- pomocné -----------------------------------------------------------------------------------------
_instance_mutex = None


def single_instance(log_dir: Path | None) -> bool:
    """Zabezpečí, že beží len jeden daemon (Windows mutex) a zapíše PID do logs/diktat.pid (pre update_diktat.bat)."""
    global _instance_mutex
    if sys.platform == "win32":
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            _instance_mutex = kernel32.CreateMutexW(None, False, "Local\\diktat-daemon")
            if kernel32.GetLastError() == 183:          # ERROR_ALREADY_EXISTS
                return False
        except Exception:  # noqa: BLE001
            pass
    try:
        if log_dir:
            log_dir.mkdir(parents=True, exist_ok=True)
            (log_dir / "diktat.pid").write_text(str(os.getpid()), encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass
    return True


def disable_console_quick_edit() -> None:
    """Windows konzola: kliknutie do okna zapne „QuickEdit“ (označovanie textu) a ZASTAVÍ výpis programu,
    kým sa označenie nezruší – daemon potom vyzerá zaseknutý. Vypneme to pre toto okno."""
    if sys.platform != "win32":
        return
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        handle = kernel32.GetStdHandle(-10)                  # STD_INPUT_HANDLE
        mode = ctypes.c_uint()
        if kernel32.GetConsoleMode(handle, ctypes.byref(mode)):
            new_mode = (mode.value | 0x0080) & ~0x0040        # ENABLE_EXTENDED_FLAGS, ~ENABLE_QUICK_EDIT_MODE
            kernel32.SetConsoleMode(handle, new_mode)
    except Exception:  # noqa: BLE001
        pass


def keys_probe() -> int:
    """Diagnostika: vypíše VK kód (+ extended príznak) každého stlačeného klávesu. Esc ukončí."""
    from pynput import keyboard
    print("Stláčaj klávesy (napr. numpad ,/Del). Vypíšem, čo Windows posiela. Esc = koniec.\n", flush=True)
    target = hotkeymod.parse_hotkey(cfgmod.load_config().get("hotkey", "numpad_decimal"))

    def describe(vk, extended, msg=None):
        hit = ""
        if target["kind"] == "vk":
            m = hotkeymod.RawKeyMatcher(target["vks"], target["nonext_vks"], target["ext_vks"], suppress=False)
            hit = "  ← TOTO je skratka diktat" if m.is_target(vk, extended) else ""
        kind = {0x100: "down", 0x104: "sysdown", 0x101: "up", 0x105: "sysup"}.get(msg, "")
        print(f"vk={vk} (0x{vk:02X}) extended={extended} {kind}{hit}", flush=True)

    if sys.platform == "win32":
        def flt(msg, data):
            vk = int(data.vkCode)
            if msg in (0x100, 0x104):
                describe(vk, bool(int(data.flags) & 1), msg)
            if vk == 0x1B:
                return False
            return True

        def on_press(key):
            if key == keyboard.Key.esc:
                return False
        listener = keyboard.Listener(on_press=on_press, win32_event_filter=flt)
    else:
        def on_press(key):
            if key == keyboard.Key.esc:
                return False
            vk = getattr(key, "vk", None) or getattr(getattr(key, "value", None), "vk", None)
            print(f"{key!r} vk={vk}", flush=True)
        listener = keyboard.Listener(on_press=on_press)
    try:
        with listener:
            listener.join()
    except KeyboardInterrupt:
        pass
    return 0


def _setup_logging(verbose: bool, log_dir: Path | None, hidden: bool) -> None:
    """Konzola: logy na stderr. Skrytý beh (pythonw / --tray): všetko do logs/diktat.log."""
    handlers = []
    fmt = logging.Formatter("%(asctime)s %(name)s %(levelname)s: %(message)s", datefmt="%H:%M:%S")
    if hidden or sys.stdout is None or sys.stderr is None:
        log_dir = log_dir or (HERE / "logs")
        log_dir.mkdir(parents=True, exist_ok=True)
        fh = logging.FileHandler(log_dir / "diktat.log", encoding="utf-8")
        fh.setFormatter(fmt)
        handlers.append(fh)
        # print() → tiež do súboru (pod pythonw je sys.stdout None)
        stream = open(log_dir / "diktat.log", "a", encoding="utf-8", buffering=1)
        sys.stdout = stream
        sys.stderr = stream
    else:
        sh = logging.StreamHandler()
        sh.setFormatter(fmt)
        handlers.append(sh)
    logging.basicConfig(level=logging.DEBUG if verbose else logging.INFO, handlers=handlers, force=True)
    logging.getLogger("faster_whisper").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="diktat – slovenské diktovanie do Claude Code")
    ap.add_argument("--config", help="cesta ku config.json (default: diktat/config.json)")
    ap.add_argument("--file", help="prepíš audio súbor (wav/mp3/m4a…) namiesto mikrofónu")
    ap.add_argument("--text", help="len vyčisti zadaný text (test čistenia bez mikrofónu)")
    ap.add_argument("--no-paste", action="store_true", help="nevkladaj do okna, len vypíš")
    ap.add_argument("--list-devices", action="store_true", help="vypíš audio zariadenia")
    ap.add_argument("--keys", action="store_true", help="diagnostika: vypíš kódy stlačených klávesov (Esc = koniec)")
    ap.add_argument("--tray", action="store_true", help="beh na pozadí s ikonou v lište, log do logs/diktat.log")
    ap.add_argument("--calibrate", action="store_true",
                    help="zmeraj reč vs. ruch a nastav hlasitostnú bránu (len tvoj hlas z pracovnej vzdialenosti)")
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args(argv)

    cfg = cfgmod.load_config(args.config)
    log_dir = (HERE / cfg.get("log_dir", "logs")) if cfg.get("log_dir") else None
    _setup_logging(args.verbose, log_dir, hidden=args.tray)
    disable_console_quick_edit()
    log.info("config: %s", cfg.get("_path") or "(len defaulty)")

    if args.list_devices:
        from diktat_core import audio
        print(audio.list_devices())
        return 0
    if args.keys:
        return keys_probe()

    app = DiktatApp(cfg, no_paste=args.no_paste or bool(args.text) or bool(args.file))

    if args.text is None and not args.file and not single_instance(log_dir):
        print("diktat už beží (ikona pri hodinách). Druhú inštanciu nespúšťam.", flush=True)
        log.warning("diktat už beží – končím")
        return 0

    if args.text is not None:
        app._finish(args.text, time.monotonic())
        return 0

    if args.file:
        app.prepare(with_overlay=False)
        t0 = time.monotonic()
        raw = app.stt.transcribe(args.file, language=cfg.get("language", "sk"))
        app._finish(raw, t0)
        return 0

    if args.calibrate:
        app.cfg["stt"]["model"] = app.cfg["stt"].get("model")   # model netreba, ale prepare() ho načíta – ok
        app.prepare()
        app.calibrate()
        app.shutdown()
        return 0

    app.prepare()
    try:
        app.run(use_tray=args.tray)
    except KeyboardInterrupt:
        print("\n👋 koniec")
    finally:
        app.shutdown()
    return 0


if __name__ == "__main__":
    sys.exit(main())
