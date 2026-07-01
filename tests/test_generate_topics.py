"""Unit testy pre generate_topics.py: validacia a parsovanie generovanych tem, retry na Models API."""
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import generate_topics as gt


class TestExtractJson(unittest.TestCase):
    def test_plain_json_array(self):
        self.assertEqual(gt.extract_json('[{"a": 1}]'), [{"a": 1}])

    def test_markdown_fenced_json(self):
        raw = '```json\n[{"a": 1}]\n```'
        self.assertEqual(gt.extract_json(raw), [{"a": 1}])

    def test_fenced_without_language_tag(self):
        raw = '```\n[{"a": 1}]\n```'
        self.assertEqual(gt.extract_json(raw), [{"a": 1}])

    def test_commentary_around_array(self):
        raw = 'Here is your JSON:\n[{"a": 1}]\nHope this helps!'
        self.assertEqual(gt.extract_json(raw), [{"a": 1}])

    def test_invalid_json_raises(self):
        with self.assertRaises(Exception):
            gt.extract_json("not json at all")


class TestValid(unittest.TestCase):
    def _topic(self, **overrides):
        base = {
            "title": "3 Facts About X",
            "segments": [
                {"text": "a", "keywords": "kw"},
                {"text": "b", "keywords": "kw"},
                {"text": "c", "keywords": "kw"},
                {"text": "d", "keywords": "kw"},
            ],
        }
        base.update(overrides)
        return base

    def test_valid_topic_passes(self):
        self.assertTrue(gt.valid(self._topic()))

    def test_not_a_dict(self):
        self.assertFalse(gt.valid(["not", "a", "dict"]))

    def test_missing_title(self):
        t = self._topic()
        del t["title"]
        self.assertFalse(gt.valid(t))

    def test_missing_segments(self):
        t = self._topic()
        del t["segments"]
        self.assertFalse(gt.valid(t))

    def test_too_few_segments(self):
        t = self._topic(segments=[{"text": "a", "keywords": "kw"}])
        self.assertFalse(gt.valid(t))

    def test_segment_missing_text(self):
        t = self._topic(segments=[{"keywords": "kw"}] * 4)
        self.assertFalse(gt.valid(t))

    def test_segment_missing_keywords(self):
        t = self._topic(segments=[{"text": "a"}] * 4)
        self.assertFalse(gt.valid(t))

    def test_fills_default_description_and_hashtags(self):
        t = self._topic()
        gt.valid(t)
        self.assertIn("Follow for daily facts!", t["description"])
        self.assertIn("#facts", t["hashtags"])

    def test_keeps_existing_description_and_hashtags(self):
        t = self._topic(description="custom", hashtags=["#custom"])
        gt.valid(t)
        self.assertEqual(t["description"], "custom")
        self.assertEqual(t["hashtags"], ["#custom"])


class TestCallModel(unittest.TestCase):
    def _resp(self, status, text="", payload=None):
        r = mock.Mock()
        r.status_code = status
        r.text = text
        if payload is not None:
            r.json = mock.Mock(return_value=payload)
        return r

    def test_success_first_try(self):
        ok = self._resp(200, payload={"choices": [{"message": {"content": "hello"}}]})
        with mock.patch("requests.post", return_value=ok) as m:
            out = gt.call_model("prompt", attempts=3)
        self.assertEqual(out, "hello")
        self.assertEqual(m.call_count, 1)

    def test_retries_on_500_then_succeeds(self):
        bad = self._resp(500, text="server error")
        ok = self._resp(200, payload={"choices": [{"message": {"content": "ok"}}]})
        with mock.patch("requests.post", side_effect=[bad, ok]), mock.patch("time.sleep"):
            out = gt.call_model("prompt", attempts=3)
        self.assertEqual(out, "ok")

    def test_does_not_retry_on_400(self):
        bad = self._resp(400, text="bad auth")
        with mock.patch("requests.post", return_value=bad) as m, mock.patch("time.sleep"):
            with self.assertRaises(RuntimeError):
                gt.call_model("prompt", attempts=3)
        self.assertEqual(m.call_count, 1)

    def test_raises_after_exhausting_retries_on_network_error(self):
        import requests
        with mock.patch("requests.post", side_effect=requests.exceptions.ConnectionError("boom")) as m, \
             mock.patch("time.sleep"):
            with self.assertRaises(requests.exceptions.ConnectionError):
                gt.call_model("prompt", attempts=2)
        self.assertEqual(m.call_count, 2)


if __name__ == "__main__":
    unittest.main()
