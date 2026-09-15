"""Hlasitostná brána a kalibrácia – čisté funkcie + uloženie do configu."""
import json
import tempfile
import unittest
from pathlib import Path

from diktat.diktat_core import audio, config as cfgmod


class GateKeepTests(unittest.TestCase):
    def test_gate_off_keeps_everything(self):
        self.assertTrue(audio.gate_keep(0.0, 0.0, 0.0, 99, 0.4))

    def test_loud_block_kept(self):
        self.assertTrue(audio.gate_keep(0.05, 0.001, 0.02, 99, 0.4))

    def test_quiet_block_before_loud_next_is_kept_word_onset(self):
        self.assertTrue(audio.gate_keep(0.001, 0.05, 0.02, 99, 0.4))

    def test_quiet_block_within_hangover_is_kept(self):
        self.assertTrue(audio.gate_keep(0.001, 0.001, 0.02, 0.3, 0.4))

    def test_quiet_block_after_hangover_is_dropped(self):
        self.assertFalse(audio.gate_keep(0.001, 0.001, 0.02, 0.5, 0.4))


class GateKeep3Tests(unittest.TestCase):
    G = 0.02

    def test_isolated_peak_is_dropped(self):
        keep, burst = audio.gate_keep3(0.05, 0.001, 0.001, self.G, since_burst=99, hangover=0.4)
        self.assertFalse(keep)
        self.assertFalse(burst)

    def test_two_loud_blocks_form_a_burst(self):
        keep, burst = audio.gate_keep3(0.05, 0.05, 0.001, self.G, since_burst=99, hangover=0.4)
        self.assertTrue(keep)
        self.assertTrue(burst)

    def test_onset_before_burst_is_kept(self):
        keep, burst = audio.gate_keep3(0.001, 0.05, 0.05, self.G, since_burst=99, hangover=0.4)
        self.assertTrue(keep)
        self.assertFalse(burst)

    def test_onset_before_isolated_peak_is_dropped(self):
        keep, _ = audio.gate_keep3(0.001, 0.05, 0.001, self.G, since_burst=99, hangover=0.4)
        self.assertFalse(keep)

    def test_tail_within_hangover_is_kept(self):
        keep, _ = audio.gate_keep3(0.05, 0.001, 0.001, self.G, since_burst=0.1, hangover=0.4)
        self.assertTrue(keep)
        keep, _ = audio.gate_keep3(0.001, 0.001, 0.001, self.G, since_burst=0.3, hangover=0.4)
        self.assertTrue(keep)
        keep, _ = audio.gate_keep3(0.001, 0.001, 0.001, self.G, since_burst=0.5, hangover=0.4)
        self.assertFalse(keep)

    def test_gate_off(self):
        self.assertEqual(audio.gate_keep3(0, 0, 0, 0.0, 99, 0.4), (True, False))


class SegmentFilterTests(unittest.TestCase):
    def test_segment_ok(self):
        from diktat.diktat_core import stt
        self.assertTrue(stt.segment_ok(-0.3, 0.1, -1.0, 0.7))
        self.assertFalse(stt.segment_ok(-1.4, 0.1, -1.0, 0.7))     # nízka istota = nezmysel z útržkov
        self.assertFalse(stt.segment_ok(-0.3, 0.9, -1.0, 0.7))     # Whisper tipuje, že tam nebola reč
        self.assertTrue(stt.segment_ok(None, None, -1.0, 0.7))


class GatedRatioTests(unittest.TestCase):
    def test_ratio(self):
        self.assertEqual(audio.gated_ratio(0, 0), 0.0)
        self.assertEqual(audio.gated_ratio(3, 1), 0.75)
        self.assertEqual(audio.gated_ratio(0, 5), 0.0)


class SuggestGateTests(unittest.TestCase):
    def test_clear_separation(self):
        speech = [0.001] * 10 + [0.04] * 30      # reč s pauzami
        noise = [0.004] * 40
        res = audio.suggest_gate(speech, noise)
        self.assertTrue(res["ok"])
        self.assertGreater(res["gate"], 0.004 * 1.5 - 1e-9)
        self.assertLess(res["gate"], 0.04 * 0.6 + 1e-9)
        self.assertAlmostEqual(res["speech"], 0.04)
        self.assertAlmostEqual(res["noise"], 0.004)

    def test_noisy_environment_flagged(self):
        res = audio.suggest_gate([0.02] * 20, [0.015] * 20)
        self.assertFalse(res["ok"])
        self.assertGreater(res["gate"], 0)

    def test_no_speech(self):
        res = audio.suggest_gate([], [0.01] * 5)
        self.assertFalse(res["ok"])
        self.assertEqual(res["gate"], 0.0)


class SaveValueTests(unittest.TestCase):
    def test_saves_into_existing_config_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "config.json"
            path.write_text(json.dumps({"hotkey": "<f9>", "audio": {"beep": False}}), encoding="utf-8")
            cfg = {"_path": str(path)}
            out = cfgmod.save_value(cfg, "audio.gate_rms", 0.0123)
            self.assertEqual(out, path)
            data = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(data["audio"]["gate_rms"], 0.0123)
            self.assertFalse(data["audio"]["beep"])
            self.assertEqual(data["hotkey"], "<f9>")

    def test_creates_config_json_from_example_when_missing(self):
        original = cfgmod.PACKAGE_DIR
        with tempfile.TemporaryDirectory() as tmp:
            cfgmod.PACKAGE_DIR = Path(tmp)
            try:
                (Path(tmp) / "config.example.json").write_text(json.dumps({"audio": {"beep": True}}), encoding="utf-8")
                cfg = {"_path": str(Path(tmp) / "config.example.json")}
                out = cfgmod.save_value(cfg, "audio.gate_rms", 0.02)
                self.assertEqual(out, Path(tmp) / "config.json")
                data = json.loads(out.read_text(encoding="utf-8"))
                self.assertEqual(data["audio"], {"beep": True, "gate_rms": 0.02})
            finally:
                cfgmod.PACKAGE_DIR = original


if __name__ == "__main__":
    unittest.main()
