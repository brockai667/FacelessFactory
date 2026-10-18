# -*- coding: utf-8 -*-
"""Offline test factcheck.py: Groq aj Wikipedia su nahradene atrapami (ziadna siet, ziaden kluc).
  python engine/test_factcheck.py      -> 0 = OK
Dokazuje: contradicted -> volanie prepisania a opravene riadky | stale zle -> rejected (presun, nie zmazanie) |
vypadok Wikipedie/Groq -> nekontrolovane (ok = null), nic nepadne | 413 -> kratsi zdroj | poradie fronty."""
import copy
import json
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import factcheck as fc  # noqa: E402

ARTICLE = ("The Rendlesham Forest incident was a series of reported sightings in December 1980. " +
           "Filler sentence about the weather in Suffolk. " * 40 +
           "Staff Sergeant Jim Penniston said he touched the craft. " + "More filler about forests and trees. " * 30)

SPEC = {
    "title": "Rendlesham Lights", "topic": "Rendlesham Lights", "source": "groq", "hook": "In 1980, airmen saw lights over a forest.",
    "beats": [
        {"label": "1", "line": "Sgt. Jim Pennant touched the craft near the trees.",
         "shots": [{"type": "world", "do": [{"r": "face", "arg": "shocked", "at": "Pennant"}, {"r": "pain", "at": "craft"}]}]},
        {"label": "2", "line": "The lights appeared in December 1980.", "shots": [{"type": "world", "do": [{"r": "stars", "at": "lights"}]}]},
    ],
    "end": {"line": "Would you have gone closer?", "do": []},
    "facts": [{"claim": "x", "source": "Physics textbooks"}],
}


def make_mocks(fix_works=True, checks=None, wiki="ok", llm_down=False, e413=0):
    st = {"check": 0, "fix": 0, "wiki": 0, "srclen": [], "e413": e413}

    def articles(queries, n=2):
        st["wiki"] += 1
        if wiki == "down":
            raise ConnectionError("wikipedia down")
        return [("Rendlesham Forest incident", ARTICLE)] if wiki == "ok" else []

    def llm(system, prompt, **kw):
        if llm_down:
            raise RuntimeError("LLM zlyhal: test")
        if "fact-checker" in system:
            st["check"] += 1
            if st["e413"] > 0:
                st["e413"] -= 1
                st["srclen"].append(len(prompt))
                raise ValueError("413 prompt je prilis velky")
            st["srclen"].append(len(prompt))
            cl = []
            for line in prompt.split("TEXTS (id: text):\n")[1].splitlines():
                iid, _, txt = line.partition(": ")
                iid = iid.split(" ")[0]
                bad = "Pennant" in txt
                cl.append({"id": iid, "claim": txt[:40], "verdict": "contradicted" if bad else "supported", "specific": True,
                           "correction": "the witness is Jim Penniston" if bad else ""})
            return {"claims": cl}
        if "copy editor" in system:
            st["fix"] += 1
            assert "Pennant" in prompt and "Penniston" in prompt and "In 1980, airmen" not in prompt, "prepisanie dostalo cely scenar"
            return {"fixes": [{"id": "b0", "text": "Sgt. Jim Penniston touched the craft near the trees." if fix_works else "Sgt. Jim Pennant touched the craft near trees."}]}
        raise AssertionError("neocakavane volanie LLM: " + system[:40])
    return st, articles, llm


def patched(**kw):
    st, art, llm = make_mocks(**kw)
    fc.wiki_articles, fc._llm = art, llm
    fc.source_queries = lambda S: ["Rendlesham Forest incident"]
    return st


def test_select_text():
    t = fc.select_text(ARTICLE, "Sgt. Jim Pennant touched the craft", 600)
    assert "Penniston" in t and len(t) <= 600, "vyber viet ma najst vetu s Penniston aj pri preklepe"


def test_fixed():
    st = patched()
    S = copy.deepcopy(SPEC)
    r = fc.check_spec(S)
    assert r == "ok" and S["factcheck"]["ok"] is True, S["factcheck"]
    assert st["fix"] == 1 and st["check"] == 2, st
    assert S["beats"][0]["line"].startswith("Sgt. Jim Penniston") and S["factcheck"]["fixed"] == 1
    assert S["facts"][0]["source"] == "https://en.wikipedia.org/wiki/Rendlesham_Forest_incident", S["facts"]
    assert S["factcheck"]["source"] == [S["facts"][0]["source"]] and S["factcheck"]["checked_at"]
    anchors = [d["at"] for d in S["beats"][0]["shots"][0]["do"]]
    assert anchors[0] != "Pennant" and anchors[0].lower() in S["beats"][0]["line"].lower(), "kotva sa mala opravit: %s" % anchors


def test_rejected():
    st = patched(fix_works=False)
    S = copy.deepcopy(SPEC)
    assert fc.check_spec(S) == "rejected" and S["factcheck"]["ok"] is False
    assert st["fix"] == 1 and st["check"] == 2 and S["factcheck"]["bad"], st
    assert S["facts"][0]["source"] == "Physics textbooks", "zamietnuty scenar nema dostat Wikipedia zdroj"


def test_unchecked():
    for kw in ({"wiki": "down"}, {"wiki": "none"}, {"llm_down": True}):
        st = patched(**kw)
        S = copy.deepcopy(SPEC)
        r = fc.check_spec(S)
        assert r == "unchecked" and S["factcheck"]["ok"] is None, (kw, S["factcheck"])
        assert S["beats"][0]["line"].startswith("Sgt. Jim Pennant"), "nekontrolovany scenar sa nemeni"


def test_413():
    st = patched(e413=1)
    S = copy.deepcopy(SPEC)
    assert fc.check_spec(S) == "ok", S["factcheck"]
    assert st["srclen"][1] < st["srclen"][0], ("po 413 ma byt zdroj kratsi", st["srclen"])


def test_queue_and_priority():
    patched(fix_works=False)
    d = tempfile.mkdtemp()
    fc.QDIR, fc.RDIR = os.path.join(d, "queue"), os.path.join(d, "queue_rejected")
    fc.FACTORY = d
    os.makedirs(fc.QDIR)
    used = []
    fc.mark_topic_used = lambda S: used.append(S.get("topic"))
    good = copy.deepcopy(SPEC)
    good["beats"][0]["line"] = "Sgt. Jim Penniston touched the craft near the trees."
    claude = dict(copy.deepcopy(SPEC), source="claude")
    done = dict(copy.deepcopy(SPEC), factcheck={"ok": True})
    for n, S in (("901-groq-bad.json", copy.deepcopy(SPEC)), ("902-groq-good.json", good), ("003-claude.json", claude), ("904-groq-done.json", done)):
        json.dump(S, open(os.path.join(fc.QDIR, n), "w", encoding="utf-8"))
    stat = fc.run_queue()
    assert stat == {"ok": 1, "rejected": 1, "unchecked": 0, "skipped": 2}, stat
    assert sorted(os.listdir(fc.QDIR)) == ["003-claude.json", "902-groq-good.json", "904-groq-done.json"], os.listdir(fc.QDIR)
    rej = json.load(open(os.path.join(fc.RDIR, "901-groq-bad.json"), encoding="utf-8"))
    assert rej["factcheck"]["ok"] is False and used == ["Rendlesham Lights"]
    assert json.load(open(os.path.join(fc.QDIR, "902-groq-good.json"), encoding="utf-8"))["factcheck"]["ok"] is True
    assert json.load(open(os.path.join(fc.QDIR, "003-claude.json"), encoding="utf-8")).get("factcheck") is None, "Claude scenar sa nekontroluje"
    # sieť nefunguje: scenar ostane vo fronte, bez vynimky
    patched(wiki="down")
    json.dump(copy.deepcopy(SPEC), open(os.path.join(fc.QDIR, "905-groq-net.json"), "w", encoding="utf-8"))
    assert fc.run_queue()["unchecked"] == 1 and os.path.exists(os.path.join(fc.QDIR, "905-groq-net.json"))
    pr = [fc.queue_priority(S) for S in (claude, done, SPEC, dict(SPEC, factcheck={"ok": False}))]
    assert pr == [0, 0, 1, 2], pr


def run():
    keep = (fc.wiki_articles, fc._llm, fc.source_queries, fc.QDIR, fc.RDIR, fc.FACTORY, fc.mark_topic_used)
    errs = []
    try:
        for t in (test_select_text, test_fixed, test_rejected, test_unchecked, test_413, test_queue_and_priority):
            try:
                t()
            except Exception as e:
                import traceback
                errs.append(f"{t.__name__}: {type(e).__name__}: {str(e)[:300]}")
                traceback.print_exc()
    finally:
        fc.wiki_articles, fc._llm, fc.source_queries, fc.QDIR, fc.RDIR, fc.FACTORY, fc.mark_topic_used = keep
    return errs


if __name__ == "__main__":
    errs = run()
    print("test_factcheck:", "OK (6 testov)" if not errs else f"{len(errs)} chyb")
    for e in errs:
        print("  CHYBA:", e)
    sys.exit(1 if errs else 0)
