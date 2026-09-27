# -*- coding: utf-8 -*-
"""Groq (OpenAI-kompatibilne API, zadarmo) -> JSON. Kluc: GROQ_API_KEY / MODELS_TOKEN z prostredia, inak z .env
(FactoryAnim/.env, potom ~/.config/watch/.env). Kluc sa nikdy nevypisuje."""
import json
import os
import re
import time

import requests

BASE = os.environ.get("MODELS_BASE_URL", "https://api.groq.com/openai/v1")
MODEL = os.environ.get("MODELS_MODEL", "openai/gpt-oss-120b")
FALLBACK = os.environ.get("MODELS_FALLBACK", "qwen/qwen3.8-27b")
ENV_FILES = [os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
             os.path.join(os.path.expanduser("~"), ".config", "watch", ".env")]


def _key():
    k = os.environ.get("GROQ_API_KEY") or os.environ.get("MODELS_TOKEN")
    if k:
        return k
    for f in ENV_FILES:
        if os.path.exists(f):
            for line in open(f, encoding="utf-8", errors="ignore"):
                m = re.match(r"\s*(GROQ_API_KEY|MODELS_TOKEN)\s*=\s*(.+?)\s*$", line)
                if m and m.group(2).strip('"\''):
                    return m.group(2).strip('"\'')
    raise RuntimeError("Chyba GROQ_API_KEY (FactoryAnim/.env alebo ~/.config/watch/.env)")


def _json(txt):
    txt = re.sub(r"^```(?:json)?\s*|\s*```$", "", txt.strip(), flags=re.S)
    try:
        return json.loads(txt)
    except Exception:
        i, j = txt.find("{"), txt.rfind("}")
        if i != -1 and j > i:
            return json.loads(txt[i:j + 1])
        raise ValueError("LLM nevratil JSON: " + txt[:200])


def llm_json(system, prompt, temperature=0.8, max_tokens=6000, effort="medium"):
    key, last = _key(), None
    for model, tries in ((MODEL, 5), (FALLBACK, 2)):
        for att in range(tries):
            try:
                body = {"model": model, "temperature": temperature, "max_tokens": max_tokens, "response_format": {"type": "json_object"},
                        "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}]}
                if "gpt-oss" in model:
                    body["reasoning_effort"] = effort
                r = requests.post(BASE.rstrip("/") + "/chat/completions", headers={"Authorization": f"Bearer {key}"}, json=body, timeout=180)
                if r.status_code == 429:
                    why = re.sub(r"\s+", " ", r.text)[:160]
                    if "per day" in why or "TPD" in why:
                        print(f"   [llm] denny limit {model} -> dalsi model")
                        break
                    wait = min(90, float(r.headers.get("retry-after", 20)) + 2)
                    print(f"   [llm] 429 {model}, cakam {wait:.0f} s")
                    time.sleep(wait)
                    continue
                r.raise_for_status()
                txt = r.json()["choices"][0]["message"]["content"] or ""
                if not txt.strip():
                    raise ValueError("prazdna odpoved")
                return _json(txt)
            except Exception as e:
                last = e
                print(f"   [llm] {model} pokus {att + 1}: {str(e)[:140]}")
                time.sleep(3 + 3 * att)
    raise RuntimeError(f"LLM zlyhal: {last}")
