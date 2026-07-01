"""Unit testy pre cleanup_cloudinary.py: parsovanie Cloudinary timestampov pre cutoff porovnanie."""
import datetime
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# modul pri importe cita config.json (appconfig.load()) - v repozitari existuje, takze je to bezpecne
import cleanup_cloudinary as cc


class TestParse(unittest.TestCase):
    def test_parses_utc_timestamp(self):
        dt = cc.parse("2026-01-15T12:30:00Z")
        self.assertEqual(dt, datetime.datetime(2026, 1, 15, 12, 30, 0, tzinfo=datetime.timezone.utc))

    def test_result_is_timezone_aware(self):
        dt = cc.parse("2026-01-15T00:00:00Z")
        self.assertIsNotNone(dt.tzinfo)

    def test_comparable_with_tz_aware_cutoff(self):
        old = cc.parse("2020-01-01T00:00:00Z")
        cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=14)
        self.assertLess(old, cutoff)

    def test_malformed_timestamp_raises(self):
        with self.assertRaises(ValueError):
            cc.parse("not-a-date")


if __name__ == "__main__":
    unittest.main()
