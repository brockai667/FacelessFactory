"""Testy rezania audia na kúsky (čisté Python funkcie, bez numpy a mikrofónu)."""
import sys
import types
import unittest
import unittest.mock

from diktat.diktat_core import audio


def rms_pattern(spec):
    """'v'=hlas (0.05), 's'=ticho (0.001); každý znak = jeden 0.1 s blok."""
    return [0.05 if c == "v" else 0.001 for c in spec]


class FindCutTests(unittest.TestCase):
    def test_not_enough_audio(self):
        self.assertIsNone(audio.find_cut(rms_pattern("v" * 50), 0.1, 15, 30))

    def test_cuts_in_the_middle_of_a_pause_after_min_seconds(self):
        # 16 s hlasu, 1 s pauzy, 5 s hlasu
        spec = "v" * 160 + "s" * 10 + "v" * 50
        cut = audio.find_cut(rms_pattern(spec), 0.1, 15, 30)
        self.assertIsNotNone(cut)
        self.assertGreaterEqual(cut, 160)
        self.assertLessEqual(cut, 170)
        self.assertEqual(cut, 165)

    def test_ignores_pauses_before_min_seconds(self):
        spec = "v" * 50 + "s" * 10 + "v" * 120     # pauza v 5. sekunde, potom hlas bez pauzy do 18 s
        self.assertIsNone(audio.find_cut(rms_pattern(spec), 0.1, 15, 30))

    def test_short_dip_is_not_a_pause(self):
        spec = "v" * 160 + "ss" + "v" * 40         # 0,2 s ticha < 3 bloky
        self.assertIsNone(audio.find_cut(rms_pattern(spec), 0.1, 15, 30))

    def test_hard_cut_at_max_seconds(self):
        spec = "v" * 300
        self.assertEqual(audio.find_cut(rms_pattern(spec), 0.1, 15, 30), 300)
        self.assertIsNone(audio.find_cut(rms_pattern("v" * 299), 0.1, 15, 30))

    def test_pause_just_after_min_boundary_is_found(self):
        spec = "v" * 149 + "s" * 4 + "v" * 20      # pauza začína tesne pred 15 s
        cut = audio.find_cut(rms_pattern(spec), 0.1, 15, 30)
        self.assertIsNotNone(cut)
        self.assertGreaterEqual(cut, 149)
        self.assertLessEqual(cut, 153)


if __name__ == "__main__":
    unittest.main()


class BeepTests(unittest.TestCase):
    """Pípnutie ide cez zvukový výstup (poslúcha hlasitosť Windows), nie cez winsound.Beep –
    ten je systémový tón a je rovnako nahlas vždy."""

    @classmethod
    def setUpClass(cls):
        # sounddevice sa v teste podstrčí cez sys.modules. patch.dict pri odchode obnoví pôvodný obsah
        # slovníka, teda vyhodí všetko, čo sa medzitým naimportovalo – a numpy sa v jednom procese
        # druhýkrát načítať nedá. Preto ho načítame raz tu, ešte pred prvým patchom.
        import numpy  # noqa: F401
        cls.numpy = numpy

    def _played(self, kind, volume=None):
        calls = []
        fake = types.SimpleNamespace(play=lambda data, rate: calls.append((len(data), rate)),
                                     wait=lambda: None)
        with unittest.mock.patch.dict(sys.modules, {"sounddevice": fake}):
            audio._beep_sync(kind, volume)
        return calls

    def test_start_and_stop_play_a_short_tone(self):
        for kind in ("start", "stop"):
            calls = self._played(kind)
            self.assertEqual(len(calls), 1, kind)
            samples, rate = calls[0]
            self.assertLess(samples / rate, 0.12, f"{kind}: má to byť krátke pípnutie")

    def test_inserting_the_text_does_not_beep(self):
        self.assertEqual(self._played("done"), [], "tretie pípnutie v rade len otravuje")

    def test_volume_zero_is_silence(self):
        self.assertEqual(self._played("start", 0), [])

    def test_a_broken_sound_card_never_raises(self):
        def boom(*_a, **_k):
            raise OSError("žiadny zvukový výstup")
        fake = types.SimpleNamespace(play=boom, wait=boom)
        with unittest.mock.patch.dict(sys.modules, {"sounddevice": fake}):
            audio._beep_sync("start")          # nesmie vyhodiť výnimku
