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

from diktat_core import cleanup, config as cfgmod, inject  # noqa: E402

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

    # -- ovládanie ----------------------------------------------------------------------------------
    def toggle(self) -> None:
        if self.recorder.recording:
            self.stop_and_process()
        else:
            self.start_recording()

    def start_recording(self) -> None:
        if self.busy.locked():
            print("⏳ ešte spracúvam predchádzajúci diktát…", flush=True)
            return
        from diktat_core import audio
        self.recorder.start()
        if self.cfg["audio"].get("beep"):
            audio.beep("start")
        print("🔴 NAHRÁVAM – hovor. (hotkey znova = stop)", flush=True)

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
        print("   Klikni do okna Claude Code, stlač skratku, hovor, stlač znova. Ctrl+C ukončí.\n", flush=True)

        if mode == "hold":
            combo = keyboard.HotKey.parse(hotkey)
            hk = keyboard.HotKey(combo, self.start_recording)

            def on_press(key):
                hk.press(listener.canonical(key))

            def on_release(key):
                hk.release(listener.canonical(key))
                if self.recorder.recording and listener.canonical(key) in combo:
                    self.stop_and_process()

            with keyboard.Listener(on_press=on_press, on_release=on_release) as listener:
                listener.join()
        else:
            with keyboard.GlobalHotKeys({hotkey: self.toggle}) as listener:
                listener.join()


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
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args(argv)

    _setup_logging(args.verbose)
    cfg = cfgmod.load_config(args.config)
    log.info("config: %s", cfg.get("_path") or "(len defaulty)")

    if args.list_devices:
        from diktat_core import audio
        print(audio.list_devices())
        return 0

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
    return 0


if __name__ == "__main__":
    sys.exit(main())
