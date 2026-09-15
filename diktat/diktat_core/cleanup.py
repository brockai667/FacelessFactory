"""Čistenie diktovaného textu.

Dve vrstvy:
  * `rules_clean`  – offline pravidlá (výplňové zvuky, "škrtni to", "ignoruj posledné dva riadky",
                     "nový odsek", opakované slová, slovník náhrad). Beží vždy, je deterministické.
  * `llm_clean`    – Claude (Anthropic SDK) rozumie aj voľným opravám ("nie, teda...", "vlastne...")
                     a opraví chyby prepisu podľa kontextu. Voliteľné (potrebuje prihlásenie / kľúč).

`clean()` ich skladá podľa `cleanup.mode` v configu: light (default, zadarmo – len výplne a
interpunkcia, opravy nechá na Claude Code session) | rules | llm | none. „auto" = llm ak je
prihlásenie, inak rules.
Modul úmyselne neimportuje numpy ani anthropic na úrovni modulu, aby fungoval aj v hooku bez závislostí.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass

log = logging.getLogger("diktat.cleanup")

# --- výplňové zvuky -----------------------------------------------------------------------------
# Len čisté zvuky bez významu. Slová ako "no", "proste", "akože" nechávame na LLM – bývajú aj významové.
_FILLER = r"(?:h+m+|e+h+m*|é{1,}|e{2,}|m+h+m+|u+h+|a+h+|ehm+|hmm+)"
_FILLER_RE = re.compile(rf"(?<![\w-])(?:{_FILLER})(?![\w-])[\s,.!?…]*", re.IGNORECASE)

_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?…])\s+")
_DUP_WORD_RE = re.compile(r"\b(\w{2,})(?:\s+\1\b)+", re.IGNORECASE | re.UNICODE)

_NUM_WORDS = {
    "jeden": 1, "jednu": 1, "jedna": 1, "jedno": 1,
    "dva": 2, "dve": 2, "tri": 3, "štyri": 4, "styri": 4, "päť": 5, "pat": 5,
    "šesť": 6, "sest": 6, "sedem": 7, "osem": 8, "deväť": 9, "devat": 9, "desať": 10, "desat": 10,
}

# --- meta-príkazy --------------------------------------------------------------------------------
_CMD_RE = re.compile(
    r"""
    [,;:\s]*
    (?:
        (?P<drop_prev>
            škrtni\s+to | zruš\s+to | zrus\s+to | zabudni\s+na\s+to | vymaž\s+to | vymaz\s+to
          | to\s+nie(?=\s*(?:[,.!?…]|$))
        )
      | (?:ignoruj|vynechaj|zabudni\s+na|zmaž|zmaz|vymaž|vymaz)\s+
        (?:t[úoýy]\s+|tie\s+|tých\s+|tych\s+)?
        posledn[ýúéíáyuei]\w*\s+
        (?:(?P<n>\d+|jeden|jednu|jedna|jedno|dva|dve|tri|štyri|styri|päť|pat|šesť|sest|sedem|osem|deväť|devat|desať|desat)\s+)?
        (?P<unit>riadok|riadky|riadkov|vetu|vety|viet|veta|odsek|odseky|odsekov|bod|body|bodov|myšlienku|myslienku)
      | (?P<para>nov[ýy]\s+odsek)
      | (?P<line>nov[ýy]\s+riadok)
      | (?P<restart>(?:tak\s+)?(?:idem\s+|začnem\s+|zacnem\s+|poviem\s+to\s+)?(?:odznova|od\s+znova|ešte\s+raz\s+od\s+začiatku|este\s+raz\s+od\s+zaciatku|zahoď\s+všetko|zahod\s+vsetko)(?=\s*(?:[,.!?…:]|$)))
    )
    [,;:.!?…\s]*
    """,
    re.IGNORECASE | re.VERBOSE | re.UNICODE,
)

PARA = "\n\n"
LINE = "\n"


@dataclass
class CleanResult:
    text: str
    method: str          # "llm" | "rules" | "none"
    send: bool = False   # používateľ povedal "pošli to" na konci
    raw: str = ""


# --- pomocné funkcie -------------------------------------------------------------------------------
def normalize_ws(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [re.sub(r"[ \t]+", " ", ln).strip() for ln in text.split("\n")]
    text = "\n".join(lines)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def apply_replacements(text: str, mapping: dict | None) -> str:
    """Slovník náhrad (bez ohľadu na veľkosť písmen, celé slová/frázy). Dlhšie frázy majú prednosť."""
    if not mapping:
        return text
    for src in sorted(mapping, key=len, reverse=True):
        pattern = r"(?<!\w)" + re.escape(src) + r"(?!\w)"
        text = re.sub(pattern, mapping[src], text, flags=re.IGNORECASE | re.UNICODE)
    return text


def remove_fillers(text: str) -> str:
    return _FILLER_RE.sub("", text)


def dedupe_words(text: str) -> str:
    return _DUP_WORD_RE.sub(r"\1", text)


def _split_sentences(chunk: str) -> list[str]:
    chunk = chunk.strip()
    if not chunk:
        return []
    return [s for s in _SENTENCE_SPLIT_RE.split(chunk) if s.strip()]


def _pop_sentences(out: list[str], n: int) -> None:
    """Odstráni posledných n viet (zalomenia medzi nimi tiež)."""
    while n > 0 and out:
        item = out.pop()
        if item in (PARA, LINE):
            continue
        n -= 1


def apply_commands(text: str) -> str:
    """Spracuje meta-príkazy: 'škrtni to', 'ignoruj posledné dva riadky', 'nový odsek', 'nový riadok'."""
    out: list[str] = []
    pos = 0
    for m in _CMD_RE.finditer(text):
        before = text[pos:m.start()]
        # zalomenia v pôvodnom texte zachovaj ako odseky
        for para_i, para in enumerate(before.split("\n\n")):
            if para_i:
                out.append(PARA)
            out.extend(_split_sentences(para))
        pos = m.end()
        if m.group("drop_prev"):
            _pop_sentences(out, 1)
        elif m.group("unit"):
            n_raw = (m.group("n") or "1").lower()
            n = int(n_raw) if n_raw.isdigit() else _NUM_WORDS.get(n_raw, 1)
            _pop_sentences(out, n)
        elif m.group("para"):
            if out and out[-1] not in (PARA, LINE):
                out.append(PARA)
        elif m.group("line"):
            if out and out[-1] not in (PARA, LINE):
                out.append(LINE)
        elif m.group("restart"):
            out.clear()
    tail = text[pos:]
    for para_i, para in enumerate(tail.split("\n\n")):
        if para_i:
            out.append(PARA)
        out.extend(_split_sentences(para))

    # poskladaj späť
    pieces: list[str] = []
    for item in out:
        if item in (PARA, LINE):
            if pieces and pieces[-1] not in (PARA, LINE):
                pieces.append(item)
        else:
            if pieces and pieces[-1] not in (PARA, LINE):
                pieces.append(" ")
            pieces.append(item)
    result = "".join(pieces)
    return result.strip()


def tidy_punctuation(text: str) -> str:
    text = re.sub(r"[ \t]+([,.!?…;:])", r"\1", text)
    text = re.sub(r"([,;:])(?=\S)", r"\1 ", text)
    text = re.sub(r"([,.!?…]){2,}", r"\1", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    # veľké písmeno na začiatku každého riadku/odseku
    lines = []
    for ln in text.split("\n"):
        ln = ln.strip()
        if ln and ln[0].isalpha():
            ln = ln[0].upper() + ln[1:]
        lines.append(ln)
    return "\n".join(lines).strip()


def detect_send(text: str, keywords: list[str] | None) -> tuple[str, bool]:
    """Ak text končí kľúčovým slovom ('pošli to'), odstráni ho a vráti send=True."""
    if not keywords:
        return text, False
    stripped = re.sub(r"[\s,.!…]*\bprosím\s*[.!…]*$", "", text.rstrip(), flags=re.IGNORECASE)   # „pošli to prosím“
    for kw in sorted(keywords, key=len, reverse=True):
        pattern = r"[\s,;:-]*" + re.escape(kw) + r"[\s.!…]*$"
        m = re.search(pattern, stripped, flags=re.IGNORECASE | re.UNICODE)
        if m and m.start() > 0:
            return stripped[:m.start()].rstrip(), True
    return text, False


def strip_marker(text: str, markers: list[str] | None) -> tuple[str, bool]:
    """Ak text začína značkou diktátu (🎤, [diktát] ...), odstráni ju a vráti (text, True)."""
    s = text.lstrip()
    for marker in markers or []:
        mk = marker.strip()
        if mk and s.startswith(mk):
            return s[len(mk):].lstrip(), True
    return text, False


# --- vrstva 0: light (predvolené) ----------------------------------------------------------------------
def light_clean(text: str, replacements: dict | None = None) -> str:
    """Neškodné čistenie: výplňové zvuky, opakované slová, slovník náhrad, interpunkcia.
    Opravy a meta-príkazy („škrtni to", „ignoruj posledné dva riadky", „odznova") NECHÁVA v texte –
    vyhodnotí ich Claude Code session podľa pravidiel v CLAUDE.md. Nič sa nestratí, nič nestojí."""
    text = normalize_ws(text)
    text = apply_replacements(text, replacements)
    text = remove_fillers(text)
    text = dedupe_words(text)
    text = tidy_punctuation(text)
    return text


# --- vrstva 1: pravidlá ----------------------------------------------------------------------------
def rules_clean(text: str, replacements: dict | None = None) -> str:
    text = normalize_ws(text)
    text = apply_replacements(text, replacements)
    text = remove_fillers(text)
    text = dedupe_words(text)
    text = apply_commands(text)
    text = tidy_punctuation(text)
    return text


# --- vrstva 2: Claude -----------------------------------------------------------------------------
SYSTEM_PROMPT = """Si editor diktovaného textu. Dostaneš surový automatický prepis slovenskej reči.
Používateľ ním diktuje zadanie pre programovacieho asistenta (Claude Code) – premýšľa nahlas, robí pauzy, mýli sa a opravuje sa.

Vráť ČISTÝ text, ktorý používateľ myslel. Pravidlá:
1. Odstráň výplňové zvuky a slová bez významu (hmm, ehm, eee, mhm, „no", „proste", „akože", „čiže", „vlastne" ak nenesú význam), zakoktania a opakovania slov.
2. Rešpektuj opravy: „nie, teda…", „vlastne…", „pardon…", „škrtni to", „zruš to", „zabudni na to", „to nie" – platí POSLEDNÁ verzia, predchádzajúcu vymaž.
3. Meta-príkazy vykonaj a do výstupu ich nedávaj: „ignoruj posledný riadok / poslednú vetu / posledné dva riadky", „ignoruj to, čo som povedal o X", „nový odsek", „nový riadok". Ak na konci povie „pošli to" / „odošli", vynechaj to.
4. Oprav interpunkciu, veľké písmená a zjavné chyby prepisu podľa kontextu. Technické názvy (súbory, funkcie, knižnice, príkazy, produkty) píš správne anglicky: „git komit" → „git commit", „pajton" → „Python", „džejsón" → „JSON", „pull rekvest" → „pull request", „klaud kód" → „Claude Code".
5. Zachovaj slovenčinu, poradie a VŠETOK obsah myšlienok. Nič nepridávaj, nevysvetľuj, neodpovedaj na zadanie, nesumarizuj, neskracuj. Dlhý súvislý blok rozdeľ na odseky alebo odrážky len tam, kde to diktát prirodzene naznačuje („po prvé…, po druhé…").
6. Nezrozumiteľné miesto ponechaj v hranatých zátvorkách: [nezrozumiteľné: …].

Príklad 1
Vstup: hmm takže chcem aby si eee spravil nový skript ktorý bude ehm sťahovať videá z youtube nie teda z pexels a uloží ich do priečinka assets škrtni to do priečinka broll
Výstup: Chcem, aby si spravil nový skript, ktorý bude sťahovať videá z Pexels a uloží ich do priečinka broll.

Príklad 2
Vstup: prvý bod pridaj testy na funkciu slug nový riadok druhý bod oprav bug v push tu bafer keď zlyhá upload ignoruj posledný riadok druhý bod oprav retry v push tu bafer pošli to
Výstup: 1. Pridaj testy na funkciu slug.
2. Oprav retry v push_to_buffer.

Výstup: iba vyčistený text. Žiadne úvodné vety, žiadne úvodzovky okolo celku, žiadne komentáre."""

_EFFORT_MODELS = ("claude-opus-5", "claude-opus-4-8", "claude-opus-4-7", "claude-opus-4-6",
                  "claude-sonnet-5", "claude-sonnet-4-6", "claude-fable")
_FALLBACK_MODELS = ("claude-opus-5", "claude-fable")


def _request_kwargs(model: str, effort: str) -> dict:
    """Parametre špecifické pre model (effort a server-side fallback len tam, kde ich API prijíma)."""
    kwargs: dict = {}
    if model.startswith(_EFFORT_MODELS):
        kwargs["output_config"] = {"effort": effort}
    if model.startswith(_FALLBACK_MODELS):
        kwargs["betas"] = ["server-side-fallback-2026-07-01"]
        kwargs["fallbacks"] = "default"
    return kwargs


def llm_available() -> bool:
    try:
        import anthropic  # noqa: F401
    except ImportError:
        return False
    return True


def llm_clean(text: str, cleanup_cfg: dict) -> str | None:
    """Vyčistí text cez Claude. Vráti None, ak volanie zlyhá (volajúci použije pravidlá)."""
    try:
        import anthropic
    except ImportError:
        log.warning("anthropic SDK nie je nainštalované – používam len pravidlá")
        return None

    model = cleanup_cfg.get("model", "claude-opus-5")
    effort = cleanup_cfg.get("effort", "low")
    client = anthropic.Anthropic(
        timeout=float(cleanup_cfg.get("timeout_seconds", 25)),
        max_retries=1,
    )
    kwargs = _request_kwargs(model, effort)
    try:
        if "betas" in kwargs:
            response = client.beta.messages.create(
                model=model,
                max_tokens=int(cleanup_cfg.get("max_tokens", 4000)),
                system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
                messages=[{"role": "user", "content": f"<prepis>\n{text}\n</prepis>"}],
                **kwargs,
            )
        else:
            response = client.messages.create(
                model=model,
                max_tokens=int(cleanup_cfg.get("max_tokens", 4000)),
                system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
                messages=[{"role": "user", "content": f"<prepis>\n{text}\n</prepis>"}],
                **kwargs,
            )
    except anthropic.AuthenticationError:
        log.warning("Claude: chýba/neplatný kľúč (ANTHROPIC_API_KEY alebo `ant auth login`) – používam pravidlá")
        return None
    except anthropic.RateLimitError:
        log.warning("Claude: rate limit – používam pravidlá")
        return None
    except anthropic.APIStatusError as exc:
        log.warning("Claude: API chyba %s – používam pravidlá", exc.status_code)
        return None
    except anthropic.APIConnectionError:
        log.warning("Claude: sieťová chyba/timeout – používam pravidlá")
        return None

    if response.stop_reason == "refusal":
        log.warning("Claude: odmietnutie – používam pravidlá")
        return None
    if response.stop_reason == "max_tokens":
        log.warning("Claude: výstup odrezaný (max_tokens) – používam pravidlá")
        return None
    out = "".join(block.text for block in response.content if block.type == "text").strip()
    return out or None


# --- kompozícia ----------------------------------------------------------------------------------
def clean(raw: str, cfg: dict) -> CleanResult:
    """Kompletné čistenie podľa configu. Nikdy nevyhodí výnimku kvôli LLM – padá späť na pravidlá."""
    cleanup_cfg = cfg.get("cleanup", {})
    output_cfg = cfg.get("output", {})
    mode = (cleanup_cfg.get("mode") or "auto").lower()

    if mode == "none":
        text, send = detect_send(normalize_ws(raw), output_cfg.get("send_keywords"))
        return CleanResult(text=text, method="none", send=send, raw=raw)

    if mode == "light":
        text = light_clean(raw, cleanup_cfg.get("replacements"))
        text, send = detect_send(text, output_cfg.get("send_keywords"))
        return CleanResult(text=text, method="light", send=send, raw=raw)

    ruled = rules_clean(raw, cleanup_cfg.get("replacements"))
    ruled, send = detect_send(ruled, output_cfg.get("send_keywords"))

    if mode == "rules" or not ruled:
        return CleanResult(text=ruled, method="rules", send=send, raw=raw)

    if mode in ("auto", "llm"):
        if mode == "auto" and not llm_available():
            return CleanResult(text=ruled, method="rules", send=send, raw=raw)
        try:
            llm_text = llm_clean(ruled, cleanup_cfg)
        except Exception as exc:  # noqa: BLE001 – posledná záchrana, nikdy nesmie zhodiť diktovanie
            log.warning("Claude: neočakávaná chyba %s – používam pravidlá", exc)
            llm_text = None
        if llm_text:
            llm_text, send2 = detect_send(llm_text, output_cfg.get("send_keywords"))
            return CleanResult(text=llm_text, method="llm", send=send or send2, raw=raw)
        return CleanResult(text=ruled, method="rules", send=send, raw=raw)

    raise ValueError(f"Neznámy cleanup.mode: {mode}")
