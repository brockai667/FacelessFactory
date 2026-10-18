# -*- coding: utf-8 -*-
"""Offline test learn.py (samoucenie): videos.json aj Groq su atrapy, vsetko v docasnom priecinku (ziadna siet, ziaden kluc).
  python engine/test_learn.py      -> 0 = OK
Dokazuje: record (zhoda YT nazov / TikTok+IG orezany popis, v48 = prve pozorovanie vo veku 2-4 dni, neskore = late) |
kept (+15 %, >= 3 videa -> pravidlo) | reverted | caka na data (max 14 dni) | kopia vitaza (Groq atrapa, vypadok -> packa) |
reverted sa 6 tyzdnov neopakuje | poradie fronty (experiment len v ramci priority faktov) | kratky pokyn pre pisanie | temy."""
import datetime
import json
import os
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import learn  # noqa: E402

D = datetime.date
T0 = D(2026, 10, 1)


ROOTS = []


def _setup(profile="MindBlownDaily"):
    root = tempfile.mkdtemp(prefix="learn_test_")
    ROOTS.append(root)
    learn.configure(root, profile)
    os.makedirs(learn.CFG["done"], exist_ok=True)
    return root


def _spec(sid, title, desc, exp=None):
    S = {"title": title, "description": desc, "hook": "What happens if?", "beats": [{"line": "First line here."}], "end": {"line": "Would you?"}}
    if exp:
        S["exp"] = exp
    json.dump(S, open(os.path.join(learn.CFG["done"], sid + ".json"), "w", encoding="utf-8"))
    return S


def _perf(rows):
    """rows: [(sid, published date, exp, {platform: v48})] -> perf.json"""
    P = {"specs": {}}
    for sid, pub, exp, vals in rows:
        P["specs"][sid] = {"published": pub.isoformat(), "exp": exp, "title": sid,
                           "platforms": {p: {"v48": v, "age48": 2.5, "latest": [5.0, v]} for p, v in vals.items()}}
    learn._save(learn.CFG["perf"], P)
    return P


def _state(cur=None, rules=None, history=None):
    learn._save(learn.CFG["exp"], {"current": cur, "rules": rules or [], "history": history or []})


def _cur(name="title_short", started=T0, slot="title"):
    return {"name": name, "slot": slot, "instruction": f"do {name}", "hypothesis": "h", "started": started.isoformat(),
            "baseline_median": {"youtube": 100, "tiktok": 100, "instagram": 100}, "tagged": []}


def _rows(n_base, base_v, n_tag, tag_v, exp="title_short"):
    rows = [(f"b{i:02d}", T0 - datetime.timedelta(days=i + 1), None, {"youtube": base_v, "tiktok": base_v, "instagram": base_v})
            for i in range(n_base)]
    rows += [(f"t{i:02d}", T0 + datetime.timedelta(days=i + 1), exp, {"youtube": tag_v, "tiktok": tag_v, "instagram": tag_v})
             for i in range(n_tag)]
    return rows


def test_record():
    _setup()
    _spec("901-groq-a", "Cold Water Swim", "A quick visual guide to the body’s reaction when you plunge into cold water and what follows.")
    _spec("902-groq-b", "Sand Dune Climb", "A paper‑craft explorer climbs a dune while we see the real physiological changes.")

    def vids(gen, views_a, views_b):
        return {"gen_at": gen, "factories": {"MindBlownDaily": [
            {"id": "y1", "title": "Cold Water Swim #shorts", "views": views_a, "published": "2026-10-01", "platform": "youtube"},
            {"id": "t1", "title": "A quick visual guide to the body's reaction when you plunge into cold #Science #C", "views": views_a,
             "published": "2026-10-01", "platform": "tiktok"},
            {"id": "i1", "title": "A quick visual guide to the body’s reaction when you plunge ", "views": views_a,
             "published": "2026-10-01", "platform": "instagram"},
            {"id": "y2", "title": "Sand Dune Climb #shorts", "views": views_b, "published": "2026-09-25", "platform": "youtube"},
            {"id": "y3", "title": "Some old video #shorts", "views": 7, "published": "2026-09-20", "platform": "youtube"}]}}
    hit, miss = learn.record(vids("2026-10-02T12:00:00Z", 100, 50))
    assert (hit, miss) == (4, 1), (hit, miss)
    learn.record(vids("2026-10-03T06:00:00Z", 300, 60))
    learn.record(vids("2026-10-05T06:00:00Z", 900, 70))
    P = learn.load_perf()["specs"]
    a = P["901-groq-a"]["platforms"]
    assert a["youtube"]["v48"] == 300 and a["youtube"]["latest"][1] == 900 and a["youtube"]["first"] == [1.5, 100], a["youtube"]
    assert a["tiktok"]["v48"] == 300 and a["instagram"]["v48"] == 300, a
    b = P["902-groq-b"]["platforms"]["youtube"]
    assert b.get("v48") is None and b.get("late") is True, b       # prve pozorovanie vo veku 7 dni -> nie je porovnatelne
    assert "pub-2026-09-20" in P, list(P)


def test_keep():
    _setup()
    _perf(_rows(6, 100, 4, 130))
    _state(_cur())
    st = learn.weekly(T0 + datetime.timedelta(days=8), use_llm=False)
    h = st["history"][-1]
    assert h["name"] == "title_short" and h["status"] == "kept" and h["ratio"] == 1.3, h
    assert st["rules"] and st["rules"][0]["instruction"] == "do title_short", st["rules"]
    assert st["current"] and st["current"]["name"] != "title_short", st["current"]
    s = json.load(open(learn.CFG["status"], encoding="utf-8"))
    assert s["name"] == st["current"]["name"] and s["last"]["status"] == "kept", s


def test_revert():
    _setup()
    _perf(_rows(6, 100, 4, 105))
    _state(_cur())
    st = learn.weekly(T0 + datetime.timedelta(days=8), use_llm=False)
    assert st["history"][-1]["status"] == "reverted" and not st["rules"], st["history"]


def test_waiting():
    _setup()
    _perf(_rows(6, 100, 2, 300))                                     # len 2 otagovane videa s v48
    _state(_cur())
    st = learn.weekly(T0 + datetime.timedelta(days=8), use_llm=False)
    assert st["current"]["name"] == "title_short" and not st["history"], st
    assert json.load(open(learn.CFG["status"], encoding="utf-8"))["status"] == "waiting"
    st = learn.weekly(T0 + datetime.timedelta(days=14), use_llm=False)
    assert st["history"][-1]["status"] == "reverted", st["history"]   # po 14 dnoch bez dat -> reverted (malo videi)


def test_copy_winner():
    _setup()
    rows = [(f"s{i:02d}", T0 + datetime.timedelta(days=i), None, {"youtube": 100, "tiktok": 100, "instagram": 100}) for i in range(10)]
    rows[5] = ("s05", T0 + datetime.timedelta(days=5), None, {"youtube": 500, "tiktok": 300, "instagram": 90})
    _perf(rows)
    for sid, *_ in rows:
        _spec(sid, f"Title {sid}", f"Description of {sid} long enough to match")
    _state()
    calls = []

    def fake(system, prompt):
        calls.append(prompt)
        assert "Title s05" in prompt
        return {"pattern": "extreme cold", "instruction": "Open on the most extreme physical moment, then explain the body's response.",
                "hypothesis": "Extreme moments stop the scroll.", "keywords": ["cold", "Ice!"]}
    learn.LLM = fake
    today = T0 + datetime.timedelta(days=12)
    st = learn.weekly(today)
    assert calls and st["current"]["name"] == "copy-s05" and st["current"]["slot"] == "winner", st["current"]
    assert st["current"]["keywords"] == ["cold", "ice"] and st["current"]["winner"]["score"] >= 2, st["current"]

    def broken(system, prompt):
        raise RuntimeError("LLM zlyhal: test")
    learn.LLM = broken
    _state()
    st = learn.weekly(today)
    assert st["current"]["name"] == learn.CFG["levers"][0]["name"], st["current"]   # vypadok Groq -> prva packa
    _state(history=[{"name": "copy-s05", "started": "2026-10-01", "ended": "2026-10-08", "status": "reverted"}])
    learn.LLM = fake
    st = learn.weekly(today)
    assert st["current"]["name"] != "copy-s05", st["current"]                       # ten isty vitaz sa nekopiruje znova


def test_never_repeat():
    _setup()
    _perf([])
    L = [x["name"] for x in learn.CFG["levers"]]
    today = D(2026, 12, 1)
    recent = (today - datetime.timedelta(days=10)).isoformat()
    _state(history=[{"name": L[0], "started": recent, "ended": recent, "status": "reverted"}])
    assert learn.next_lever(learn.load_state(), today)["name"] == L[1]
    old = (today - datetime.timedelta(days=50)).isoformat()
    hist = [{"name": n, "started": recent, "ended": recent, "status": "reverted"} for n in L]
    _state(history=hist)
    assert learn.next_lever(learn.load_state(), today) is None                       # vsetko cerstvo reverted -> nic
    hist[2]["ended"] = old
    _state(history=hist, rules=[{"name": L[3], "slot": "x", "instruction": "y"}])
    assert learn.next_lever(learn.load_state(), today)["name"] == L[2]               # po 6 tyzdnoch znova, kept nikdy


def test_order_queue_and_brief():
    _setup()
    _state(_cur("exp1"), rules=[{"name": f"r{i}", "slot": f"s{i}", "instruction": f"Rule number {i}: " + "x" * 150} for i in range(6)])
    items = [(0, "001-claude", {}), (1, "900-groq-unverified", {"exp": "exp1"}), (0, "905-groq-ok", {"exp": "exp1"}), (0, "903-groq-old", {"exp": "old"})]
    order = [x[1] for x in learn.order_queue(items)]
    assert order == ["905-groq-ok", "001-claude", "903-groq-old", "900-groq-unverified"], order
    b = learn.writer_brief()
    assert len(b) <= learn.BRIEF_CHARS and "do exp1" in b and "Rule number 5" in b and "Rule number 0" not in b, b
    _state({**_cur("fam"), "keywords": ["cold", "sea"]})
    t = learn.order_topics(["What happens if you sleep less?", "What happens if you swim in the sea?", "What happens in the cold?"])
    assert t == ["What happens if you swim in the sea?", "What happens in the cold?", "What happens if you sleep less?"], t
    _state()
    assert learn.writer_brief() == "" and learn.current_name() is None


def test_rule_slots():
    _setup()
    st = {"rules": [{"name": "hook_question", "slot": "hook", "instruction": "q"}, {"name": "w1", "slot": "winner", "instruction": "a"},
                    {"name": "w2", "slot": "winner", "instruction": "b"}], "history": []}
    learn.add_rule(st, {"name": "hook_bold_claim", "slot": "hook", "instruction": "bold"}, 1.2, T0)
    assert [r["name"] for r in st["rules"]] == ["w1", "w2", "hook_bold_claim"], st["rules"]
    learn.add_rule(st, {"name": "w3", "slot": "winner", "instruction": "c"}, 1.3, T0)
    assert [r["name"] for r in st["rules"]] == ["w2", "hook_bold_claim", "w3"], st["rules"]
    _setup("ColdCaseDaily")
    assert learn.CFG["levers"][0]["name"] == "title_short" and learn.CFG["state_dir"].endswith("case")


TESTS = (test_record, test_keep, test_revert, test_waiting, test_copy_winner, test_never_repeat, test_order_queue_and_brief, test_rule_slots)


def run():
    keep = (dict(learn.CFG), learn.LLM)
    errs = []
    try:
        for t in TESTS:
            try:
                learn.LLM = None
                t()
            except Exception as e:
                import traceback
                errs.append(f"{t.__name__}: {type(e).__name__}: {str(e)[:300]}")
                traceback.print_exc()
    finally:
        learn.CFG.clear()                      # spat na skutocny profil (selftest pokracuje)
        learn.CFG.update(keep[0])
        learn.LLM = keep[1]
        for r in ROOTS:
            shutil.rmtree(r, ignore_errors=True)
        ROOTS.clear()
    return errs


if __name__ == "__main__":
    errs = run()
    print("test_learn:", f"OK ({len(TESTS)} testov)" if not errs else f"{len(errs)} chyb")
    for e in errs:
        print("  CHYBA:", e)
    sys.exit(1 if errs else 0)
