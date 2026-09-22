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




class _RecordingModel:
    """Vracia vopred dané texty segmentov a zapamätá si, s čím bol zavolaný."""

    def __init__(self, texts, reject_new_kwargs=False):
        self.texts = texts
        self.kwargs = None
        self.calls = 0
        self.reject_new_kwargs = reject_new_kwargs

    def transcribe(self, audio, **kwargs):
        self.calls += 1
        if self.reject_new_kwargs and "word_timestamps" in kwargs:
            raise TypeError("transcribe() got an unexpected keyword argument 'word_timestamps'")
        self.kwargs = kwargs
        return (_Seg(t) for t in self.texts), types.SimpleNamespace(language="sk")


def _backend(model, **kw):
    backend = stt.FasterWhisperBackend(model="x", device="cpu", compute_type="int8", **kw)
    backend._model = model
    backend.load = lambda: None
    return backend


class HallucinationTests(unittest.TestCase):
    def test_subtitle_phrases_are_hallucinations(self):
        for text in ("Ďakujem za pozornosť.", "Titulky vytvoril Janko", "[Hudba]",
                     "Subtitles by the Amara.org community", "  "):
            self.assertTrue(stt.is_hallucination(text), text)

    def test_real_speech_is_kept(self):
        for text in ("Ďakujem, to je všetko.", "Sprav mi funkciu na prepis.",
                     "Hudba hrá v pozadí, ale to je jedno."):
            self.assertFalse(stt.is_hallucination(text), text)

    def test_repeat_of_already_transcribed_text(self):
        prev = "Sprav mi funkciu na prepis textu."
        self.assertTrue(stt.is_hallucination("funkciu na prepis textu.", prev))
        self.assertFalse(stt.is_hallucination("A potom to ulož.", prev))

    def test_same_sentence_over_and_over(self):
        self.assertTrue(stt.is_hallucination("Dobre. Dobre. Dobre."))
        self.assertFalse(stt.is_hallucination("Dobre. Idem na to. Dobre."))


class RunFilterTests(unittest.TestCase):
    def test_invented_and_repeated_segments_are_dropped(self):
        model = _RecordingModel([" Sprav mi funkciu.", " Ďakujem za pozornosť.",
                                 " Sprav mi funkciu.", " Titulky vytvoril Mirek"])
        self.assertEqual(_backend(model).transcribe(b"a", language="sk"), "Sprav mi funkciu.")

    def test_filter_can_be_turned_off(self):
        model = _RecordingModel([" Ahoj.", " Ďakujem za pozornosť."])
        text = _backend(model, drop_hallucinations=False).transcribe(b"a", language="sk")
        self.assertEqual(text, "Ahoj. Ďakujem za pozornosť.")

    def test_previous_text_is_not_sent_to_the_model_by_default(self):
        model = _RecordingModel([" Ahoj."])
        _backend(model).transcribe(b"a", language="sk", context="predchádzajúca veta")
        self.assertIsNone(model.kwargs["initial_prompt"])

    def test_context_is_sent_when_enabled(self):
        model = _RecordingModel([" Ahoj."])
        _backend(model, use_context=True).transcribe(b"a", language="sk", context="predchádzajúca veta")
        self.assertIn("predchádzajúca veta", model.kwargs["initial_prompt"])

    def test_old_faster_whisper_without_hallucination_parameters(self):
        model = _RecordingModel([" Ahoj."], reject_new_kwargs=True)
        text = _backend(model, hallucination_silence_seconds=2).transcribe(b"a", language="sk")
        self.assertEqual(text, "Ahoj.")
        self.assertEqual(model.calls, 2)
        self.assertNotIn("word_timestamps", model.kwargs)


if __name__ == "__main__":
    unittest.main()
