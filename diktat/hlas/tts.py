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


ENGINES = ("edge", "cartesia", "elevenlabs", "google")
CARTESIA_API = "https://api.cartesia.ai"
CARTESIA_VERSION = "2026-08-14"


def _http_json(url: str, method: str = "GET", headers: dict | None = None, body: dict | None = None, timeout: int = 60):
    import json as _json
    import urllib.request
    data = _json.dumps(body).encode("utf-8") if body is not None else None
    import urllib.error
    req = urllib.request.Request(url, data=data, method=method, headers={"Content-Type": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
    except urllib.error.HTTPError as exc:
        try:
            detail = exc.read().decode("utf-8", "replace")
        except Exception:  # noqa: BLE001
            detail = ""
        raise RuntimeError(http_error_text(url, exc.code, detail)) from None
    ctype = resp.headers.get("Content-Type", "")
    return _json.loads(raw.decode("utf-8")) if "json" in ctype else raw


def http_error_text(url: str, status: int, body: str) -> str:
    """Chybu z API preloží na vetu, ktorá hovorí, čo treba spraviť (najmä Google: kľúč, API, účtovanie)."""
    low = (body or "").lower()
    msg = ""
    try:
        import json as _json
        err = _json.loads(body or "{}").get("error") or {}
        msg = err.get("message") or (err if isinstance(err, str) else "") or ""
    except Exception:  # noqa: BLE001
        msg = (body or "").strip()[:160]
    hint = ""
    if "googleapis.com" in url:
        if "api key not valid" in low or "api_key_invalid" in low:
            hint = "Google: kľúč nesedí – skopíruj ho znova z Google Cloud → APIs & Services → Credentials."
        elif "has not been used" in low or "is disabled" in low or "service_disabled" in low:
            hint = "Google: v projekte nie je zapnuté Cloud Text-to-Speech API – zapni ho (Enable) a skús o minútu."
        elif "billing" in low:
            hint = "Google: projekt nemá zapnuté účtovanie (Billing) – bez neho API nejde ani v bezplatnom limite."
        elif status in (401, 403):
            hint = "Google: prístup odmietnutý – skontroluj kľúč, zapnuté API a účtovanie projektu."
    elif "elevenlabs.io" in url and status in (401, 403):
        hint = "ElevenLabs: kľúč nesedí alebo nemá oprávnenie (Profile → API keys)."
    elif "elevenlabs.io" in url and (status == 402 or "quota" in low):
        hint = "ElevenLabs: minutý mesačný limit znakov – číta záložný hlas, limit sa obnoví ďalší mesiac."
    elif "cartesia.ai" in url and status in (401, 403):
        hint = "Cartesia: kľúč nesedí – skopíruj ho znova z play.cartesia.ai → API Keys."
    elif "cartesia.ai" in url and (status in (402, 429) or "credit" in low or "quota" in low):
        hint = "Cartesia: minutý mesačný limit (20 000 znakov) alebo priveľa požiadaviek – číta záložný hlas."
    return f"HTTP {status}: {msg or 'bez detailu'}" + (f" → {hint}" if hint else "")


def _synth_edge(text: str, voice: str, rate: str, volume: str, out: Path) -> Path:
    import edge_tts

    async def run():
        await edge_tts.Communicate(text, voice, rate=rate, volume=volume).save(str(out))
    asyncio.run(run())
    return out


def _synth_elevenlabs(text: str, voice_id: str, api_key: str, model: str, out: Path) -> Path:
    """ElevenLabs: POST /v1/text-to-speech/{voice_id} → MP3 (model eleven_multilingual_v2 hovorí aj po slovensky)."""
    import urllib.request
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128"
    body = {"text": text, "model_id": model or "eleven_multilingual_v2"}
    req = urllib.request.Request(url, data=__import__("json").dumps(body).encode("utf-8"), method="POST",
                                 headers={"xi-api-key": api_key, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        out.write_bytes(resp.read())
    return out


def _synth_google(text: str, voice_name: str, api_key: str, speaking_rate: float, out: Path) -> Path:
    """Google Cloud Text-to-Speech (REST + API kľúč): sk-SK-Wavenet-A a ďalšie, čo vráti /v1/voices."""
    import base64
    lang = "-".join(voice_name.split("-")[:2]) if voice_name.count("-") >= 2 else "sk-SK"
    res = _http_json(f"https://texttospeech.googleapis.com/v1/text:synthesize?key={api_key}", "POST", body={
        "input": {"text": text},
        "voice": {"languageCode": lang, "name": voice_name},
        "audioConfig": {"audioEncoding": "MP3", "speakingRate": speaking_rate},
    })
    out.write_bytes(base64.b64decode(res["audioContent"]))
    return out


def _synth_cartesia(text: str, voice_id: str, api_key: str, model: str, speed: float, volume: float, out: Path) -> Path:
    """Cartesia Sonic 3 (REST /tts/bytes → MP3). Slovenčina = language "sk"; každý hlas vie hovoriť každým jazykom,
    prirodzene bez prízvuku znejú tie s rodným sk-SK."""
    import urllib.request
    import urllib.error
    body = {
        "model_id": model or "sonic-3",
        "transcript": text,
        "voice": {"id": voice_id},
        "language": "sk",
        "output_format": {"container": "mp3", "bit_rate": 128000, "sample_rate": 44100},
        "generation_config": {"speed": max(0.6, min(1.5, speed)), "volume": max(0.5, min(2.0, volume))},
    }
    req = urllib.request.Request(f"{CARTESIA_API}/tts/bytes", data=__import__("json").dumps(body).encode("utf-8"),
                                 method="POST", headers=_cartesia_headers(api_key))
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            out.write_bytes(resp.read())
    except urllib.error.HTTPError as exc:
        try:
            detail = exc.read().decode("utf-8", "replace")
        except Exception:  # noqa: BLE001
            detail = ""
        raise RuntimeError(http_error_text(f"{CARTESIA_API}/tts/bytes", exc.code, detail)) from None
    return out


def _cartesia_headers(api_key: str) -> dict:
    return {"Authorization": f"Bearer {api_key}", "Cartesia-Version": CARTESIA_VERSION,
            "Content-Type": "application/json"}


def rank_cartesia_voices(voices: list[dict]) -> list[dict]:
    """Zoradí hlasy Cartesie: rodné slovenské (locale sk-*, is_native) → language sk → s pripojeným sk locale →
    ostatné (hovoria po slovensky, ale s prízvukom). Vráti [{id, name, gender, lang, note}]."""
    def sk_rank(v: dict) -> int:
        locales = v.get("locales") or []
        if any(str(l.get("locale", "")).lower().startswith("sk") and l.get("is_native") for l in locales):
            return 0
        if str(v.get("language", "")).lower() == "sk":
            return 1
        if any(str(l.get("locale", "")).lower().startswith("sk") for l in locales):
            return 2
        return 3
    out = []
    for v in voices:
        r = sk_rank(v)
        native = next((l.get("locale") for l in (v.get("locales") or []) if l.get("is_native")), None) or v.get("language", "")
        note = (v.get("tagline") or v.get("description") or "").strip()
        if r == 3:
            note = ("s prízvukom; " + note).strip("; ")
        out.append({"id": v.get("id", ""), "name": v.get("name") or v.get("id", ""),
                    "gender": str(v.get("gender") or "").title(), "lang": str(native or ""), "note": note[:60],
                    "_rank": r})
    out.sort(key=lambda v: (v["_rank"], v["name"].lower()))
    for v in out:
        v.pop("_rank", None)
    return out


def _list_cartesia_voices(api_key: str, max_pages: int = 20) -> list[dict]:
    """Stiahne celý katalóg hlasov (po 100) a vráti ho zoradený cez rank_cartesia_voices."""
    raw: list[dict] = []
    after = None
    for _ in range(max_pages):
        url = f"{CARTESIA_API}/voices?limit=100" + (f"&starting_after={after}" if after else "")
        page = _http_json(url, headers=_cartesia_headers(api_key))
        data = page.get("data", []) if isinstance(page, dict) else []
        raw.extend(data)
        if not data or not (page.get("has_more") if isinstance(page, dict) else False):
            break
        after = data[-1].get("id")
    return rank_cartesia_voices(raw)


def _rate_to_float(rate: str) -> float:
    try:
        return max(0.25, min(4.0, 1.0 + float(str(rate).replace("%", "").replace("+", "")) / 100.0))
    except ValueError:
        return 1.0


def synthesize(text: str, voice: str = DEFAULT_VOICE, rate: str = "+0%", volume: str = "+0%",
               out: Path | None = None, engine: str = "edge", api_key: str | None = None, model: str | None = None) -> Path:
    """Vytvorí MP3 pre text zvoleným enginom. Vráti cestu k súboru."""
    import tempfile
    out = out or Path(tempfile.gettempdir()) / "diktat_tts.mp3"
    engine = (engine or "edge").lower()
    if engine == "elevenlabs":
        if not api_key:
            raise RuntimeError("ElevenLabs: chýba API kľúč (hlas.elevenlabs_api_key alebo ELEVENLABS_API_KEY)")
        return _synth_elevenlabs(text, voice, api_key, model or "eleven_multilingual_v2", out)
    if engine == "google":
        if not api_key:
            raise RuntimeError("Google TTS: chýba API kľúč (hlas.google_api_key alebo GOOGLE_TTS_API_KEY)")
        return _synth_google(text, voice, api_key, _rate_to_float(rate), out)
    if engine == "cartesia":
        if not api_key:
            raise RuntimeError("Cartesia: chýba API kľúč (hlas.cartesia_api_key alebo CARTESIA_API_KEY)")
        if not voice:
            raise RuntimeError("Cartesia: nie je vybraný hlas – spusti hlas_ukazky.bat")
        return _synth_cartesia(text, voice, api_key, model or "sonic-3", _rate_to_float(rate), _rate_to_float(volume), out)
    return _synth_edge(text, voice, rate, volume, out)


def engine_settings(hlas_cfg: dict) -> dict:
    """Z configu (sekcia hlas) vyberie engine, hlas, kľúč a model. Kľúče môžu byť aj v env premenných."""
    import os
    engine = (hlas_cfg.get("engine") or "edge").lower()
    if engine == "elevenlabs":
        return {"engine": engine, "voice": hlas_cfg.get("elevenlabs_voice") or "", "model": hlas_cfg.get("elevenlabs_model") or "eleven_multilingual_v2",
                "api_key": hlas_cfg.get("elevenlabs_api_key") or os.environ.get("ELEVENLABS_API_KEY", "")}
    if engine == "google":
        return {"engine": engine, "voice": hlas_cfg.get("google_voice") or "sk-SK-Wavenet-A", "model": None,
                "api_key": hlas_cfg.get("google_api_key") or os.environ.get("GOOGLE_TTS_API_KEY", "")}
    if engine == "cartesia":
        return {"engine": engine, "voice": hlas_cfg.get("cartesia_voice") or "", "model": hlas_cfg.get("cartesia_model") or "sonic-3",
                "api_key": hlas_cfg.get("cartesia_api_key") or os.environ.get("CARTESIA_API_KEY", "")}
    return {"engine": "edge", "voice": hlas_cfg.get("voice") or DEFAULT_VOICE, "model": None, "api_key": None}


def fallback_settings(hlas_cfg: dict) -> dict | None:
    """Záložný engine (hlas.fallback_engine, predvolene edge = Microsoft, bez limitu), keď hlavný zlyhá
    (minutý mesačný limit, výpadok služby). Prázdny reťazec = bez zálohy. Vráti None, ak je rovnaký ako hlavný."""
    fb = hlas_cfg.get("fallback_engine", "edge")
    if fb is None or str(fb).strip() == "":
        return None
    fb = str(fb).lower()
    if fb == (hlas_cfg.get("engine") or "edge").lower():
        return None
    fb_cfg = {**hlas_cfg, "engine": fb}
    if fb == "edge" and hlas_cfg.get("fallback_voice"):
        fb_cfg["voice"] = hlas_cfg["fallback_voice"]
    return engine_settings(fb_cfg)


def list_engine_voices(engine: str, api_key: str | None = None) -> list[dict]:
    """Zoznam hlasov pre engine ako [{id, name, gender, lang, note}] – slovenské/vhodné prvé."""
    engine = (engine or "edge").lower()
    if engine == "elevenlabs":
        data = _http_json("https://api.elevenlabs.io/v1/voices", headers={"xi-api-key": api_key or ""})
        out = []
        for v in data.get("voices", []):
            labels = v.get("labels") or {}
            out.append({"id": v["voice_id"], "name": v.get("name", v["voice_id"]), "gender": labels.get("gender", ""),
                        "lang": labels.get("language", "") or labels.get("accent", ""), "note": labels.get("description", "") or labels.get("use_case", "")})
        return out
    if engine == "cartesia":
        return _list_cartesia_voices(api_key or "")
    if engine == "google":
        data = _http_json(f"https://texttospeech.googleapis.com/v1/voices?languageCode=sk-SK&key={api_key or ''}")
        out = []
        for v in data.get("voices", []):
            out.append({"id": v["name"], "name": v["name"], "gender": (v.get("ssmlGender") or "").title(),
                        "lang": ",".join(v.get("languageCodes", [])), "note": ""})
        # Chirp3-HD / Wavenet / Neural2 pred Standard
        rank = lambda n: (0 if "Chirp" in n else 1 if "Neural2" in n else 2 if "Wavenet" in n else 3)
        return sorted(out, key=lambda v: (rank(v["id"]), v["id"]))
    voices = candidate_voices(asyncio.run(list_voices_async()))
    return [{"id": v["ShortName"], "name": friendly_name(v["ShortName"]), "gender": v.get("Gender", ""),
             "lang": v.get("Locale", ""), "note": ""} for v in voices]


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


def speak(text: str, voice: str = DEFAULT_VOICE, rate: str = "+0%", volume: str = "+0%",
          engine: str = "edge", api_key: str | None = None, model: str | None = None) -> None:
    """Syntéza + prehratie (blokuje, kým dohovorí)."""
    text = (text or "").strip()
    if not text:
        return
    path = synthesize(text, voice, rate, volume, engine=engine, api_key=api_key, model=model)
    play_file(path)


def speak_cfg(text: str, hlas_cfg: dict, speak_fn=None) -> str:
    """speak() podľa sekcie hlas v configu (engine, hlas, kľúč, rýchlosť). Keď hlavný engine zlyhá (minutý limit,
    výpadok), prehovorí záložný (fallback_settings). Vráti názov enginu, ktorý nakoniec hovoril."""
    do_speak = speak_fn or speak
    es = engine_settings(hlas_cfg)
    rate, volume = hlas_cfg.get("rate", "+0%"), hlas_cfg.get("volume", "+0%")
    try:
        do_speak(text, es["voice"], rate=rate, volume=volume, engine=es["engine"], api_key=es["api_key"], model=es["model"])
        return es["engine"]
    except Exception as exc:  # noqa: BLE001
        fb = fallback_settings(hlas_cfg)
        if fb is None:
            raise
        log.warning("%s zlyhal (%s) – hovorí záložný %s/%s", es["engine"], str(exc)[:160], fb["engine"], fb["voice"])
        do_speak(text, fb["voice"], rate=rate, volume=volume, engine=fb["engine"], api_key=fb["api_key"], model=fb["model"])
        return fb["engine"]


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
