"""Nahrávanie z mikrofónu (sounddevice) do numpy poľa 16 kHz mono float32 – formát, ktorý Whisper očakáva."""
from __future__ import annotations

import logging
import math
import threading
import time
from typing import Callable

log = logging.getLogger("diktat.audio")

SILENCE_RMS = 0.008   # pod touto úrovňou považujeme blok za ticho


def rms(block) -> float:
    """RMS hlasitosť bloku (numpy pole float32)."""
    import numpy as np
    if block is None or len(block) == 0:
        return 0.0
    return float(math.sqrt(float(np.mean(np.square(block, dtype="float64")))))


class Recorder:
    """Jednoduchý rekordér: start() → stop() vráti celé nahrané audio ako np.ndarray (float32, mono).

    Voliteľné automatické zastavenie po `silence_auto_stop_seconds` ticha (0 = vypnuté) –
    zavolá `on_auto_stop` z audio vlákna, volajúci má spracovanie presunúť do vlastného vlákna.
    """

    def __init__(self, sample_rate: int = 16000, device=None, silence_auto_stop_seconds: float = 0,
                 max_seconds: float = 900, on_auto_stop: Callable[[], None] | None = None):
        self.sample_rate = int(sample_rate)
        self.device = device
        self.silence_auto_stop = float(silence_auto_stop_seconds or 0)
        self.max_seconds = float(max_seconds or 0)
        self.on_auto_stop = on_auto_stop
        self._chunks: list = []
        self._stream = None
        self._lock = threading.Lock()
        self._started_at = 0.0
        self._last_voice_at = 0.0
        self._heard_voice = False
        self._auto_fired = False
        self.recording = False

    # -- callback z audio vlákna --------------------------------------------------------------
    def _callback(self, indata, frames, time_info, status):  # noqa: D401 – signatúra sounddevice
        if status:
            log.debug("audio status: %s", status)
        block = indata[:, 0].copy()
        with self._lock:
            self._chunks.append(block)
        now = time.monotonic()
        level = rms(block)
        if level > SILENCE_RMS:
            self._heard_voice = True
            self._last_voice_at = now
        auto = False
        if self.silence_auto_stop > 0 and self._heard_voice and now - self._last_voice_at > self.silence_auto_stop:
            auto = True
        if self.max_seconds > 0 and now - self._started_at > self.max_seconds:
            auto = True
        if auto and not self._auto_fired and self.on_auto_stop:
            self._auto_fired = True
            threading.Thread(target=self.on_auto_stop, daemon=True).start()

    # -- API ---------------------------------------------------------------------------------------
    def start(self) -> None:
        import sounddevice as sd
        with self._lock:
            self._chunks = []
        self._started_at = time.monotonic()
        self._last_voice_at = self._started_at
        self._heard_voice = False
        self._auto_fired = False
        self._stream = sd.InputStream(
            samplerate=self.sample_rate, channels=1, dtype="float32",
            device=self.device, callback=self._callback,
        )
        self._stream.start()
        self.recording = True
        log.info("nahrávam…")

    def stop(self):
        """Zastaví stream a vráti audio (np.ndarray float32) alebo prázdne pole."""
        import numpy as np
        if self._stream is not None:
            try:
                self._stream.stop()
                self._stream.close()
            finally:
                self._stream = None
        self.recording = False
        with self._lock:
            chunks = self._chunks
            self._chunks = []
        if not chunks:
            return np.zeros(0, dtype="float32")
        audio = np.concatenate(chunks).astype("float32")
        log.info("nahrané %.1f s", len(audio) / self.sample_rate)
        return audio

    def seconds(self) -> float:
        return 0.0 if not self.recording else time.monotonic() - self._started_at


def list_devices() -> str:
    import sounddevice as sd
    return str(sd.query_devices())


def beep(kind: str = "start") -> None:
    """Krátke pípnutie (Windows: winsound; inde terminálový zvonček)."""
    try:
        import winsound
        freq = {"start": 880, "stop": 660, "done": 1040, "error": 300}.get(kind, 700)
        winsound.Beep(freq, 120)
    except Exception:  # noqa: BLE001 – zvuk je len kozmetika
        print("\a", end="", flush=True)
