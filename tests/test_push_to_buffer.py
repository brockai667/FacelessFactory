"""Unit testy pre push_to_buffer.py: casovanie publikacnych slotov, GraphQL mutacie,
citanie popisu videa, migracia stavu pushed.json a retry na sietove volania."""
import datetime
import json
import os
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# cloudinary.uploader importuje cloudinary.config() na module-level - musi byt naimportovane
# PRED tym, ako testy zacnu mockovat cloudinary.config (inak sa import deje az vnutri mock.patch
# kontextu a zlyha, lebo config() vrati MagicMock namiesto skutocnej konfiguracie).
import cloudinary
import cloudinary.uploader

import push_to_buffer as pb


class TestNextSlots(unittest.TestCase):
    def test_picks_upcoming_slots_same_and_next_day(self):
        # 07:00 UTC = 09:00 Europe/Bratislava (CEST, UTC+2) v lete
        now = datetime.datetime(2026, 7, 1, 7, 0, 0, tzinfo=datetime.timezone.utc)
        slots = pb.next_slots(3, now=now)
        self.assertEqual(slots, [
            "2026-07-01T13:00:00.000Z",  # 15:00 Bratislava
            "2026-07-01T18:00:00.000Z",  # 20:00 Bratislava
            "2026-07-02T06:00:00.000Z",  # 08:00 Bratislava (nasledujuci den)
        ])

    def test_exact_slot_boundary_excluded(self):
        # presne 08:00:00 Bratislava == 06:00 UTC -> tento slot uz NEplati (t > now musi byt ostre)
        now = datetime.datetime(2026, 7, 1, 6, 0, 0, tzinfo=datetime.timezone.utc)
        slots = pb.next_slots(1, now=now)
        self.assertEqual(slots, ["2026-07-01T13:00:00.000Z"])

    def test_returns_requested_count(self):
        now = datetime.datetime(2026, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc)
        self.assertEqual(len(pb.next_slots(7, now=now)), 7)


class TestBuildMutation(unittest.TestCase):
    def test_instagram_no_title_variable(self):
        q, use_title = pb.build_mutation("instagram")
        self.assertFalse(use_title)
        self.assertIn("reel", q)
        self.assertNotIn("$title", q)

    def test_youtube_requires_title(self):
        q, use_title = pb.build_mutation("youtube")
        self.assertTrue(use_title)
        self.assertIn("$title", q)
        self.assertIn("categoryId", q)

    def test_tiktok_requires_title(self):
        q, use_title = pb.build_mutation("tiktok")
        self.assertTrue(use_title)
        self.assertIn("tiktok", q)

    def test_unknown_service_falls_back(self):
        q, use_title = pb.build_mutation("mastodon")
        self.assertFalse(use_title)
        self.assertIn("createPost", q)

    def test_all_variants_use_custom_scheduled(self):
        for svc in ("instagram", "youtube", "tiktok"):
            q, _ = pb.build_mutation(svc)
            self.assertIn("customScheduled", q)
            self.assertIn("$dueAt", q)


class TestReadTxt(unittest.TestCase):
    def test_missing_file_returns_empty(self):
        self.assertEqual(pb.read_txt("/no/such/file.txt"), ("", ""))

    def test_splits_title_and_body(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = os.path.join(tmp, "v.txt")
            with open(p, "w", encoding="utf-8") as f:
                f.write("My Title\n\nBody line 1\nBody line 2\n")
            title, body = pb.read_txt(p)
        self.assertEqual(title, "My Title")
        self.assertIn("Body line 1", body)

    def test_body_truncated_to_2000_chars(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = os.path.join(tmp, "v.txt")
            with open(p, "w", encoding="utf-8") as f:
                f.write("Title\n" + ("x" * 3000))
            _, body = pb.read_txt(p)
        self.assertEqual(len(body), 2000)


class TestLoadPushed(unittest.TestCase):
    def test_missing_file_returns_empty_dict(self):
        with mock.patch.object(pb, "PUSHED", "/no/such/pushed.json"):
            self.assertEqual(pb.load_pushed(), {})

    def test_migrates_old_list_schema(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = os.path.join(tmp, "pushed.json")
            with open(p, "w", encoding="utf-8") as f:
                json.dump(["video1.mp4", "video2.mp4"], f)
            with mock.patch.object(pb, "PUSHED", p):
                data = pb.load_pushed()
        self.assertEqual(data["video1.mp4"], sorted(pb.WANT_SERVICES))
        self.assertEqual(data["video2.mp4"], sorted(pb.WANT_SERVICES))

    def test_passes_through_new_dict_schema(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = os.path.join(tmp, "pushed.json")
            with open(p, "w", encoding="utf-8") as f:
                json.dump({"video1.mp4": ["youtube"]}, f)
            with mock.patch.object(pb, "PUSHED", p):
                data = pb.load_pushed()
        self.assertEqual(data, {"video1.mp4": ["youtube"]})


class TestGql(unittest.TestCase):
    def test_retries_on_connection_error_then_succeeds(self):
        import requests
        ok = mock.Mock()
        ok.json = mock.Mock(return_value={"data": {"ok": True}})
        with mock.patch("requests.post", side_effect=[requests.exceptions.ConnectionError("boom"), ok]), \
             mock.patch("time.sleep"):
            out = pb.gql("token", "query {}", attempts=3)
        self.assertEqual(out, {"ok": True})

    def test_does_not_retry_graphql_errors(self):
        resp = mock.Mock()
        resp.json = mock.Mock(return_value={"errors": [{"message": "bad query"}]})
        with mock.patch("requests.post", return_value=resp) as m:
            with self.assertRaises(RuntimeError):
                pb.gql("token", "query {}", attempts=3)
        self.assertEqual(m.call_count, 1)


class TestUploadCloudinary(unittest.TestCase):
    def test_retries_then_succeeds(self):
        cfg = {"cloudinary_cloud_name": "x", "cloudinary_api_key": "y", "cloudinary_api_secret": "z"}
        with mock.patch("cloudinary.config"), \
             mock.patch("cloudinary.uploader.upload_large",
                        side_effect=[Exception("boom"), {"secure_url": "https://cdn/video.mp4"}]), \
             mock.patch("time.sleep"):
            url = pb.upload_cloudinary(cfg, "output/video.mp4", attempts=3)
        self.assertEqual(url, "https://cdn/video.mp4")

    def test_raises_after_exhausting_attempts(self):
        cfg = {"cloudinary_cloud_name": "x", "cloudinary_api_key": "y", "cloudinary_api_secret": "z"}
        with mock.patch("cloudinary.config"), \
             mock.patch("cloudinary.uploader.upload_large", side_effect=Exception("boom")), \
             mock.patch("time.sleep"):
            with self.assertRaises(Exception):
                pb.upload_cloudinary(cfg, "output/video.mp4", attempts=2)


if __name__ == "__main__":
    unittest.main()
