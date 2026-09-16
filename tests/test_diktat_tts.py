"""Pomocné funkcie hlasu (bez siete, bez zvuku)."""
import unittest

from diktat.hlas import tts


class VoiceHelpersTests(unittest.TestCase):
    def test_friendly_name(self):
        self.assertEqual(tts.friendly_name("sk-SK-LukasNeural"), "Lukas")
        self.assertEqual(tts.friendly_name("sk-SK-ViktoriaNeural"), "Viktoria")
        self.assertEqual(tts.friendly_name("en-US-AvaMultilingualNeural"), "Ava")

    def test_candidate_voices_order(self):
        voices = [
            {"ShortName": "en-US-AvaMultilingualNeural", "Locale": "en-US"},
            {"ShortName": "cs-CZ-VlastaNeural", "Locale": "cs-CZ"},
            {"ShortName": "en-US-JennyNeural", "Locale": "en-US"},
            {"ShortName": "sk-SK-LukasNeural", "Locale": "sk-SK"},
            {"ShortName": "sk-SK-ViktoriaNeural", "Locale": "sk-SK"},
        ]
        names = [v["ShortName"] for v in tts.candidate_voices(voices)]
        self.assertEqual(names, ["sk-SK-LukasNeural", "sk-SK-ViktoriaNeural", "cs-CZ-VlastaNeural",
                                 "en-US-AvaMultilingualNeural"])


if __name__ == "__main__":
    unittest.main()
