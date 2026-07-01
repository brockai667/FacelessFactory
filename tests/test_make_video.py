"""Unit testy pre ciste funkcie v make_video.py: vyber B-rollu, titulky, timing/strih."""
import os
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import make_video as mv


class TestSlugify(unittest.TestCase):
    def test_basic(self):
        self.assertEqual(mv.slugify("3 Facts About Trees!"), "3_facts_about_trees")

    def test_empty_becomes_video(self):
        self.assertEqual(mv.slugify(""), "video")

    def test_only_special_chars_becomes_video(self):
        self.assertEqual(mv.slugify("!!!???"), "video")

    def test_truncates_to_50_chars(self):
        long_title = "x" * 100
        self.assertEqual(len(mv.slugify(long_title)), 50)


class TestSecsToAss(unittest.TestCase):
    def test_zero(self):
        self.assertEqual(mv.secs_to_ass(0), "0:00:00.00")

    def test_negative_clamped_to_zero(self):
        self.assertEqual(mv.secs_to_ass(-5), "0:00:00.00")

    def test_normal_value(self):
        self.assertEqual(mv.secs_to_ass(3725.5), "1:02:05.50")

    def test_centisecond_rollover(self):
        # 1.999 -> cs by zaokruhlil na 100, musi sa preniest na dalsiu sekundu
        self.assertEqual(mv.secs_to_ass(1.999), "0:00:02.00")


class TestKeywordTokens(unittest.TestCase):
    def test_filters_short_words(self):
        self.assertEqual(mv.keyword_tokens("a octopus in the sea"), ["octopus", "the", "sea"])

    def test_empty_keywords(self):
        self.assertEqual(mv.keyword_tokens(""), [])

    def test_none_keywords(self):
        self.assertEqual(mv.keyword_tokens(None), [])

    def test_lowercases(self):
        self.assertEqual(mv.keyword_tokens("OCEAN Waves"), ["ocean", "waves"])


class TestSlugWords(unittest.TestCase):
    def test_extracts_words_from_url(self):
        v = {"url": "https://www.pexels.com/video/ocean-waves-at-sunset-853751/"}
        self.assertEqual(mv.slug_words(v), {"ocean", "waves", "sunset"})

    def test_missing_url(self):
        self.assertEqual(mv.slug_words({}), set())

    def test_short_words_filtered(self):
        v = {"url": "https://www.pexels.com/video/a-of-ok-1/"}
        self.assertEqual(mv.slug_words(v), set())


class TestRelevance(unittest.TestCase):
    def test_counts_matching_tokens(self):
        v = {"url": "https://www.pexels.com/video/octopus-underwater-scene-1/"}
        self.assertEqual(mv.relevance(v, ["octopus", "underwater"]), 2)

    def test_no_match(self):
        v = {"url": "https://www.pexels.com/video/mountain-hiking-1/"}
        self.assertEqual(mv.relevance(v, ["octopus"]), 0)

    def test_empty_tokens(self):
        v = {"url": "https://www.pexels.com/video/octopus-1/"}
        self.assertEqual(mv.relevance(v, []), 0)


class TestResRank(unittest.TestCase):
    def test_prefers_higher_resolution_under_cap(self):
        low = {"height": 720}
        high = {"height": 1920}
        self.assertLess(mv.res_rank(high), mv.res_rank(low))

    def test_extreme_resolution_ranked_last(self):
        normal = {"height": 1920}
        extreme = {"height": 4000}
        self.assertLess(mv.res_rank(normal), mv.res_rank(extreme))

    def test_missing_height_treated_as_zero(self):
        self.assertEqual(mv.res_rank({}), (0, 0))


class TestBuildQueryLadder(unittest.TestCase):
    def test_single_word_no_expansion(self):
        self.assertEqual(mv.build_query_ladder("trees"), ["trees"])

    def test_two_words_no_pair_expansion(self):
        # len(words) < 3 -> nepridava sa "prve 2 slova" (uz je to cely dotaz)
        ladder = mv.build_query_ladder("big trees")
        self.assertEqual(ladder[0], "big trees")
        self.assertIn("trees", ladder)

    def test_three_or_more_words_adds_pairs(self):
        ladder = mv.build_query_ladder("giant sequoia trees california")
        self.assertEqual(ladder[0], "giant sequoia trees california")
        self.assertIn("giant sequoia", ladder)
        self.assertIn("trees california", ladder)

    def test_capped_at_five(self):
        ladder = mv.build_query_ladder("alpha bravo charlie delta echo foxtrot")
        self.assertLessEqual(len(ladder), 5)

    def test_empty_keywords(self):
        self.assertEqual(mv.build_query_ladder(""), [""])


class TestSelectBestCandidate(unittest.TestCase):
    def test_empty_pool_returns_none(self):
        self.assertIsNone(mv.select_best_candidate({}))

    def test_picks_highest_relevance(self):
        pool = {
            "a": (0, [], 1080),
            "b": (2, [], 720),
        }
        self.assertEqual(mv.select_best_candidate(pool), "b")

    def test_tiebreak_by_resolution(self):
        pool = {
            "a": (1, [], 720),
            "b": (1, [], 1920),
        }
        self.assertEqual(mv.select_best_candidate(pool), "b")

    def test_resolution_capped_at_2160(self):
        pool = {
            "a": (1, [], 2160),
            "b": (1, [], 4000),  # extremne vysoke rozlisenie sa oreze na 2160 pri porovnani
        }
        # obe maju rovnaku efektivnu hodnotu po orezani -> max() vrati prvy narazeny kluc
        self.assertIn(mv.select_best_candidate(pool), ("a", "b"))


class TestApplyCase(unittest.TestCase):
    def test_upper(self):
        self.assertEqual(mv.apply_case("Hello", "upper"), "HELLO")

    def test_lower(self):
        self.assertEqual(mv.apply_case("Hello", "lower"), "hello")

    def test_sentence_unchanged(self):
        self.assertEqual(mv.apply_case("Hello World", "sentence"), "Hello World")


class TestApplyLead(unittest.TestCase):
    def test_shifts_words_earlier(self):
        words = [(1.0, 0.5, "a"), (2.0, 0.5, "b")]
        out = mv.apply_lead(words, 0.2)
        self.assertEqual(out, [(0.8, 0.5, "a"), (1.8, 0.5, "b")])

    def test_clamped_at_zero(self):
        words = [(0.1, 0.5, "a")]
        out = mv.apply_lead(words, 0.5)
        self.assertEqual(out[0][0], 0.0)

    def test_zero_lead_is_noop_identity(self):
        words = [(1.0, 0.5, "a")]
        self.assertEqual(mv.apply_lead(words, 0.0), words)


class TestChunkWords(unittest.TestCase):
    def test_splits_into_groups(self):
        words = [(0, 1, "a"), (1, 1, "b"), (2, 1, "c")]
        chunks = mv.chunk_words(words, 2)
        self.assertEqual(chunks, [[(0, 1, "a"), (1, 1, "b")], [(2, 1, "c")]])

    def test_empty_words(self):
        self.assertEqual(mv.chunk_words([], 3), [])

    def test_per_less_than_one_clamped_to_one(self):
        words = [(0, 1, "a"), (1, 1, "b")]
        chunks = mv.chunk_words(words, 0)
        self.assertEqual(chunks, [[(0, 1, "a")], [(1, 1, "b")]])


class TestIsEmphasized(unittest.TestCase):
    def test_digit_is_emphasized(self):
        self.assertTrue(mv.is_emphasized("100", set()))

    def test_in_emph_set(self):
        self.assertTrue(mv.is_emphasized("FREE", {"FREE"}))

    def test_dollar_sign_is_emphasized(self):
        self.assertTrue(mv.is_emphasized("$100", set()))

    def test_plain_word_not_emphasized(self):
        self.assertFalse(mv.is_emphasized("HELLO", {"FREE"}))


class TestAdvanceCursor(unittest.TestCase):
    def test_first_segment_has_no_cut(self):
        cursor, cut = mv.advance_cursor(0.0, 0, 5.0)
        self.assertEqual(cursor, 5.0)
        self.assertIsNone(cut)

    def test_subsequent_segment_cuts_at_old_cursor(self):
        cursor, cut = mv.advance_cursor(5.0, 1, 3.0)
        self.assertEqual(cursor, 8.0)
        self.assertEqual(cut, 5.0)

    def test_sequence_matches_cumulative_timeline(self):
        durations = [4.0, 3.0, 2.0]
        cursor, cuts = 0.0, []
        for i, d in enumerate(durations):
            cursor, cut = mv.advance_cursor(cursor, i, d)
            if cut is not None:
                cuts.append(cut)
        self.assertEqual(cursor, 9.0)
        self.assertEqual(cuts, [4.0, 7.0])

    def test_zero_duration_segment(self):
        cursor, cut = mv.advance_cursor(2.0, 1, 0.0)
        self.assertEqual(cursor, 2.0)
        self.assertEqual(cut, 2.0)


class TestBgrToRgb(unittest.TestCase):
    def test_parses_ass_bgr_hex(self):
        # ASS je BGR: "0000FF" (modra v BGR poradi bajtov B=00,G=00,R=FF) -> RGB (255,0,0)
        self.assertEqual(mv._bgr_to_rgb("0000FF"), (255, 0, 0))

    def test_malformed_falls_back(self):
        self.assertEqual(mv._bgr_to_rgb("not-a-hex"), (45, 109, 246))

    def test_empty_falls_back(self):
        self.assertEqual(mv._bgr_to_rgb(""), (45, 109, 246))


class TestBuildAss(unittest.TestCase):
    def test_writes_one_dialogue_line_per_word(self):
        cfg = {"width": 1080, "height": 1920, "caption_words_per_line": 2}
        words = [(0.0, 0.3, "Hello"), (0.3, 0.2, "world"), (0.6, 0.4, "test")]
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "subs.ass")
            mv.build_ass(words, cfg, path)
            with open(path, encoding="utf-8") as f:
                content = f.read()
            self.assertEqual(content.count("Dialogue:"), 3)
            self.assertIn("PlayResX: 1080", content)
            self.assertIn("PlayResY: 1920", content)

    def test_empty_words_still_writes_header(self):
        cfg = {"width": 1080, "height": 1920}
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "subs.ass")
            mv.build_ass([], cfg, path)
            with open(path, encoding="utf-8") as f:
                content = f.read()
            self.assertIn("[Events]", content)
            self.assertEqual(content.count("Dialogue:"), 0)


class TestBuildAssPop(unittest.TestCase):
    def test_emphasized_word_gets_highlight_color(self):
        cfg = {"width": 1080, "height": 1920, "caption_pop_highlight_hex": "00C2F2",
               "caption_text_hex": "FFFFFF"}
        words = [(0.0, 0.3, "free"), (0.3, 0.3, "stuff")]
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "subs.ass")
            mv.build_ass_pop(words, cfg, path)
            with open(path, encoding="utf-8") as f:
                content = f.read()
            self.assertEqual(content.count("Dialogue:"), 2)
            self.assertIn("&H00C2F2&}FREE", content)
            self.assertIn("&HFFFFFF&}STUFF", content)


class TestDownloadWithRetry(unittest.TestCase):
    def test_retries_then_succeeds(self):
        calls = {"n": 0}

        def fake_get(url, timeout=120):
            calls["n"] += 1
            resp = mock.Mock()
            if calls["n"] < 2:
                raise ConnectionError("boom")
            resp.raise_for_status = mock.Mock()
            resp.content = b"data"
            return resp

        with mock.patch("requests.get", side_effect=fake_get), \
             mock.patch("time.sleep"):
            data = mv._download_with_retry("http://example.com/video.mp4", attempts=3)
        self.assertEqual(data, b"data")
        self.assertEqual(calls["n"], 2)

    def test_raises_after_exhausting_attempts(self):
        with mock.patch("requests.get", side_effect=ConnectionError("boom")), \
             mock.patch("time.sleep"):
            with self.assertRaises(ConnectionError):
                mv._download_with_retry("http://example.com/video.mp4", attempts=2)


class TestGetBroll(unittest.TestCase):
    def test_no_api_key_returns_none(self):
        cfg = {"pexels_api_key": ""}
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(mv.get_broll("trees", cfg, tmp, set()), (None, None))

    def test_no_keywords_returns_none(self):
        cfg = {"pexels_api_key": "abc123"}
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(mv.get_broll("", cfg, tmp, set()), (None, None))

    def test_selects_and_caches_best_clip(self):
        cfg = {"pexels_api_key": "abc123", "width": 1080, "height": 1920}
        search_response = {
            "videos": [
                {
                    "id": 111,
                    "url": "https://www.pexels.com/video/mountain-hiking-1/",
                    "video_files": [{"height": 1920, "link": "http://cdn/111.mp4"}],
                },
                {
                    "id": 222,
                    "url": "https://www.pexels.com/video/trees-forest-2/",
                    "video_files": [{"height": 1920, "link": "http://cdn/222.mp4"}],
                },
            ]
        }

        def fake_get(url, params=None, headers=None, timeout=None):
            resp = mock.Mock()
            resp.raise_for_status = mock.Mock()
            if "search" in url:
                resp.json = mock.Mock(return_value=search_response)
            else:
                resp.content = b"fake-video-bytes"
            return resp

        with tempfile.TemporaryDirectory() as tmp, \
             mock.patch("requests.get", side_effect=fake_get):
            path, vid = mv.get_broll("trees", cfg, tmp, set())
            self.assertEqual(vid, 222)  # "trees" slug matchuje viac nez "mountain hiking"
            self.assertTrue(os.path.exists(path))
            with open(path, "rb") as f:
                self.assertEqual(f.read(), b"fake-video-bytes")

    def test_used_ids_are_excluded(self):
        cfg = {"pexels_api_key": "abc123", "width": 1080, "height": 1920}
        search_response = {
            "videos": [
                {
                    "id": 222,
                    "url": "https://www.pexels.com/video/trees-forest-2/",
                    "video_files": [{"height": 1920, "link": "http://cdn/222.mp4"}],
                },
            ]
        }

        def fake_get(url, params=None, headers=None, timeout=None):
            resp = mock.Mock()
            resp.raise_for_status = mock.Mock()
            resp.json = mock.Mock(return_value=search_response)
            return resp

        with tempfile.TemporaryDirectory() as tmp, \
             mock.patch("requests.get", side_effect=fake_get):
            path, vid = mv.get_broll("trees", cfg, tmp, used_ids={222})
        self.assertEqual((path, vid), (None, None))

    def test_download_failure_handled_gracefully(self):
        cfg = {"pexels_api_key": "abc123", "width": 1080, "height": 1920}
        search_response = {
            "videos": [
                {
                    "id": 222,
                    "url": "https://www.pexels.com/video/trees-forest-2/",
                    "video_files": [{"height": 1920, "link": "http://cdn/222.mp4"}],
                },
            ]
        }

        def fake_get(url, params=None, headers=None, timeout=None):
            resp = mock.Mock()
            resp.raise_for_status = mock.Mock()
            if "search" in url:
                resp.json = mock.Mock(return_value=search_response)
                return resp
            raise ConnectionError("download boom")

        with tempfile.TemporaryDirectory() as tmp, \
             mock.patch("requests.get", side_effect=fake_get), \
             mock.patch("time.sleep"):
            path, vid = mv.get_broll("trees", cfg, tmp, set())
        self.assertEqual((path, vid), (None, None))


if __name__ == "__main__":
    unittest.main()
