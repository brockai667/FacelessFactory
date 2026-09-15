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


def gate_keep(prev_level: float, cur_level: float, gate_rms: float, since_loud: float, hangover: float) -> bool:
    """(Jednoduchšia verzia, ponechaná pre testy/kompatibilitu.) Má sa PREDCHÁDZAJÚCI blok ponechať?"""
    if gate_rms <= 0:
        return True
    if prev_level >= gate_rms or cur_level >= gate_rms:
        return True
    return since_loud <= hangover


def gate_keep3(l0: float, l1: float, l2: float, gate_rms: float, since_burst: float, hangover: float,
               env0: float | None = None, sustain: float | None = None) -> tuple[bool, bool]:
    """Rozhodne o bloku l0, keď už vidí dva nasledujúce (l1, l2). Vráti (ponechať, začal/pokračuje burst).

    „Burst“ = aspoň dva hlasné bloky za sebou (0,2 s) – osamotená špička (úder, výkrik z diaľky) sa vymaže.
    Ponechá sa: blok v burste, tiché slabiky vnútri slova (obálka env0 ešte nad prahom krátko po burste),
    nábeh pred burstom a dozvuk (hangover) po burste."""
    if gate_rms <= 0:
        return True, False
    loud0, loud1, loud2 = l0 >= gate_rms, l1 >= gate_rms, l2 >= gate_rms
    if loud0 and loud1:
        return True, True                       # súčasť burstu (aj jeho začiatok)
    if env0 is not None and env0 >= gate_rms and since_burst <= (sustain if sustain is not None else hangover):
        return True, False                      # tichšia slabika vnútri slova – obálka drží
    if loud0 and since_burst <= hangover:
        return True, False                      # posledný hlasný blok burstu / dozvuk
    if not loud0 and loud1 and loud2:
        return True, False                      # nábeh slova
    if since_burst <= hangover:
        return True, False                      # dozvuk
    return False, False


def _percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    vals = sorted(values)
    idx = min(len(vals) - 1, max(0, int(round((len(vals) - 1) * pct))))
    return vals[idx]


def suggest_gate(speech_levels: list[float], noise_levels: list[float]) -> dict:
    """Z nameraných úrovní (RMS blokov) navrhne prah brány. Reč = 75. percentil (reč má pauzy),
    ruch = 90. percentil (najhorší prípad). Prah = geometrický stred, ohraničený."""
    import math
    speech = _percentile(speech_levels, 0.75)
    noise = _percentile(noise_levels, 0.90)
    if speech <= 0:
        return {"speech": speech, "noise": noise, "gate": 0.0, "ratio": 0.0, "ok": False}
    ratio = speech / noise if noise > 0 else float("inf")
    gate = math.sqrt(speech * max(noise, 1e-5))
    gate = min(max(gate, noise * 1.5), speech * 0.6)
    ok = ratio >= 2.0
    # pri malom rozdiele by prah ležal uprostred reči a sekal by slová – bránu radšej nezapíname
    return {"speech": speech, "noise": noise, "gate": round(gate, 5) if ok else 0.0, "ratio": ratio, "ok": ok,
            "suggested": round(gate, 5)}


class Recorder:
    """Rekordér: open() raz pri štarte, start()/stop() prepínajú nahrávanie, take_chunk() odoberá kúsky.

    Brána (gate_rms > 0): bloky tichšie ako prah sa nahradia tichom (vzdialené hlasy, hudba v pozadí
    sa do prepisu nedostanú). Nábeh slova rieši pohľad o blok dopredu, dozvuk hangover.

    Voliteľné automatické zastavenie po `silence_auto_stop_seconds` ticha (0 = vypnuté) –
    zavolá `on_auto_stop` z audio vlákna, volajúci má spracovanie presunúť do vlastného vlákna.
    """

    def __init__(self, sample_rate: int = 16000, device=None, silence_auto_stop_seconds: float = 0,
                 max_seconds: float = 900, on_auto_stop: Callable[[], None] | None = None,
                 gate_rms: float = 0.0, gate_hangover_seconds: float = 0.4,
                 gate_envelope_halflife: float = 0.5, gate_sustain_seconds: float = 1.0):
        self.sample_rate = int(sample_rate)
        self.device = device
        self.gate_rms = float(gate_rms or 0)
        self.gate_hangover = float(gate_hangover_seconds or 0)
        self.gate_sustain = float(gate_sustain_seconds or 0)
        # obálka hlasitosti: klesá s polčasom gate_envelope_halflife – drží bránu otvorenú cez tiché slabiky
        self._env_decay = 0.5 ** (BLOCK_SECONDS / max(float(gate_envelope_halflife or 0.5), 0.05))
        self._env = 0.0
        self._pending: list = []        # [(block, level, env), ...] – čakajú na rozhodnutie brány (2 bloky dopredu)
        self._since_burst_blocks = 10**6  # koľko blokov ubehlo od konca posledného burstu (deterministické, nie čas)
        self.levels_probe: list[float] | None = None   # kalibrácia: zbieraj surové úrovne
        self.last_level = 0.0                          # posledná nameraná úroveň (ukazovateľ v prúžku)
        self.gated_blocks = 0                          # štatistika za nahrávanie: koľko blokov brána vymazala
        self.kept_blocks = 0
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
        self.last_level = level
        self._env = max(level, self._env * self._env_decay)
        env = self._env
        now = time.monotonic()
        if self.levels_probe is not None:
            self.levels_probe.append(level)
        # brána s pohľadom o dva bloky dopredu: rozhoduje sa o najstaršom čakajúcom bloku
        to_push = []
        if self.gate_rms <= 0:
            to_push.append((block, level))
            self.kept_blocks += 1
        else:
            self._pending.append((block, level, env))
            if len(self._pending) == 3:
                (b0, l0, e0), (_, l1, _), (_, l2, _) = self._pending
                to_push.append(self._gate_decide(b0, l0, l1, l2, e0))
                self._pending.pop(0)
        with self._lock:
            for b, lv in to_push:
                self._blocks.append(b)
                self._rms.append(lv)
                self.total_seconds += len(b) / self.sample_rate
        if level > max(SILENCE_RMS, self.gate_rms):
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
    def _gate_decide(self, block, l0: float, l1: float, l2: float, e0: float | None = None):
        """Rozhodne o bloku (l0) podľa dvoch nasledujúcich; dozvuk sa počíta v blokoch, nie v reálnom čase."""
        hangover_blocks = int(round(self.gate_hangover / BLOCK_SECONDS))     # celé bloky – bez chýb float aritmetiky
        sustain_blocks = int(round(self.gate_sustain / BLOCK_SECONDS))
        keep, in_burst = gate_keep3(l0, l1, l2, self.gate_rms, self._since_burst_blocks, hangover_blocks,
                                    env0=e0, sustain=sustain_blocks)
        if in_burst:
            self._since_burst_blocks = 0
        else:
            self._since_burst_blocks += 1
        return self._gate_apply(block, l0, keep)

    def _gate_apply(self, block, level: float, keep: bool):
        if keep:
            self.kept_blocks += 1
            return block, level
        import numpy as np
        self.gated_blocks += 1
        return np.zeros_like(block), 0.0

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
        self._pending = []
        self._since_burst_blocks = 10**6
        self._env = 0.0
        self.gated_blocks = self.kept_blocks = 0
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
            pending, self._pending = self._pending, []
            levels = [item[1] for item in pending] + [0.0, 0.0]
            for i, item in enumerate(pending):           # posledné bloky: „dopredu“ je už len ticho
                b, lv = item[0], item[1]
                if self.gate_rms > 0:
                    b2, lv2 = self._gate_decide(b, levels[i], levels[i + 1], levels[i + 2], item[2] if len(item) > 2 else None)
                else:
                    b2, lv2 = b, lv
                self._blocks.append(b2)
                self._rms.append(lv2)
                self.total_seconds += len(b2) / self.sample_rate
            blocks, self._blocks, self._rms = self._blocks, [], []
        audio = self._concat(blocks)
        log.info("nahrané spolu %.1f s", self.total_seconds)
        return audio

    def seconds(self) -> float:
        return 0.0 if not self.recording else time.monotonic() - self._started_at


def list_devices() -> str:
    import sounddevice as sd
    return str(sd.query_devices())


_BEEPS = {
    "start": [(660, 90), (880, 120)],            # stúpajúce = začínam počúvať
    "stop": [(880, 90), (660, 120)],             # klesajúce = skončil som, prepisujem
    "done": [(880, 80), (1040, 80), (1320, 120)],  # trojtón = vložené
    "error": [(300, 250)],
}


def _beep_sync(kind: str) -> None:
    try:
        import winsound
        for freq, ms in _BEEPS.get(kind, [(700, 120)]):
            winsound.Beep(freq, ms)
    except Exception:  # noqa: BLE001 – zvuk je len kozmetika
        print("\a", end="", flush=True)


def beep(kind: str = "start") -> None:
    """Krátke pípnutie (Windows: winsound; inde terminálový zvonček). Nezdržuje – beží vo vlákne."""
    threading.Thread(target=_beep_sync, args=(kind,), daemon=True).start()


def gated_ratio(gated: int, kept: int) -> float:
    total = gated + kept
    return (gated / total) if total else 0.0
