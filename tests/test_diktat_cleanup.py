"""Testy pre diktat/diktat_core/cleanup.py – offline pravidlá čistenia diktátu (bez LLM, bez audia)."""
import unittest

from diktat.diktat_core import cleanup, config as cfgmod


class FillerTests(unittest.TestCase):
    def test_removes_pure_fillers(self):
        self.assertEqual(cleanup.rules_clean("hmm takže ehm chcem eee nový skript"), "Takže chcem nový skript")

    def test_keeps_real_words_containing_filler_letters(self):
        text = cleanup.rules_clean("Ahmed má hmlu a éterický olej.")
        self.assertIn("Ahmed", text)
        self.assertIn("hmlu", text)
        self.assertIn("éterický", text)

    def test_dedupes_repeated_words(self):
        self.assertEqual(cleanup.rules_clean("chcem chcem aby si to to spravil"), "Chcem aby si to spravil")


class CommandTests(unittest.TestCase):
    def test_skrtni_to_drops_previous_sentence(self):
        raw = "Pridaj testy na slug. Stiahni videá z YouTube. Škrtni to. Stiahni videá z Pexels."
        self.assertEqual(cleanup.rules_clean(raw), "Pridaj testy na slug. Stiahni videá z Pexels.")

    def test_ignore_last_two_lines(self):
        raw = "Prvá veta. Druhá veta. Tretia veta. Ignoruj posledné dva riadky. Štvrtá veta."
        self.assertEqual(cleanup.rules_clean(raw), "Prvá veta. Štvrtá veta.")

    def test_ignore_last_sentence_without_punctuation(self):
        raw = "oprav bug v push to buffer ignoruj poslednú vetu oprav retry v push to buffer"
        self.assertEqual(cleanup.rules_clean(raw), "Oprav retry v push to buffer")

    def test_ignore_with_digit_and_word_numbers(self):
        raw = "A. B. C. D. ignoruj posledné 3 vety. E."
        self.assertEqual(cleanup.rules_clean(raw), "A. E.")
        raw = "A. B. C. zabudni na posledné tri riadky. E."
        self.assertEqual(cleanup.rules_clean(raw), "E.")

    def test_to_nie_only_when_standalone(self):
        self.assertEqual(cleanup.rules_clean("Použi YouTube. To nie. Použi Pexels."), "Použi Pexels.")
        text = cleanup.rules_clean("To nie je dobrý nápad.")
        self.assertEqual(text, "To nie je dobrý nápad.")

    def test_new_paragraph_and_line(self):
        raw = "Prvý bod. Nový odsek. Druhý bod. Nový riadok. Tretí bod."
        self.assertEqual(cleanup.rules_clean(raw), "Prvý bod.\n\nDruhý bod.\nTretí bod.")

    def test_drop_across_paragraph_break(self):
        raw = "A. Nový odsek. B. Škrtni to. C."
        self.assertEqual(cleanup.rules_clean(raw), "A.\n\nC.")

    def test_drop_more_than_available_is_safe(self):
        self.assertEqual(cleanup.rules_clean("Jediná veta. Ignoruj posledných päť viet."), "")


class ReplacementTests(unittest.TestCase):
    def test_replacements_case_insensitive_longest_first(self):
        mapping = {"klaud": "Claude", "klaud kód": "Claude Code", "git komit": "git commit"}
        self.assertEqual(cleanup.rules_clean("Otvor Klaud kód a sprav git komit.", mapping),
                         "Otvor Claude Code a sprav git commit.")


class SendAndMarkerTests(unittest.TestCase):
    KW = ["pošli to", "odošli", "pošli"]

    def test_detect_send_at_end(self):
        text, send = cleanup.detect_send("Oprav testy, pošli to.", self.KW)
        self.assertTrue(send)
        self.assertEqual(text, "Oprav testy")

    def test_detect_send_not_in_middle(self):
        text, send = cleanup.detect_send("Pošli to Petrovi a potom oprav testy.", self.KW)
        self.assertFalse(send)
        self.assertEqual(text, "Pošli to Petrovi a potom oprav testy.")

    def test_detect_send_keyword_alone_is_not_send(self):
        text, send = cleanup.detect_send("pošli to", self.KW)
        self.assertFalse(send)

    def test_strip_marker(self):
        markers = ["🎤", "[diktát]", "[d]"]
        self.assertEqual(cleanup.strip_marker("🎤 Oprav to", markers), ("Oprav to", True))
        self.assertEqual(cleanup.strip_marker("  [d] Oprav to", markers), ("Oprav to", True))
        self.assertEqual(cleanup.strip_marker("Oprav to", markers), ("Oprav to", False))


class CleanCompositionTests(unittest.TestCase):
    def cfg(self, mode):
        return cfgmod.deep_merge(cfgmod.DEFAULTS, {"cleanup": {"mode": mode}})

    def test_mode_rules(self):
        res = cleanup.clean("hmm oprav testy. pošli to", self.cfg("rules"))
        self.assertEqual(res.method, "rules")
        self.assertTrue(res.send)
        self.assertEqual(res.text, "Oprav testy.")

    def test_mode_none_keeps_text_but_detects_send(self):
        res = cleanup.clean("hmm oprav testy pošli to", self.cfg("none"))
        self.assertEqual(res.method, "none")
        self.assertTrue(res.send)
        self.assertEqual(res.text, "hmm oprav testy")

    def test_mode_auto_falls_back_to_rules_when_llm_fails(self):
        original = cleanup.llm_clean
        cleanup.llm_clean = lambda text, c: None
        try:
            res = cleanup.clean("ehm oprav testy", self.cfg("llm"))
        finally:
            cleanup.llm_clean = original
        self.assertEqual(res.method, "rules")
        self.assertEqual(res.text, "Oprav testy")

    def test_mode_llm_uses_llm_output(self):
        original = cleanup.llm_clean
        cleanup.llm_clean = lambda text, c: "Oprav testy v module slug."
        try:
            res = cleanup.clean("ehm oprav testy v module slag pošli to", self.cfg("llm"))
        finally:
            cleanup.llm_clean = original
        self.assertEqual(res.method, "llm")
        self.assertTrue(res.send)
        self.assertEqual(res.text, "Oprav testy v module slug.")

    def test_unknown_mode_raises(self):
        with self.assertRaises(ValueError):
            cleanup.clean("x", self.cfg("weird"))


class RequestKwargsTests(unittest.TestCase):
    def test_opus5_gets_effort_and_fallbacks(self):
        kw = cleanup._request_kwargs("claude-opus-5", "low")
        self.assertEqual(kw["output_config"], {"effort": "low"})
        self.assertEqual(kw["fallbacks"], "default")
        self.assertIn("server-side-fallback-2026-07-01", kw["betas"])

    def test_haiku_gets_neither(self):
        self.assertEqual(cleanup._request_kwargs("claude-haiku-4-5", "low"), {})

    def test_sonnet5_gets_effort_only(self):
        kw = cleanup._request_kwargs("claude-sonnet-5", "medium")
        self.assertEqual(kw, {"output_config": {"effort": "medium"}})


class ConfigTests(unittest.TestCase):
    def test_deep_merge_does_not_mutate_defaults(self):
        merged = cfgmod.deep_merge(cfgmod.DEFAULTS, {"cleanup": {"model": "x"}})
        self.assertEqual(merged["cleanup"]["model"], "x")
        self.assertEqual(cfgmod.DEFAULTS["cleanup"]["model"], "claude-opus-5")
        self.assertEqual(merged["cleanup"]["effort"], "low")

    def test_example_config_loads_and_matches_defaults_keys(self):
        cfg = cfgmod.load_config(cfgmod.PACKAGE_DIR / "config.example.json")
        for key in cfgmod.DEFAULTS:
            self.assertIn(key, cfg)
        self.assertEqual(cfg["language"], "sk")
        self.assertTrue(cfg["_path"].endswith("config.example.json"))

    def test_missing_config_gives_defaults(self):
        cfg = cfgmod.load_config("/nonexistent/diktat-config.json")
        self.assertEqual(cfg["hotkey"], cfgmod.DEFAULTS["hotkey"])


if __name__ == "__main__":
    unittest.main()
