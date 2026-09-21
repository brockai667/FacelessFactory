"""Test toku daemona (priebežný prepis kúskov → zloženie → vyčistenie) s falošným rekordérom a STT,
bez mikrofónu, bez Whisperu, bez vkladania."""
import io
import sys
import threading
import time
import unittest
from contextlib import redirect_stdout
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "diktat"))
import app as diktat_app  # noqa: E402
from diktat_core import config as cfgmod  # noqa: E402


class FakeRecorder:
    """Audio = zoznam čísel (len() funguje ako pri numpy poli). Kúsky vydáva podľa scenára."""

    def __init__(self, chunks, rest, sample_rate=16000):
        self.sample_rate = sample_rate
        self.recording = False
        self.total_seconds = 0.0
        self.gate_rms = 0.0
        self.gated_blocks = self.kept_blocks = 0
        self.last_level = 0.0
        self._chunks = list(chunks)
        self._rest = rest
        self.closed = False

    def start(self):
        self.recording = True

    def take_chunk(self, min_s, max_s, sil):
        if self._chunks:
            return self._chunks.pop(0)
        return None

    def stop(self):
        self.recording = False
        self.total_seconds = 42.0
        return self._rest

    def close(self):
        self.closed = True


class FakeSTT:
    def __init__(self):
        self.calls = []
        self.lock = threading.Lock()

    def transcribe(self, audio, language="sk", context=None):
        with self.lock:
            self.calls.append((list(audio), context))
        time.sleep(0.05)                       # nech sa prekrýva s nahrávaním
        return {1: "hmm prvá časť.", 2: "druhá časť.", 3: "tretia časť pošli to"}[audio[0]]


class StreamingFlowTests(unittest.TestCase):
    def _make_app(self, chunks, rest):
        cfg = cfgmod.deep_merge(cfgmod.DEFAULTS, {"log_dir": None, "audio": {"beep": False}})
        app = diktat_app.DiktatApp(cfg, no_paste=True)
        app.recorder = FakeRecorder(chunks, rest)
        app.stt = FakeSTT()
        app._worker = threading.Thread(target=app._stt_worker, daemon=True)
        app._worker.start()
        return app

    def test_chunks_are_transcribed_in_order_and_joined(self):
        app = self._make_app(chunks=[[1] * 16000, [2] * 16000], rest=[3] * 16000)
        out = io.StringIO()
        with redirect_stdout(out):
            app.start_recording()
            time.sleep(0.8)                    # segmenter stihne odobrať oba kúsky, worker ich prepíše
            app.stop_and_process()
            for _ in range(100):
                if not app.busy.locked() and "✅" in out.getvalue():
                    break
                time.sleep(0.05)
        text = out.getvalue()
        self.assertIn("surové: hmm prvá časť. druhá časť. tretia časť pošli to", text)
        self.assertIn("🎤 Prvá časť. druhá časť. tretia časť", text)
        self.assertIn("ODOSIELAM", text)
        self.assertEqual([c[0][0] for c in app.stt.calls], [1, 2, 3])
        # kontext = koniec predchádzajúceho textu, prvý kúsok bez kontextu
        self.assertIsNone(app.stt.calls[0][1])
        self.assertIn("prvá časť", app.stt.calls[1][1])
        self.assertEqual(app.tray.state, "idle")

    def test_too_short_recording_is_ignored(self):
        app = self._make_app(chunks=[], rest=[3] * 1000)   # 0,06 s < 0,3 s
        out = io.StringIO()
        with redirect_stdout(out):
            app.start_recording()
            app.stop_and_process()
            time.sleep(0.3)
        self.assertIn("príliš krátke", out.getvalue())
        self.assertEqual(app.stt.calls, [])


class GpuInfoTest(unittest.TestCase):
    """gpu_info: nvidia-smi výstup → čitateľný riadok; bez ovládača → dôvod namiesto výnimky."""

    def test_parses_nvidia_smi(self):
        import subprocess
        from unittest import mock

        class Res:
            returncode = 0
            stdout = "NVIDIA GeForce RTX 4070, 12282 MiB\n"
            stderr = ""

        with mock.patch.object(subprocess, "run", lambda *a, **k: Res()):
            self.assertEqual(diktat_app.gpu_info(), "NVIDIA GeForce RTX 4070, 12 GB pamäte")

    def test_without_driver(self):
        import subprocess
        from unittest import mock

        def boom(*a, **k):
            raise FileNotFoundError("nvidia-smi")

        with mock.patch.object(subprocess, "run", boom):
            self.assertIn("nvidia-smi", diktat_app.gpu_info())


if __name__ == "__main__":
    unittest.main()
