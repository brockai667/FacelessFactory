"""Testy STT vrstvy bez reálneho modelu: automatický prechod cuda → cpu pri chýbajúcich CUDA knižniciach."""
import types
import unittest

from diktat.diktat_core import stt


class _Seg:
    def __init__(self, text):
        self.text = text


class _FakeModel:
    """Napodobňuje faster_whisper.WhisperModel; na 'cuda' zlyhá až pri iterovaní segmentov (ako v realite)."""
    created = []

    def __init__(self, name, device, compute_type):
        self.device = device
        _FakeModel.created.append((device, compute_type))

    def transcribe(self, audio, **kwargs):
        def gen():
            if self.device == "cuda":
                raise RuntimeError("Library cublas64_12.dll is not found or cannot be loaded")
            yield _Seg(" Ahoj ")
            yield _Seg("svet.")
        return gen(), types.SimpleNamespace(language="sk")


class CudaFallbackTests(unittest.TestCase):
    def setUp(self):
        _FakeModel.created = []
        self._orig_import = stt.FasterWhisperBackend.load

        def fake_load(self_):
            if self_._model is not None:
                return
            self_._model = _FakeModel(self_.model_name, self_.device, self_.compute_type)
        stt.FasterWhisperBackend.load = fake_load

    def tearDown(self):
        stt.FasterWhisperBackend.load = self._orig_import

    def test_missing_cublas_on_cuda_falls_back_to_cpu_and_retries(self):
        backend = stt.FasterWhisperBackend(model="large-v3-turbo", device="cuda", compute_type="float16")
        text = backend.transcribe(b"audio", language="sk")
        self.assertEqual(text, "Ahoj svet.")
        self.assertEqual(backend.device, "cpu")
        self.assertEqual(backend.compute_type, "int8")
        self.assertEqual(_FakeModel.created, [("cuda", "float16"), ("cpu", "int8")])

    def test_other_runtime_errors_are_not_swallowed(self):
        backend = stt.FasterWhisperBackend(model="x", device="cpu", compute_type="int8")
        backend._model = _FakeModel("x", "cpu", "int8")

        def boom(audio, **kw):
            raise RuntimeError("out of memory")
        backend._model.transcribe = boom
        with self.assertRaises(RuntimeError):
            backend.transcribe(b"audio")
        self.assertEqual(backend.device, "cpu")

    def test_looks_like_missing_cuda(self):
        self.assertTrue(stt._looks_like_missing_cuda(RuntimeError("Library cudnn_ops64_9.dll is not found")))
        self.assertTrue(stt._looks_like_missing_cuda(RuntimeError("CUDA driver version is insufficient")))
        self.assertFalse(stt._looks_like_missing_cuda(RuntimeError("out of memory")))

    def test_prepare_cuda_dll_dirs_is_noop_outside_windows(self):
        import platform
        if platform.system() != "Windows":
            self.assertEqual(stt.prepare_cuda_dll_dirs(), [])


if __name__ == "__main__":
    unittest.main()
