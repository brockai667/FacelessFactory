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

from diktat_core import (cleanup, config as cfgmod, hotkey as hotkeymod, inject, overlay as overlaymod,  # noqa: E402
                         panel as panelmod, procs, sessions as sessionsmod, tray as traymod)

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
        self.panel = panelmod.NoPanel()
        self.log_dir = (HERE / cfg.get("log_dir", "logs")) if cfg.get("log_dir") else None
        # priebežný prepis
        self._queue: queue.Queue = queue.Queue()
        self._results: dict[int, str] = {}
        self._seq = 0
        self._worker = None
        self._segmenter = None
        self._t0 = 0.0
        self._listener = None
        self._gate_note = ""

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
            gate_envelope_halflife=a.get("gate_envelope_halflife", 0.5),
            gate_sustain_seconds=a.get("gate_sustain_seconds", 1.0),
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
        self.overlay.level_fn = lambda: (self.recorder.last_level, self.recorder.gate_rms)
        self.overlay.show(f"✅ diktat pripravený – stlač {self.cfg.get('hotkey', 'skratku')}", "ready", timeout=4)
        self.start_panel()
        follow = [p for p in (self.cfg.get("follow", {}).get("processes") or []) if p]
        if follow and sys.platform == "win32":
            threading.Thread(target=self._follow_loop, args=(follow,), daemon=True, name="follow").start()

    def _follow_loop(self, follow: list[str]) -> None:
        """Keď nie je otvorené žiadne OKNO sledovaných programov (Claude, prehliadač…) dlhšie ako
        exit_after_seconds, diktat sa vypne. Procesy na pozadí (Chrome bez okna, Claude v lište) sa nerátajú.
        Úloha diktat-watch ho spustí znova, keď sa okno objaví."""
        limit = float(self.cfg.get("follow", {}).get("exit_after_seconds") or 60)
        missing_since = None
        last_seen: set[str] | None = None
        while True:
            time.sleep(5)
            try:
                all_names = procs.running_process_names()
                if len(all_names) < 20:
                    # Windows má vždy desiatky procesov – takto malý zoznam = zlyhanie enumerácie → nevypínať sa
                    log.warning("follow: podozrivý zoznam procesov (%d), vypínanie preskakujem", len(all_names))
                    missing_since = None
                    continue
                windows = procs.process_names_with_windows()
                wanted = {f.lower() for f in follow} | {f.lower()[:-4] for f in follow if f.lower().endswith(".exe")}
                seen = sorted(n for n in windows if n in wanted or n + ".exe" in wanted)
                if set(seen) != last_seen:
                    log.info("follow: otvorené okná sledovaných programov: %s", ", ".join(seen) or "žiadne")
                    last_seen = set(seen)
                if seen:
                    missing_since = None
                    continue
                if missing_since is None:
                    missing_since = time.monotonic()
                    log.info("žiadne okno Claude/prehliadača – vypnem sa o %.0f s", limit)
                    continue
                if time.monotonic() - missing_since < limit:
                    continue
                if self.recorder is not None and (self.recorder.recording or self.busy.locked()):
                    continue                     # dokonči diktát, vypni sa až potom
                log.info("Claude/prehliadač zatvorený – diktat sa vypína (úloha diktat-watch ho spustí znova)")
                self.tray.notify("Claude zatvorený – diktat sa vypína. Spustí sa sám, keď Claude zapneš.")
                self.overlay.show("💤 diktat sa vypína (Claude zatvorený) – zapne sa sám s Claude", "info", timeout=4)
                time.sleep(1.5)
                self.shutdown()
                self.tray.stop()
                os._exit(0)
            except Exception:  # noqa: BLE001
                log.exception("follow slučka")

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
        if getattr(self.recorder, "gate_rms", 0):
            ratio = audio.gated_ratio(getattr(self.recorder, "gated_blocks", 0), getattr(self.recorder, "kept_blocks", 0))
            self._gate_note = f"brána vymazala {ratio:.0%} nahrávky"
            print("📐 " + self._gate_note, flush=True)
            if ratio >= 0.5:
                self._gate_note += " – ak to bol tvoj hlas, daj Brána → Miernejšia"
        else:
            self._gate_note = ""
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
            if self._gate_note:
                msg += "   📐 " + self._gate_note
            self.overlay.show(msg, "ok", timeout=6 if "Miernejšia" in msg else 3)
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
        """Konzola: priprav → skratka → čakaj. Tray: ikona HNEĎ (modrá „štartujem“), model sa načíta na pozadí."""
        if use_tray and traymod.available():
            log_path = str(self.log_dir / "diktat.log") if self.log_dir else None
            self.tray = traymod.Tray(on_quit=self.shutdown, log_path=log_path,
                                     notify_enabled=bool(self.cfg.get("tray", {}).get("notify", True)),
                                     on_update=self.update_and_restart if sys.platform == "win32" else None,
                                     on_calibrate=lambda: threading.Thread(target=self.calibrate, daemon=True).start(),
                                     on_gate=self.adjust_gate, gate_text=self.gate_text,
                                     on_diag=self.run_diag,
                                     on_panel=self.toggle_panel, panel_on=self.panel_enabled,
                                     on_restart_check=self.restart_check)
            self.tray.state = "starting"

            def boot():
                try:
                    self.prepare()
                    self.banner()
                    self.start_listener()
                    self.tray.set_state("idle")
                except Exception as exc:  # noqa: BLE001
                    import traceback
                    log.error("štart zlyhal:\n%s", traceback.format_exc())
                    self.tray.set_state("error")
                    alert(f"diktat sa nepodarilo spustiť:\n\n{type(exc).__name__}: {exc}\n\n"
                          f"Log: {log_path}", "diktat – chyba")

            threading.Thread(target=boot, daemon=True, name="boot").start()
            self.tray.run()          # blokuje v hlavnom vlákne až po „Ukončiť“
            return
        if use_tray:
            log.warning("pystray/Pillow nie sú nainštalované – bežím bez ikony (pip install -r requirements.txt)")
        self.prepare()
        self.banner()
        listener = self.start_listener()
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
            self.recorder.gate_rms = res["gate"]
            path = cfgmod.save_value(self.cfg, "audio.gate_rms", res["gate"])
            self.cfg["audio"]["gate_rms"] = res["gate"]
            ratio = f"{res['ratio']:.1f}×" if res["ratio"] != float("inf") else "∞"
            summary = f"reč {res['speech']:.4f}, pozadie {res['noise']:.4f} (pomer {ratio})"
            print("📐 kalibrácia: " + summary + f" → brána {res['gate']:.4f}, uložené do {path.name}", flush=True)
            if not res["ok"]:
                msg = (f"{summary}: pozadie je skoro také hlasné ako ty, brána by sekala tvoje slová – nechávam ju "
                       f"VYPNUTÚ. Ak ju chceš skúsiť aj tak, menu ikony → Brána → Prísnejšia.")
                print("📐 " + msg, flush=True)
                self.overlay.show("📐 " + msg, "stt", timeout=10)
                self.tray.notify(msg)
            else:
                msg = f"✅ kalibrácia hotová – {summary} → brána {res['gate']:.4f}"
                self.overlay.show(msg, "ok", timeout=6)
                self.tray.notify(msg)
            return res
        finally:
            self.tray.set_state("idle")
            self.busy.release()

    def run_diag(self) -> None:
        def work():
            diagnose(self.cfg, self.log_dir)
            self.overlay.show("🩺 diagnostika je v schránke – vlož do Claude (Ctrl+V)", "ok", timeout=6)
            self.tray.notify("Diagnostika skopírovaná do schránky – vlož do Claude cez Ctrl+V.")
        threading.Thread(target=work, daemon=True).start()

    def gate_text(self) -> str:
        g = self.recorder.gate_rms if self.recorder else 0
        return f"brána: {g:.4f}" if g else "brána: vypnutá"

    def adjust_gate(self, action: str) -> None:
        """Doladenie brány z menu: stricter (+25 %), looser (−20 %), off."""
        if self.recorder is None:
            return
        cur = self.recorder.gate_rms or 0.0
        if action == "off":
            new = 0.0
        elif action == "stricter":
            new = round(cur * 1.25, 5) if cur else 0.008
        elif action == "looser":
            new = round(cur * 0.8, 5) if cur else 0.0
        else:
            return
        self.recorder.gate_rms = new
        self.cfg["audio"]["gate_rms"] = new
        try:
            cfgmod.save_value(self.cfg, "audio.gate_rms", new)
        except Exception as exc:  # noqa: BLE001
            log.warning("brána: uloženie zlyhalo: %s", exc)
        msg = f"Brána: {new:.4f}" if new else "Brána vypnutá – prepisuje sa všetko"
        print("📐 " + msg, flush=True)
        self.overlay.show("📐 " + msg, "info", timeout=3)
        self.tray.notify(msg)

    def update_and_restart(self) -> None:
        """Spustí update_diktat.bat (git pull + pip + nový štart cez diktat_tray.vbs) a tento proces ukončí."""
        import subprocess
        bat = HERE / "update_diktat.bat"
        if not bat.is_file():
            self.tray.notify("Chýba update_diktat.bat")
            return
        self.tray.notify("Aktualizujem… diktat sa o chvíľu spustí znova (najneskôr do minúty).")
        subprocess.Popen(["cmd", "/c", "start", "", str(bat)], cwd=str(HERE))   # noqa: S603 – vlastný skript
        threading.Timer(1.0, lambda: (self.shutdown(), self.tray.stop(), os._exit(0))).start()

    def start_panel(self) -> None:
        """Panel so stavom Claude Code sessions (pravý horný roh okna Claude)."""
        cfg = self.cfg.get("panel", {})
        if not cfg.get("enabled", True):
            return
        try:
            sessionsmod.prune(cfg.get("state_dir"), stale_minutes=cfg.get("stale_minutes", 240))
            self.panel = panelmod.Panel(cfg)
            self.panel.start()
        except Exception as exc:  # noqa: BLE001
            log.warning("panel sa nepodarilo spustiť: %s", exc)
            self.panel = panelmod.NoPanel()

    def panel_enabled(self) -> bool:
        return bool(self.cfg.get("panel", {}).get("enabled", True))

    def toggle_panel(self) -> None:
        """Ikona v lište: zapni/vypni panel a zapamätaj si to v config.json."""
        on = not self.panel_enabled()
        self.cfg.setdefault("panel", {})["enabled"] = on
        try:
            cfgmod.save_value(self.cfg, "panel.enabled", on)
        except Exception as exc:  # noqa: BLE001
            log.warning("panel.enabled sa nepodarilo uložiť: %s", exc)
        if on and isinstance(self.panel, panelmod.NoPanel):
            self.start_panel()
        else:
            self.panel.set_enabled(on)
        self.tray.notify("Panel session zapnutý" if on else "Panel session vypnutý")

    def restart_check(self) -> str:
        """Ikona v lište: môžem teraz reštartovať Claude? Odpoveď pošle ako oznámenie Windows."""
        cfgp = self.cfg.get("panel", {}) or {}
        states = sessionsmod.read_states(cfgp.get("state_dir"), done_keep_minutes=cfgp.get("done_keep_minutes", 30),
                                         stale_minutes=cfgp.get("stale_minutes", 240), max_rows=99)
        _ok, text = sessionsmod.restart_summary(states)
        self.tray.notify(text, "diktat – reštart Claude")
        return text

    def shutdown(self) -> None:
        try:
            self.panel.stop()
        except Exception:  # noqa: BLE001
            pass
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


def alert(message: str, title: str = "diktat") -> None:
    """Chybové okno Windows – jediný spôsob, ako sa ozvať, keď beží skryto (pythonw --tray)."""
    log.error("%s: %s", title, message)
    if sys.platform != "win32":
        return
    try:
        import ctypes
        ctypes.windll.user32.MessageBoxW(None, message[:1800], title, 0x10 | 0x1000 | 0x40000)  # ICONERROR|SYSTEMMODAL|TOPMOST
    except Exception:  # noqa: BLE001
        pass


def single_instance(log_dir: Path | None, wait_seconds: float = 20.0) -> bool:
    """Zabezpečí, že beží len jeden daemon (Windows mutex) a zapíše PID do logs/diktat.pid (pre update_diktat.bat).
    Ak starý beh práve dobieha (po aktualizácii), počká naň až wait_seconds."""
    global _instance_mutex
    if sys.platform == "win32":
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            deadline = time.monotonic() + wait_seconds
            while True:
                handle = kernel32.CreateMutexW(None, False, "Local\\diktat-daemon")
                if kernel32.GetLastError() != 183:      # ERROR_ALREADY_EXISTS
                    _instance_mutex = handle
                    break
                if handle:
                    kernel32.CloseHandle(handle)
                if time.monotonic() >= deadline:
                    return False
                log.info("diktat ešte beží (dobieha?) – čakám…")
                time.sleep(1.0)
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


SESSION_HOOK_EVENTS = ("UserPromptSubmit", "SessionStart", "Notification", "Stop", "SessionEnd")


def hooks_status(claude_dir: Path | None = None) -> str:
    """Sú hooky diktatu zaregistrované v ~/.claude/settings.json? (bez nich panel nevie, čo sessions robia)"""
    path = Path(claude_dir or (Path.home() / ".claude")) / "settings.json"
    if not path.is_file():
        return f"hooky: settings.json CHÝBA ({path})"
    try:
        hooks = (json.loads(path.read_text(encoding="utf-8")) or {}).get("hooks") or {}
    except (OSError, ValueError) as exc:
        return f"hooky: settings.json sa nedá prečítať ({exc})"
    parts = []
    for event in SESSION_HOOK_EVENTS:
        blob = json.dumps(hooks.get(event) or [], ensure_ascii=False)
        parts.append(f"{event}={'áno' if 'diktat' in blob else 'NIE'}")
    return "hooky: " + ", ".join(parts)


def panel_check(cfg: dict) -> list[str]:
    """Krátka kontrola panela v ľudskej reči: beží diktat, je panel zapnutý, čo hlásia sessions."""
    lines = ["=== kontrola panela ==="]
    running = procs.diktat_running()
    lines.append(f"diktat beží: {'áno' if running else 'NIE – spusti odkaz Diktat na ploche'}")
    lines.extend(panel_status(cfg))
    lines.append(hooks_status())
    states = []
    try:
        pcfg = cfg.get("panel", {}) or {}
        states = sessionsmod.read_states(pcfg.get("state_dir"), max_rows=50)
    except Exception:  # noqa: BLE001
        pass
    real = [e for e in states if not e.get("demo")]
    if not running:
        lines.append("→ Panel nevidno preto, že diktat nebeží. Spusti ho odkazom Diktat na ploche.")
    elif real:
        lines.append(f"→ Všetko v poriadku, panel má čo ukazovať ({len(real)} session).")
    else:
        lines.append("→ diktat beží, ale žiadna session zatiaľ nehlási stav. Session hlási stav až vtedy, "
                     "keď sa spustila po inštalácii hookov – zavri a otvor projekt v Claude a napíš mu čokoľvek.")
    return lines


def panel_status(cfg: dict) -> list[str]:
    """Čo je práve v priečinku so stavmi sessions – podľa toho vidno, či sessions hlásia stav."""
    pcfg = cfg.get("panel", {}) or {}
    lines = []
    try:
        directory = Path(pcfg.get("state_dir") or sessionsmod.default_dir())
        files = sorted(directory.glob("*.json")) if directory.is_dir() else []
        lines.append(f"panel: {'zapnutý' if pcfg.get('enabled', True) else 'vypnutý'}; "
                     f"stavy sessions: {directory} ({len(files)} súborov)")
        for entry in sessionsmod.read_states(directory, max_rows=20):
            mark = "  [UKÁŽKA]" if entry.get("demo") else ""
            lines.append(f"   {entry.get('name')}: {entry.get('state')} "
                         f"(pred {int(entry.get('age', 0))} s){mark}")
    except Exception as exc:  # noqa: BLE001
        lines.append(f"panel: stav sa nepodarilo prečítať ({exc})")
    return lines


def gpu_info() -> str:
    """Názov a pamäť NVIDIA grafiky cez nvidia-smi (je súčasťou ovládača); inak stručný dôvod."""
    import subprocess
    try:
        res = subprocess.run(["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader"],
                             capture_output=True, text=True, timeout=15, errors="replace")
    except FileNotFoundError:
        return "nvidia-smi nenájdené (bez NVIDIA ovládača)"
    except Exception as exc:  # noqa: BLE001
        return f"nvidia-smi zlyhal: {exc}"
    if res.returncode != 0:
        return f"nvidia-smi zlyhal: {(res.stderr or res.stdout).strip()[:120]}"
    cards = []
    for ln in res.stdout.splitlines():
        if not ln.strip():
            continue
        name, _, mem = ln.rpartition(",")
        mem = mem.strip()
        try:
            gb = int(mem.split()[0]) / 1024
            mem = f"{gb:.0f} GB pamäte"
        except (ValueError, IndexError):
            pass
        cards.append(f"{name.strip()}, {mem}")
    return "; ".join(cards) or "nvidia-smi nevrátil žiadnu kartu"


def diagnose(cfg: dict, log_dir: Path | None) -> str:
    """Zozbiera stav (verzia, config, súbory, úloha Plánovača, procesy, konce logov) do textu, uloží ho
    do logs/diagnostika.txt a skopíruje do schránky – používateľ ho vloží do Claude cez Ctrl+V."""
    import datetime as _dt
    import subprocess
    lines: list[str] = []
    add = lines.append
    add(f"=== diktat diagnostika {_dt.datetime.now():%Y-%m-%d %H:%M:%S} ===")
    try:
        rev = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=str(HERE), capture_output=True, text=True,
                             timeout=10).stdout.strip()
    except Exception:  # noqa: BLE001
        rev = "?"
    add(f"verzia: {rev}  python: {sys.version.split()[0]}  exe: {sys.executable}")
    add(f"grafika: {gpu_info()}")
    for line in panel_status(cfg):
        add(line)
    add(hooks_status())
    add(f"config: {cfg.get('_path')}  hotkey={cfg.get('hotkey')}  gate={cfg['audio'].get('gate_rms')}  "
        f"follow={cfg.get('follow', {}).get('processes')}  exit_after={cfg.get('follow', {}).get('exit_after_seconds')}")
    for name in ("diktat_tray.vbs", "diktat_watch.vbs", "config.json", "logs/diktat.pid", "logs/install.log",
                 "logs/update.log", "logs/diktat.log"):
        path = HERE / name
        add(f"súbor {name}: {'existuje' if path.exists() else 'CHÝBA'}"
            + (f" ({_dt.datetime.fromtimestamp(path.stat().st_mtime):%H:%M:%S}, {path.stat().st_size} B)" if path.exists() else ""))
    if sys.platform == "win32":
        try:
            res = subprocess.run(["schtasks", "/query", "/tn", "diktat-watch", "/v", "/fo", "list"],
                                 capture_output=True, text=True, timeout=30, errors="replace")
            if res.returncode == 0:
                keep = ("TaskName", "Status", "Last Run Time", "Last Result", "Next Run Time", "Task To Run",
                        "Scheduled Task State", "Názov úlohy", "Stav", "Čas posledného spustenia",
                        "Posledný výsledok", "Ďalšie spustenie", "Úloha na spustenie")
                add("úloha diktat-watch:")
                for ln in res.stdout.splitlines():
                    if any(k.lower() in ln.lower() for k in keep):
                        add("   " + ln.strip())
            else:
                add(f"úloha diktat-watch: NEEXISTUJE ({(res.stderr or res.stdout).strip()[:120]})")
        except Exception as exc:  # noqa: BLE001
            add(f"úloha diktat-watch: schtasks zlyhal: {exc}")
        try:
            names = procs.running_process_names()
            follow = cfg.get("follow", {}).get("processes") or []
            seen = sorted(n for n in names if n in {f.lower() for f in follow})
            add(f"procesov spolu: {len(names)}; sledované procesy: {', '.join(seen) or 'žiadny'}; diktat mutex: {procs.diktat_running()}")
            wins = procs.process_names_with_windows()
            seen_w = sorted(n for n in wins if n in {f.lower() for f in follow})
            add(f"okná sledovaných programov: {', '.join(seen_w) or 'žiadne'} (spolu procesov s oknom: {len(wins)})")
        except Exception as exc:  # noqa: BLE001
            add(f"procesy: chyba {exc}")
        watch = HERE / "diktat_watch.vbs"
        if watch.is_file():
            try:
                res = subprocess.run(["cscript", "//nologo", str(watch)], capture_output=True, text=True, timeout=60,
                                     errors="replace", cwd=str(HERE))
                add(f"test diktat_watch.vbs: kód {res.returncode} {(res.stdout + res.stderr).strip()[:200]}")
            except Exception as exc:  # noqa: BLE001
                add(f"test diktat_watch.vbs: {exc}")
    for name in ("install.log", "update.log", "diktat.log"):
        path = (log_dir or HERE / "logs") / name
        if path.is_file():
            try:
                tail = path.read_text(encoding="utf-8", errors="replace").splitlines()[-12:]
            except Exception:  # noqa: BLE001
                tail = ["(nedá sa prečítať)"]
            add(f"--- {name} (koniec) ---")
            lines.extend("   " + ln for ln in tail)
    report = "\n".join(lines)
    try:
        out = (log_dir or HERE / "logs")
        out.mkdir(parents=True, exist_ok=True)
        (out / "diagnostika.txt").write_text(report, encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass
    try:
        import pyperclip
        pyperclip.copy(report)
    except Exception:  # noqa: BLE001
        pass
    return report


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
    ap.add_argument("--diag", action="store_true", help="diagnostika do logs/diagnostika.txt + schránky")
    ap.add_argument("--panel-demo", nargs="?", const="on", choices=["on", "off"],
                    help="ukážkové session v paneli (on = zapíš, off = zmaž)")
    ap.add_argument("--panel-check", action="store_true",
                    help="kontrola panela: beží diktat, sú hooky, čo hlásia sessions")
    ap.add_argument("--restart-check", action="store_true",
                    help="dá sa teraz reštartovať Claude? (vypíše, ktorá session ešte pracuje)")
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
    if args.panel_demo:
        directory = (cfg.get("panel", {}) or {}).get("state_dir")
        if args.panel_demo == "off":
            print(f"Ukážkové session zmazané ({sessionsmod.demo_clear(directory)}).")
        else:
            paths = sessionsmod.demo(directory)
            print(f"Ukážkové session zapísané ({len(paths)}) – pozri pravý horný roh okna Claude.")
            print("Zmazať: panel_ukazka.bat off")
        return 0
    if args.panel_check:
        for line in panel_check(cfg):
            print(line)
        return 0
    if args.restart_check:
        cfgp = cfg.get("panel", {}) or {}
        states = sessionsmod.read_states(cfgp.get("state_dir"), done_keep_minutes=cfgp.get("done_keep_minutes", 30),
                                         stale_minutes=cfgp.get("stale_minutes", 240), max_rows=99)
        ok, text = sessionsmod.restart_summary(states)
        print(text)
        return 0 if ok else 1
    if args.diag:
        report = diagnose(cfg, log_dir)
        print(report)
        print("\n(Skopírované do schránky – vlož do Claude cez Ctrl+V. Uložené aj v logs/diagnostika.txt.)")
        return 0

    app = DiktatApp(cfg, no_paste=args.no_paste or bool(args.text) or bool(args.file))

    if args.text is None and not args.file and not single_instance(log_dir):
        msg = "diktat už beží (ikona pri hodinách, možno pod šípkou ^). Druhú inštanciu nespúšťam."
        print(msg, flush=True)
        log.warning(msg)
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
        app.prepare()
        app.calibrate()
        app.shutdown()
        return 0

    try:
        app.run(use_tray=args.tray)
    except KeyboardInterrupt:
        print("\n👋 koniec")
    except Exception as exc:  # noqa: BLE001 – skrytý beh nesmie zomrieť potichu
        import traceback
        tb = traceback.format_exc()
        log.error("diktat spadol:\n%s", tb)
        if args.tray:
            alert(f"diktat spadol pri štarte/behu:\n\n{type(exc).__name__}: {exc}\n\n{tb[-900:]}\n\n"
                  f"Celý log: {(log_dir or HERE / 'logs') / 'diktat.log'}", "diktat – chyba")
        else:
            raise
    finally:
        app.shutdown()
    return 0


if __name__ == "__main__":
    sys.exit(main())
