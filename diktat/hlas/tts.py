"""Prehovor textu neurónovým hlasom (edge-tts, Microsoft, zadarmo) a prehratie cez sounddevice.

Používa ho ukazky.py (výber hlasu) aj mcp_server.py (čítanie zhrnutí zo stránky Diktat hlas).
MP3 z edge-tts dekóduje PyAV (je v závislostiach faster-whisper), prehráva sounddevice – bez ffmpeg.
"""
from __future__ import annotations

import asyncio
import logging
import threading
from pathlib import Path

log = logging.getLogger("diktat.tts")
DEFAULT_VOICE = "sk-SK-LukasNeural"
_play_lock = threading.Lock()


def synthesize(text: str, voice: str = DEFAULT_VOICE, rate: str = "+0%", volume: str = "+0%",
               out: Path | None = None) -> Path:
    """Vytvorí MP3 pre text (edge-tts). Vráti cestu k súboru."""
    import tempfile
    import edge_tts
    out = out or Path(tempfile.gettempdir()) / "diktat_tts.mp3"

    async def run():
        await edge_tts.Communicate(text, voice, rate=rate, volume=volume).save(str(out))
    asyncio.run(run())
    return out


def decode_mp3(path: Path, sample_rate: int = 24000):
    """MP3 → numpy float32 mono (PyAV)."""
    import av
    import numpy as np
    container = av.open(str(path))
    stream = container.streams.audio[0]
    resampler = av.AudioResampler(format="flt", layout="mono", rate=sample_rate)
    chunks = []
    for frame in container.decode(stream):
        for f in resampler.resample(frame):
            chunks.append(f.to_ndarray().reshape(-1))
    for f in resampler.resample(None):
        chunks.append(f.to_ndarray().reshape(-1))
    container.close()
    if not chunks:
        return np.zeros(0, dtype="float32"), sample_rate
    return np.concatenate(chunks).astype("float32"), sample_rate


def play_file(path: Path) -> None:
    import sounddevice as sd
    data, sr = decode_mp3(path)
    if not len(data):
        return
    with _play_lock:
        sd.play(data, sr)
        sd.wait()


def stop() -> None:
    try:
        import sounddevice as sd
        sd.stop()
    except Exception:  # noqa: BLE001
        pass


def speak(text: str, voice: str = DEFAULT_VOICE, rate: str = "+0%", volume: str = "+0%") -> None:
    """Syntéza + prehratie (blokuje, kým dohovorí)."""
    text = (text or "").strip()
    if not text:
        return
    path = synthesize(text, voice, rate, volume)
    play_file(path)


async def list_voices_async() -> list[dict]:
    import edge_tts
    return await edge_tts.list_voices()


def candidate_voices(all_voices: list[dict]) -> list[dict]:
    """Slovenské, české a viacjazyčné hlasy (tie hovoria po slovensky tiež), v tomto poradí."""
    sk = [v for v in all_voices if v.get("Locale", "").startswith("sk-")]
    cs = [v for v in all_voices if v.get("Locale", "").startswith("cs-")]
    multi = [v for v in all_voices if "Multilingual" in v.get("ShortName", "") and v not in sk and v not in cs]
    return sk + cs + multi


def friendly_name(short_name: str) -> str:
    """'sk-SK-LukasNeural' → 'Lukas', 'en-US-AvaMultilingualNeural' → 'Ava'."""
    base = short_name.split("-")[-1]
    for suffix in ("MultilingualNeural", "Neural"):
        if base.endswith(suffix):
            base = base[: -len(suffix)]
    return base
