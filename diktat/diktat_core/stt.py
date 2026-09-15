"""Prepis reči na text (speech-to-text).

Primárne lokálny faster-whisper (Whisper large-v3-turbo, slovenčina, bez internetu).
Voliteľne OpenAI Whisper API ako záloha pre slabý počítač (rýchle, ~0,006 USD/min).
"""
from __future__ import annotations

import logging
import os
import platform
from typing import Protocol

log = logging.getLogger("diktat.stt")


class Backend(Protocol):
    def transcribe(self, audio, language: str) -> str: ...


def _auto_device_and_compute(device: str, compute_type: str) -> tuple[str, str]:
    dev = (device or "auto").lower()
    if dev == "auto":
        try:
            import ctranslate2
            dev = "cuda" if ctranslate2.get_cuda_device_count() > 0 else "cpu"
        except Exception:  # noqa: BLE001
            dev = "cpu"
    ct = (compute_type or "auto").lower()
    if ct == "auto":
        ct = "float16" if dev == "cuda" else "int8"
    return dev, ct


class FasterWhisperBackend:
    """Lokálny prepis cez faster-whisper (CTranslate2). Model sa stiahne pri prvom spustení."""

    def __init__(self, model: str = "large-v3-turbo", device: str = "auto", compute_type: str = "auto",
                 beam_size: int = 5, vad_filter: bool = True, initial_prompt: str = ""):
        self.model_name = model
        self.device, self.compute_type = _auto_device_and_compute(device, compute_type)
        self.beam_size = int(beam_size)
        self.vad_filter = bool(vad_filter)
        self.initial_prompt = initial_prompt or None
        self._model = None

    def load(self) -> None:
        if self._model is not None:
            return
        from faster_whisper import WhisperModel
        log.info("načítavam Whisper model %s (%s/%s)…", self.model_name, self.device, self.compute_type)
        self._model = WhisperModel(self.model_name, device=self.device, compute_type=self.compute_type)
        log.info("model pripravený")

    def transcribe(self, audio, language: str = "sk") -> str:
        self.load()
        segments, info = self._model.transcribe(
            audio,
            language=language or None,
            beam_size=self.beam_size,
            vad_filter=self.vad_filter,
            initial_prompt=self.initial_prompt,
            condition_on_previous_text=False,
        )
        parts = [seg.text.strip() for seg in segments if seg.text and seg.text.strip()]
        text = " ".join(parts).strip()
        log.info("prepis hotový (%d segmentov, jazyk %s)", len(parts), getattr(info, "language", language))
        return text


class OpenAIWhisperBackend:
    """Záloha: OpenAI Audio API (whisper-1 / gpt-4o-transcribe). Potrebuje OPENAI_API_KEY."""

    def __init__(self, model: str = "whisper-1", api_key_env: str = "OPENAI_API_KEY",
                 initial_prompt: str = "", sample_rate: int = 16000):
        self.model = model
        self.api_key = os.environ.get(api_key_env, "")
        self.initial_prompt = initial_prompt or ""
        self.sample_rate = int(sample_rate)
        if not self.api_key:
            raise RuntimeError(f"Chýba {api_key_env} pre backend openai")

    def _to_wav_bytes(self, audio) -> bytes:
        import io
        import wave
        import numpy as np
        pcm = (np.clip(audio, -1.0, 1.0) * 32767).astype("<i2").tobytes()
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(self.sample_rate)
            wf.writeframes(pcm)
        return buf.getvalue()

    def transcribe(self, audio, language: str = "sk") -> str:
        import requests
        if isinstance(audio, (str, os.PathLike)):
            with open(audio, "rb") as fh:
                data = fh.read()
            filename = os.path.basename(str(audio))
        else:
            data = self._to_wav_bytes(audio)
            filename = "diktat.wav"
        resp = requests.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            files={"file": (filename, data)},
            data={"model": self.model, "language": language, "prompt": self.initial_prompt,
                  "response_format": "json"},
            timeout=120,
        )
        resp.raise_for_status()
        return (resp.json().get("text") or "").strip()


def make_backend(cfg: dict) -> Backend:
    stt = cfg.get("stt", {})
    backend = (stt.get("backend") or "faster-whisper").lower()
    if backend in ("faster-whisper", "whisper", "local"):
        return FasterWhisperBackend(
            model=stt.get("model", "large-v3-turbo"),
            device=stt.get("device", "auto"),
            compute_type=stt.get("compute_type", "auto"),
            beam_size=stt.get("beam_size", 5),
            vad_filter=stt.get("vad_filter", True),
            initial_prompt=stt.get("initial_prompt", ""),
        )
    if backend == "openai":
        return OpenAIWhisperBackend(
            model=stt.get("openai_model", "whisper-1"),
            api_key_env=stt.get("openai_api_key_env", "OPENAI_API_KEY"),
            initial_prompt=stt.get("initial_prompt", ""),
            sample_rate=cfg.get("audio", {}).get("sample_rate", 16000),
        )
    raise ValueError(f"Neznámy stt.backend: {backend}")


def platform_note() -> str:
    return f"{platform.system()} {platform.release()} / Python {platform.python_version()}"
