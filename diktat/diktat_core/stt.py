"""Prepis reči na text (speech-to-text).

Primárne lokálny faster-whisper (Whisper large-v3-turbo, slovenčina, bez internetu).
Voliteľne OpenAI Whisper API ako záloha pre slabý počítač (rýchle, ~0,006 USD/min).
"""
from __future__ import annotations

import logging
import os
import platform
import re
import site
import threading
import unicodedata
from pathlib import Path
from typing import Protocol

log = logging.getLogger("diktat.stt")

_CUDA_ERROR_HINTS = ("cublas", "cudnn", "cuda", "nvrtc", "cublasLt")


def _looks_like_missing_cuda(exc: BaseException) -> bool:
    msg = str(exc).lower()
    return any(h.lower() in msg for h in _CUDA_ERROR_HINTS)


def prepare_cuda_dll_dirs() -> list[str]:
    """Windows: `pip install nvidia-cublas-cu12 nvidia-cudnn-cu12` uloží DLL do site-packages/nvidia/*/bin,
    ale ctranslate2 ich tam nehľadá. Pridáme tie priečinky na PATH (a do DLL search path)."""
    if platform.system() != "Windows":
        return []
    added: list[str] = []
    roots = list(site.getsitepackages())
    try:
        roots.append(site.getusersitepackages())
    except Exception:  # noqa: BLE001
        pass
    for root in roots:
        base = Path(root) / "nvidia"
        if not base.is_dir():
            continue
        for sub in ("cublas", "cudnn", "cuda_runtime", "cuda_nvrtc"):
            d = base / sub / "bin"
            if d.is_dir() and str(d) not in added:
                os.environ["PATH"] = str(d) + os.pathsep + os.environ.get("PATH", "")
                try:
                    os.add_dll_directory(str(d))
                except Exception:  # noqa: BLE001
                    pass
                added.append(str(d))
    if added:
        log.debug("CUDA DLL priečinky: %s", added)
    return added


class Backend(Protocol):
    def transcribe(self, audio, language: str, context: str | None = None) -> str: ...


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


def segment_ok(avg_logprob: float, no_speech_prob: float, min_avg_logprob: float, max_no_speech_prob: float) -> bool:
    """Úsek prejde, ak má Whisper dostatočnú istotu (avg_logprob) a nemyslí si, že tam nebola reč."""
    if avg_logprob is not None and avg_logprob < min_avg_logprob:
        return False
    if no_speech_prob is not None and no_speech_prob > max_no_speech_prob:
        return False
    return True


def _norm(text: str) -> str:
    """Na porovnávanie: malé písmená, bez diakritiky, bez interpunkcie a zátvoriek."""
    t = unicodedata.normalize("NFKD", (text or "").lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return " ".join(re.sub(r"[^a-z0-9 ]+", " ", t).split())


# Vety, ktoré si Whisper vymýšľa v tichu (naučil sa ich z titulkov k videám). Sem patria len také,
# ktoré pri diktovaní do Claude nikto reálne nepovie.
HALLUCINATION_EXACT = (
    "dakujem za pozornost", "dakujem vam za pozornost", "dakujem za sledovanie",
    "dakujeme za sledovanie", "dekuji za pozornost", "dekujeme za sledovani",
    "prihlaste sa na odber", "nezabudnite sa prihlasit na odber",
    "pokracovanie nabuduce", "uvidime sa nabuduce", "koniec videa",
    "hudba", "music", "smiech", "potlesk", "applause", "laughter", "silence", "ticho",
)
# Útržky, ktoré stačí nájsť kdekoľvek v texte – kredity z titulkov.
HALLUCINATION_MARKS = (
    "amara", "titulky vytvoril", "titulky pre", "preklad a titulky", "subtitles by",
    "subtitled by", "transcribed by", "slovenske titulky", "ceske titulky",
)


_WORD = re.compile(r"\w+", re.UNICODE)


def collapse_repeats(text: str, min_times: int = 4) -> str:
    """„ten, ten, ten, ten, ten“ → „ten“. Whisper sa v tichu alebo na konci kúska zacyklí na jednom slove
    a opakuje ho desaťkrát. Zlúči sa až od štyroch opakovaní za sebou – „nie, nie, nie“ človek povie."""
    pattern = re.compile(r"\b(\w+(?:\s+\w+){0,2})(?:[\s,;.!?…-]+\1\b){%d,}" % (min_times - 1),
                         re.IGNORECASE | re.UNICODE)
    prev = None
    while prev != text:
        prev, text = text, pattern.sub(r"\1", text)
    return text


def strip_prompt_echo(text: str, prompt: str | None, min_run: int = 4) -> str:
    """Vyhodí z textu kus, ktorý Whisper opísal z `initial_prompt` („Python, git, commit, pull request…“).
    Keď v kúsku skoro nie je reč, model namiesto nej zopakuje zoznam slov z promptu. Za únik sa berú
    aspoň štyri slová za sebou v tom istom poradí ako v prompte – v naozajstnej vete sa to nestane.
    Keď po vyhodení zostane najviac jedno slovo, zahodí sa všetko."""
    vocab = [_norm(w) for w in _WORD.findall(prompt or "")]
    if len(vocab) < min_run or not text:
        return text
    words = list(_WORD.finditer(text))
    norms = [_norm(m.group()) for m in words]
    cuts: list[tuple[int, int]] = []
    i = 0
    while i < len(words):
        best = 0
        for j, v in enumerate(vocab):
            if v != norms[i]:
                continue
            k = 0
            while i + k < len(words) and j + k < len(vocab) and norms[i + k] == vocab[j + k]:
                k += 1
            best = max(best, k)
        if best >= min_run:
            cuts.append((words[i].start(), words[i + best - 1].end()))
            i += best
        else:
            i += 1
    if not cuts:
        return text
    out, pos = [], 0
    for a, b in cuts:
        out.append(text[pos:a])
        pos = b
    out.append(text[pos:])
    rest = re.sub(r"\s*([,;.])(?:\s*[,;.])+", r"\1", "".join(out))
    rest = rest.lstrip(" ,;.:-").rstrip(" ,;:-")       # bodka na konci vety patrí k vete
    return rest if len(_WORD.findall(rest)) >= 2 else ""


def _units(text: str) -> list[str]:
    return [u for u in (_norm(p) for p in re.split(r"[.!?…]+", text or "")) if u]


def is_hallucination(text: str, prev: str = "") -> bool:
    """True, keď úsek vyzerá ako vymyslený: známa fráza z titulkov, doslovné zopakovanie už prepísaného
    textu, alebo tá istá veta niekoľkokrát za sebou."""
    norm = _norm(text)
    if not norm:
        return True
    if norm in HALLUCINATION_EXACT:
        return True
    if any(m in norm for m in HALLUCINATION_MARKS):
        return True
    prev_norm = _norm(prev)
    if len(norm) >= 10 and prev_norm.endswith(norm):
        return True
    units = _units(text)
    return len(units) >= 3 and len(set(units)) == 1


class FasterWhisperBackend:
    """Lokálny prepis cez faster-whisper (CTranslate2). Model sa stiahne pri prvom spustení."""

    def __init__(self, model: str = "large-v3-turbo", device: str = "auto", compute_type: str = "auto",
                 beam_size: int = 5, vad_filter: bool = True, initial_prompt: str = "",
                 min_avg_logprob: float = -1.0, max_no_speech_prob: float = 0.7,
                 use_context: bool = False, drop_hallucinations: bool = True,
                 hallucination_silence_seconds: float = 0.0):
        self.min_avg_logprob = float(min_avg_logprob)       # úseky s nižšou istotou = útržky/nezmysly → zahodiť
        self.max_no_speech_prob = float(max_no_speech_prob)
        self.use_context = bool(use_context)                # posielať predchádzajúci text modelu? (v tichu ho opakuje)
        self.drop_hallucinations = bool(drop_hallucinations)
        self.hallucination_silence_seconds = float(hallucination_silence_seconds or 0.0)
        self.model_name = model
        self.device, self.compute_type = _auto_device_and_compute(device, compute_type)
        self.beam_size = int(beam_size)
        self.vad_filter = bool(vad_filter)
        self.initial_prompt = initial_prompt or None
        self._model = None
        self._load_lock = threading.RLock()

    def _fallback_to_cpu(self, exc: BaseException) -> None:
        log.warning("CUDA knižnice chýbajú (%s). Prepínam na CPU/int8 – pomalšie, ale funguje. "
                    "GPU zapneš podľa README (sekcia GPU).", str(exc).splitlines()[0][:120])
        self.device, self.compute_type = "cpu", "int8"
        self._model = None

    def _build(self):
        """Postaví model – najprv z lokálnej cache. Bez `local_files_only` sa faster-whisper pri každom
        načítaní pýta Hugging Face, či nie je novšia verzia; keď je internet pomalý alebo žiadny, čaká sa
        na to zbytočne."""
        from faster_whisper import WhisperModel
        where = dict(device=self.device, compute_type=self.compute_type)
        try:
            return WhisperModel(self.model_name, local_files_only=True, **where)
        except RuntimeError:
            raise                                    # napr. chýbajúce CUDA knižnice – to rieši load()
        except Exception as exc:                     # noqa: BLE001 – v cache ešte nie je, stiahni ho
            log.info("model nie je v cache (%s), sťahujem…", type(exc).__name__)
            return WhisperModel(self.model_name, **where)

    def load(self) -> None:
        """Načíta model, ale len raz. Zámok je tu preto, že model chcú dve vlákna naraz: pri štarte
        nahrávania ho načítava vlákno na pozadí a priebežný prepis prvého kúska si ho vyžiada tiež.
        Samotná kontrola `_model is not None` na to nestačí – kým sa prvý načítava, je stále None, takže
        sa začal načítavať druhýkrát a dva súbežné modely si na grafickej karte tak prekážali, že z 9
        sekúnd bolo 60."""
        if self._model is not None:
            return
        with self._load_lock:
            if self._model is not None:              # načítalo ho druhé vlákno, kým sme čakali na zámok
                return
            if self.device == "cuda":
                prepare_cuda_dll_dirs()
            log.info("načítavam Whisper model %s (%s/%s)…", self.model_name, self.device, self.compute_type)
            try:
                self._model = self._build()
            except RuntimeError as exc:
                if self.device == "cuda" and _looks_like_missing_cuda(exc):
                    self._fallback_to_cpu(exc)
                    self._model = self._build()
                else:
                    raise
            log.info("model pripravený (%s/%s)", self.device, self.compute_type)

    def unload(self) -> bool:
        """Uvoľní model z RAM (1,5–3,5 GB). Ďalší transcribe() ho načíta znova."""
        if self._model is None:
            return False
        self._model = None
        import gc
        gc.collect()
        log.info("model uvoľnený z pamäte (nečinnosť)")
        return True

    @property
    def loaded(self) -> bool:
        return self._model is not None

    def warm_up(self, language: str = "sk") -> None:
        """Krátky prepis ticha: ak chýbajú CUDA knižnice, prepne sa na CPU už teraz, nie pri prvom diktáte."""
        import numpy as np
        self.transcribe(np.zeros(16000, dtype="float32"), language=language)

    def _run(self, audio, language: str, context: str | None = None) -> tuple[list[str], object]:
        prompt = self.initial_prompt or ""
        if context and self.use_context:
            prompt = (prompt + " " + context).strip()[-600:]   # koniec predchádzajúceho kúsku = nadväznosť
        kwargs = dict(
            language=language or None,
            beam_size=self.beam_size,
            vad_filter=self.vad_filter,
            initial_prompt=prompt or None,
            condition_on_previous_text=False,
        )
        if self.hallucination_silence_seconds > 0:
            kwargs["word_timestamps"] = True
            kwargs["hallucination_silence_threshold"] = self.hallucination_silence_seconds
        try:
            segments, info = self._model.transcribe(audio, **kwargs)
        except TypeError:   # staršia verzia faster-whisper tieto parametre nepozná
            for k in ("word_timestamps", "hallucination_silence_threshold"):
                kwargs.pop(k, None)
            segments, info = self._model.transcribe(audio, **kwargs)
        # generátor je lenivý – chyby CUDA vyskočia až tu
        parts = []
        seen = context or ""
        for seg in segments:
            text = (seg.text or "").strip()
            if not text:
                continue
            if self.drop_hallucinations:
                cleaned = strip_prompt_echo(collapse_repeats(text), self.initial_prompt)
                if cleaned != text:
                    log.info("upravený úsek: „%s“ → „%s“", text[:60], cleaned[:60])
                text = cleaned
                if not text:
                    continue
            if not segment_ok(getattr(seg, "avg_logprob", 0.0), getattr(seg, "no_speech_prob", 0.0),
                              self.min_avg_logprob, self.max_no_speech_prob):
                log.info("zahodený úsek (istota %.2f, ticho %.2f): „%s“",
                         getattr(seg, "avg_logprob", 0.0), getattr(seg, "no_speech_prob", 0.0), text[:60])
                continue
            if self.drop_hallucinations and is_hallucination(text, seen):
                log.info("zahodený vymyslený úsek: „%s“", text[:60])
                continue
            parts.append(text)
            seen = (seen + " " + text).strip()[-600:]
        return parts, info

    def transcribe(self, audio, language: str = "sk", context: str | None = None) -> str:
        self.load()
        try:
            parts, info = self._run(audio, language, context)
        except RuntimeError as exc:
            if self.device == "cuda" and _looks_like_missing_cuda(exc):
                self._fallback_to_cpu(exc)
                self.load()
                parts, info = self._run(audio, language, context)
            else:
                raise
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

    def transcribe(self, audio, language: str = "sk", context: str | None = None) -> str:
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
            min_avg_logprob=stt.get("min_avg_logprob", -1.0),
            max_no_speech_prob=stt.get("max_no_speech_prob", 0.7),
            use_context=stt.get("use_context", False),
            drop_hallucinations=stt.get("drop_hallucinations", True),
            hallucination_silence_seconds=stt.get("hallucination_silence_seconds", 0.0),
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
