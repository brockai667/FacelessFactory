"""Nahrávanie z mikrofónu (sounddevice) do numpy poľa 16 kHz mono float32 – formát, ktorý Whisper očakáva.

Stream ostáva otvorený stále; nahrávanie je len príznak. Počas nahrávania sa dá priebežne odoberať
audio po kúskoch rezaných v pauzách (take_chunk), aby sa prepis robil už počas rozprávania.
"""
from __future__ import annotations

import logging
import math
import threading
import time
from typing import Callable

log = logging.getLogger("diktat.audio")

SILENCE_RMS = 0.008   # pod touto úrovňou považujeme blok za ticho
BLOCK_SECONDS = 0.1   # veľkosť bloku z mikrofónu (1600 vzoriek pri 16 kHz)


def rms(block) -> float:
    """RMS hlasitosť bloku (numpy pole float32)."""
    import numpy as np
    if block is None or len(block) == 0:
        return 0.0
    return float(math.sqrt(float(np.mean(np.square(block, dtype="float64")))))


def find_cut(rms_list: list[float], block_seconds: float, min_seconds: float, max_seconds: float,
             silence_rms: float = SILENCE_RMS, min_silence_blocks: int = 3) -> int | None:
    """Nájde index bloku, kde odrezať kúsok audia na prepis.

    Hľadá pauzu (≥ min_silence_blocks tichých blokov za sebou) po dosiahnutí min_seconds a vráti
    index v strede pauzy. Ak pauza nie je a nazbieralo sa max_seconds, odreže natvrdo. Inak None.
    """
    n = len(rms_list)
    if n * block_seconds < min_seconds:
        return None
    start = max(0, int(min_seconds / block_seconds) - min_silence_blocks)
    run = 0
    for i in range(start, n):
        if rms_list[i] < silence_rms:
            run += 1
            if run >= min_silence_blocks:
                end = i + 1
                # predĺž na celú pauzu, nech rez padne do jej stredu
                while end < n and rms_list[end] < silence_rms:
                    end += 1
                cut = (i + 1 - run + end) // 2
                return max(cut, 1)
        else:
            run = 0
    if n * block_seconds >= max_seconds:
        return n
    return None


class Recorder:
    """Rekordér: open() raz pri štarte, start()/stop() prepínajú nahrávanie, take_chunk() odoberá kúsky.

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
        self.blocksize = int(self.sample_rate * BLOCK_SECONDS)
        self._blocks: list = []
        self._rms: list[float] = []
        self._stream = None
        self._lock = threading.Lock()
        self._started_at = 0.0
        self._last_voice_at = 0.0
        self._heard_voice = False
        self._auto_fired = False
        self.recording = False
        self.total_seconds = 0.0

    # -- callback z audio vlákna --------------------------------------------------------------
    def _callback(self, indata, frames, time_info, status):  # noqa: D401 – signatúra sounddevice
        if status:
            log.debug("audio status: %s", status)
        if not self.recording:
            return
        block = indata[:, 0].copy()
        level = rms(block)
        with self._lock:
            self._blocks.append(block)
            self._rms.append(level)
            self.total_seconds += len(block) / self.sample_rate
        now = time.monotonic()
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
    def open(self) -> None:
        """Otvorí stream z mikrofónu a nechá ho bežať (volaj raz pri štarte programu)."""
        import sounddevice as sd
        if self._stream is not None:
            return
        self._stream = sd.InputStream(
            samplerate=self.sample_rate, channels=1, dtype="float32", blocksize=self.blocksize,
            device=self.device, callback=self._callback,
        )
        self._stream.start()

    def close(self) -> None:
        if self._stream is not None:
            try:
                self._stream.stop()
                self._stream.close()
            finally:
                self._stream = None
        self.recording = False

    def start(self) -> None:
        with self._lock:
            self._blocks, self._rms = [], []
            self.total_seconds = 0.0
        self._started_at = time.monotonic()
        self._last_voice_at = self._started_at
        self._heard_voice = False
        self._auto_fired = False
        if self._stream is None or not self._stream.active:
            self.close()
            self.open()
        self.recording = True
        log.info("nahrávam…")

    def buffered_seconds(self) -> float:
        with self._lock:
            return len(self._blocks) * BLOCK_SECONDS

    def _concat(self, blocks):
        import numpy as np
        if not blocks:
            return np.zeros(0, dtype="float32")
        return np.concatenate(blocks).astype("float32")

    def take_chunk(self, min_seconds: float, max_seconds: float, silence_rms: float = SILENCE_RMS):
        """Ak sa nazbieralo dosť audia a našla sa pauza (alebo max), odoberie kúsok z bufra a vráti ho."""
        with self._lock:
            cut = find_cut(self._rms, BLOCK_SECONDS, min_seconds, max_seconds, silence_rms)
            if cut is None:
                return None
            blocks, self._blocks = self._blocks[:cut], self._blocks[cut:]
            self._rms = self._rms[cut:]
        return self._concat(blocks)

    def stop(self):
        """Ukončí nahrávanie (stream ostáva otvorený) a vráti zvyšné audio v bufri."""
        self.recording = False
        with self._lock:
            blocks, self._blocks, self._rms = self._blocks, [], []
        audio = self._concat(blocks)
        log.info("nahrané spolu %.1f s", self.total_seconds)
        return audio

    def seconds(self) -> float:
        return 0.0 if not self.recording else time.monotonic() - self._started_at


def list_devices() -> str:
    import sounddevice as sd
    return str(sd.query_devices())


def _beep_sync(kind: str) -> None:
    try:
        import winsound
        freq = {"start": 880, "stop": 660, "done": 1040, "error": 300}.get(kind, 700)
        winsound.Beep(freq, 120)
    except Exception:  # noqa: BLE001 – zvuk je len kozmetika
        print("\a", end="", flush=True)


def beep(kind: str = "start") -> None:
    """Krátke pípnutie (Windows: winsound; inde terminálový zvonček). Nezdržuje – beží vo vlákne."""
    threading.Thread(target=_beep_sync, args=(kind,), daemon=True).start()
