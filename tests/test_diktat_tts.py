"""Pomocné funkcie hlasu (bez siete, bez zvuku)."""
import os
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

    def test_engine_settings(self):
        self.assertEqual(tts.engine_settings({})["engine"], "edge")
        self.assertEqual(tts.engine_settings({"engine": "google"})["voice"], "sk-SK-Wavenet-A")
        os.environ["ELEVENLABS_API_KEY"] = "k1"
        try:
            es = tts.engine_settings({"engine": "elevenlabs", "elevenlabs_voice": "v1"})
        finally:
            del os.environ["ELEVENLABS_API_KEY"]
        self.assertEqual((es["engine"], es["voice"], es["api_key"], es["model"]), ("elevenlabs", "v1", "k1", "eleven_multilingual_v2"))
        self.assertEqual(tts.engine_settings({"engine": "elevenlabs", "elevenlabs_api_key": "cfg"})["api_key"], "cfg")

    def test_missing_key_raises(self):
        with self.assertRaises(RuntimeError):
            tts.synthesize("x", "v", engine="elevenlabs", api_key="")
        with self.assertRaises(RuntimeError):
            tts.synthesize("x", "v", engine="google", api_key=None)

    def test_rate_to_float(self):
        self.assertEqual(tts._rate_to_float("+0%"), 1.0)
        self.assertAlmostEqual(tts._rate_to_float("+10%"), 1.1)
        self.assertAlmostEqual(tts._rate_to_float("-20%"), 0.8)
        self.assertEqual(tts._rate_to_float("x"), 1.0)


if __name__ == "__main__":
    unittest.main()


class HttpErrorTextTests(unittest.TestCase):
    def test_google_api_disabled_hint(self):
        body = '{"error": {"code": 403, "message": "Cloud Text-to-Speech API has not been used in project 1 before or it is disabled."}}'
        txt = tts.http_error_text("https://texttospeech.googleapis.com/v1/voices?key=x", 403, body)
        self.assertIn("HTTP 403", txt)
        self.assertIn("nie je zapnuté", txt)

    def test_google_bad_key_hint(self):
        body = '{"error": {"code": 400, "message": "API key not valid. Please pass a valid API key."}}'
        txt = tts.http_error_text("https://texttospeech.googleapis.com/v1/voices?key=x", 400, body)
        self.assertIn("kľúč nesedí", txt)

    def test_google_billing_hint(self):
        body = '{"error": {"code": 403, "message": "This API method requires billing to be enabled."}}'
        txt = tts.http_error_text("https://texttospeech.googleapis.com/v1/text:synthesize?key=x", 403, body)
        self.assertIn("účtovanie", txt)

    def test_non_json_body(self):
        txt = tts.http_error_text("https://api.elevenlabs.io/v1/voices", 401, "Unauthorized")
        self.assertEqual(txt, "HTTP 401: Unauthorized → ElevenLabs: kľúč nesedí alebo nemá oprávnenie (Profile → API keys).")


class SamplerPromptsTests(unittest.TestCase):
    def test_ask_engine_number_and_default(self):
        from diktat.hlas import ukazky
        self.assertEqual(ukazky.ask_engine("edge", input_fn=lambda _p: "2"), "google")
        self.assertEqual(ukazky.ask_engine("edge", input_fn=lambda _p: ""), "edge")
        self.assertEqual(ukazky.ask_engine("google", input_fn=lambda _p: "x"), "google")

    def test_ask_key_strips_and_handles_abort(self):
        from diktat.hlas import ukazky
        self.assertEqual(ukazky.ask_key("google", input_fn=lambda _p: "  AIzaTEST  "), "AIzaTEST")

        def abort(_p):
            raise EOFError
        self.assertEqual(ukazky.ask_key("google", input_fn=abort), "")
