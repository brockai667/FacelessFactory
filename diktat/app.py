#!/usr/bin/env python3
"""diktat – hlasové diktovanie po slovensky do Claude Code (a hocijakého iného okna).

Beh:  python app.py                 (daemon s globálnou klávesovou skratkou)
      python app.py --file x.wav    (prepíš + vyčisti audio súbor, vypíš)
      python app.py --text "..."    (len vyčisti text, vypíš)
      python app.py --list-devices  (zoznam mikrofónov)

Tok: hotkey → nahrávanie → Whisper (sk) → vyčistenie (pravidlá + Claude) → vloženie do aktívneho okna.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import logging
import os
import sys
import threading
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")   # Windows: neškodné varovanie pri sťahovaní modelu

from diktat_core import cleanup, config as cfgmod, hotkey as hotkeymod, inject  # noqa: E402

log = logging.getLogger("diktat")


class DiktatApp:
    def __init__(self, cfg: dict, no_paste: bool = False):
        self.cfg = cfg
        self.no_paste = no_paste
        self.busy = threading.Lock()
        self.recorder = None
        self.stt = None
        self.log_dir = (HERE / cfg.get("log_dir", "logs")) if cfg.get("log_dir") else None

    # -- inicializácia ---------------------------------------------------------------------------
    def prepare(self) -> None:
        from diktat_core import audio, stt
        a = self.cfg["audio"]
        self.recorder = audio.Recorder(
            sample_rate=a.get("sample_rate", 16000),
            device=a.get("device"),
            silence_auto_stop_seconds=a.get("silence_auto_stop_seconds", 0),
            max_seconds=a.get("max_seconds", 900),
            on_auto_stop=self._auto_stop,
        )
        self.stt = stt.make_backend(self.cfg)
        loader = getattr(self.stt, "load", None)
        if loader:
            loader()   # stiahni/načítaj model hneď, nie až pri prvom diktáte
        try:
            self.recorder.open()   # stream beží stále → stlačenie skratky začne nahrávať okamžite
            log.info("mikrofón pripravený")
        except Exception as exc:  # noqa: BLE001
            log.warning("mikrofón sa nepodarilo otvoriť vopred: %s (skús --list-devices a audio.device v configu)", exc)

    # -- ovládanie ----------------------------------------------------------------------------------
    def toggle(self) -> None:
        if self.recorder.recording:
            self.stop_and_process()
        else:
            self.start_recording()

    def on_hotkey(self) -> None:
        """Volané z vlákna klávesnice – nič v ňom nerob, len odovzdaj ďalej (inak sa kláves zdrží)."""
        threading.Thread(target=self.toggle, daemon=True).start()

    def start_recording(self) -> None:
        if self.busy.locked():
            print("⏳ ešte spracúvam predchádzajúci diktát…", flush=True)
            return
        from diktat_core import audio
        print("🔴 NAHRÁVAM – hovor. (hotkey znova = stop)", flush=True)
        if self.cfg["audio"].get("beep"):
            audio.beep("start")
        self.recorder.start()

    def _auto_stop(self) -> None:
        print("🤫 ticho / limit – zastavujem", flush=True)
        self.stop_and_process()

    def stop_and_process(self) -> None:
        if not self.recorder.recording:
            return
        from diktat_core import audio
        wav = self.recorder.stop()
        if self.cfg["audio"].get("beep"):
            audio.beep("stop")
        threading.Thread(target=self._process, args=(wav,), daemon=True).start()

    # -- spracovanie -------------------------------------------------------------------------------
    def _process(self, wav) -> None:
        with self.busy:
            t0 = time.monotonic()
            seconds = len(wav) / float(self.cfg["audio"].get("sample_rate", 16000))
            if seconds < 0.5:
                print("… príliš krátke, ignorujem", flush=True)
                return
            print(f"📝 prepisujem {seconds:.1f} s …", flush=True)
            try:
                raw = self.stt.transcribe(wav, language=self.cfg.get("language", "sk"))
            except Exception as exc:  # noqa: BLE001
                log.exception("prepis zlyhal")
                print(f"❌ prepis zlyhal: {exc}", flush=True)
                return
            self._finish(raw, t0)

    def process_text(self, raw: str) -> cleanup.CleanResult:
        return cleanup.clean(raw, self.cfg)

    def _finish(self, raw: str, t0: float) -> None:
        from diktat_core import audio
        if not raw.strip():
            print("… nič som nerozpoznal", flush=True)
            return
        print(f"   surové: {raw}", flush=True)
        result = self.process_text(raw)
        text = result.text
        if not text:
            print("… po vyčistení nič neostalo", flush=True)
            return
        marker = self.cfg["output"].get("marker") or ""
        final = f"{marker}{text}" if marker and not text.startswith(marker.strip()) else text
        print(f"✅ ({result.method}, {time.monotonic() - t0:.1f} s){' → ODOSIELAM' if result.send else ''}:\n{final}\n",
              flush=True)
        self._log(raw, result)
        if self.no_paste:
            return
        try:
            inject.deliver(final, self.cfg["output"], send=result.send)
            if self.cfg["audio"].get("beep"):
                audio.beep("done")
        except Exception as exc:  # noqa: BLE001
            log.exception("vloženie zlyhalo")
            print(f"❌ vloženie zlyhalo: {exc}\nText je v schránke – vlož ho ručne (Ctrl+V).", flush=True)

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

    # -- hotkey slučka ---------------------------------------------------------------------------
    def run(self) -> None:
        from pynput import keyboard
        hotkey = self.cfg.get("hotkey", "<ctrl>+<alt>+d")
        mode = (self.cfg.get("mode") or "toggle").lower()
        clean_mode = self.cfg["cleanup"].get("mode")
        clean_desc = f"{clean_mode}/{self.cfg['cleanup'].get('model')}" if clean_mode in ("llm", "auto") else clean_mode
        stt_desc = f"{self.cfg['stt'].get('backend')}/{self.cfg['stt'].get('model')}"
        if getattr(self.stt, "device", None):
            stt_desc += f" ({self.stt.device}/{self.stt.compute_type})"
        print(f"🎤 diktat beží.  Skratka: {hotkey}  režim: {mode}  jazyk: {self.cfg.get('language')}"
              f"  STT: {stt_desc}  čistenie: {clean_desc}", flush=True)
        print("   Klikni do okna Claude Code, stlač skratku, hovor, stlač znova. Ctrl+C ukončí.", flush=True)
        if sys.platform == "win32" and not inject.running_as_admin():
            print("   (Ak cieľové okno beží „ako správca“, Windows simulované Ctrl+V zahodí – spusti aj diktat ako správca.)",
                  flush=True)
        print(flush=True)

        parsed = hotkeymod.parse_hotkey(hotkey)
        if parsed["kind"] == "vk":
            self._run_raw_hotkey(keyboard, parsed, mode)
            return

        if mode == "hold":
            combo = keyboard.HotKey.parse(hotkey)
            hk = keyboard.HotKey(combo, lambda: threading.Thread(target=self.start_recording, daemon=True).start())

            def on_press(key):
                hk.press(listener.canonical(key))

            def on_release(key):
                hk.release(listener.canonical(key))
                if self.recorder.recording and listener.canonical(key) in combo:
                    self.stop_and_process()

            with keyboard.Listener(on_press=on_press, on_release=on_release) as listener:
                listener.join()
        else:
            with keyboard.GlobalHotKeys({hotkey: self.on_hotkey}) as listener:
                listener.join()


    def _run_raw_hotkey(self, keyboard, parsed: dict, mode: str) -> None:
        """Jeden kláves podľa VK kódu (napr. numpad ,/Del). Na Windows sa stlačenie pohltí."""
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
        with listener:
            listener.join()


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
        with keyboard.Listener(on_press=on_press, win32_event_filter=flt) as listener:
            listener.join()
    else:
        def on_press(key):
            if key == keyboard.Key.esc:
                return False
            vk = getattr(key, "vk", None) or getattr(getattr(key, "value", None), "vk", None)
            print(f"{key!r} vk={vk}", flush=True)
        with keyboard.Listener(on_press=on_press) as listener:
            listener.join()
    return 0


def _setup_logging(verbose: bool) -> None:
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(asctime)s %(name)s %(levelname)s: %(message)s", datefmt="%H:%M:%S",
    )
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
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args(argv)

    _setup_logging(args.verbose)
    cfg = cfgmod.load_config(args.config)
    log.info("config: %s", cfg.get("_path") or "(len defaulty)")

    if args.list_devices:
        from diktat_core import audio
        print(audio.list_devices())
        return 0
    if args.keys:
        return keys_probe()

    app = DiktatApp(cfg, no_paste=args.no_paste or bool(args.text) or bool(args.file))

    if args.text is not None:
        app._finish(args.text, time.monotonic())
        return 0

    if args.file:
        app.prepare()
        t0 = time.monotonic()
        raw = app.stt.transcribe(args.file, language=cfg.get("language", "sk"))
        app._finish(raw, t0)
        return 0

    app.prepare()
    try:
        app.run()
    except KeyboardInterrupt:
        print("\n👋 koniec")
    finally:
        if app.recorder is not None:
            app.recorder.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
