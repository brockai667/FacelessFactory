# -*- coding: utf-8 -*-
"""Offline test rotacie hakov, koncovej A/B otazky a vahy tem (bez Groq, bez kluca, bez siete).
  python engine/test_writer.py      -> 0 = OK"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import learn  # noqa: E402
import topics  # noqa: E402
import writer  # noqa: E402


def test_hook_rotation():
    seq = [writer.hook_style_for(n) for n in range(9)]
    assert seq == ["number", "you", "question"] * 3, seq
    assert seq.count("question") == 3                      # "What happens if" max 1 zo 3 scenarov
    assert writer.hook_style_for() in writer.HOOK_STYLES   # bez n sa pocita zo suborov


def test_prompt_has_style_and_ab_end():
    seen = {}
    real = writer.llm_json
    writer.llm_json = lambda system, prompt, **kw: seen.update(prompt=prompt) or {"title": "t"}
    try:
        for style in writer.HOOK_STYLES:
            writer.llm_script("What happens if you skip breakfast?", "timeline", "", style)
            p = seen["prompt"]
            assert writer.HOOK_RULES[style] in p, style
            assert "A/B question" in p and "55-75 words" in p
            assert (style == "question") == ("is allowed here" in p)   # "What happens if" povolene len v style question
    finally:
        writer.llm_json = real


def test_new_levers_registered():
    learn.configure(None, "MindBlownDaily")
    names = [x["name"] for x in learn.CFG["levers"]]
    for n in ("hook_number", "hook_shock", "end_ab_question", "length_22s"):
        assert n in names, n
    assert names.index("hook_bold_claim") < names.index("hook_number")      # existujuce packy ostavaju prve
    assert all(learn.BRIEF_CHARS >= len(x["instruction"]) for x in learn.CFG["levers"])


def test_topic_bias():
    assert not topics.is_exotic("What happens if you stop eating sugar?") and not topics.is_exotic("What happens if you follow a diet?")
    assert topics.is_exotic("What happens if you walk on the moon?") and topics.is_exotic("What happens if you sleep in a coffin?")
    free = ["moon walk on the moon?", "Q diet a", "Q nap b", "Q coffee c", "space station life in space?"]
    out = []
    for n_used in range(6):                                   # 2 bezne : 1 exoticka, nic sa nestrati
        o = topics.prefer_everyday(free, n_used)
        assert sorted(o) == sorted(free)
        out.append(topics.is_exotic(o[0]))
    assert out == [False, False, True, False, False, True], out


TESTS = (test_hook_rotation, test_prompt_has_style_and_ab_end, test_new_levers_registered, test_topic_bias)


def run():
    keep = dict(learn.CFG)
    errs = []
    try:
        for t in TESTS:
            try:
                t()
            except Exception as e:
                errs.append(f"{t.__name__}: {type(e).__name__}: {str(e)[:300]}")
    finally:
        learn.CFG.clear()
        learn.CFG.update(keep)
    return errs


if __name__ == "__main__":
    errs = run()
    print("test_writer:", f"OK ({len(TESTS)} testov)" if not errs else f"{len(errs)} chyb")
    for e in errs:
        print("  CHYBA:", e)
    sys.exit(1 if errs else 0)
