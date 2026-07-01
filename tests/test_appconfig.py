"""Unit testy pre appconfig.py: nacitanie config.json, ENV prekrytie tajomstiev,
ffmpeg/ffprobe fallback na PATH. Vsetko offline (docasny config.json, mockovane ENV)."""
import json
import os
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import appconfig


def _write_config(tmp_dir, data):
    path = os.path.join(tmp_dir, "config.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f)
    return path


class TestLoad(unittest.TestCase):
    def test_loads_plain_config_unchanged(self):
        with tempfile.TemporaryDirectory() as tmp:
            _write_config(tmp, {"voice": "en-US-AndrewNeural", "width": 1080})
            with mock.patch.object(appconfig, "ROOT", tmp), \
                 mock.patch.dict(os.environ, {}, clear=True):
                cfg = appconfig.load()
        self.assertEqual(cfg["voice"], "en-US-AndrewNeural")
        self.assertEqual(cfg["width"], 1080)

    def test_env_var_overrides_secret(self):
        with tempfile.TemporaryDirectory() as tmp:
            _write_config(tmp, {"pexels_api_key": "from-file"})
            with mock.patch.object(appconfig, "ROOT", tmp), \
                 mock.patch.dict(os.environ, {"PEXELS_API_KEY": "from-env"}, clear=True):
                cfg = appconfig.load()
        self.assertEqual(cfg["pexels_api_key"], "from-env")

    def test_empty_env_var_does_not_override(self):
        with tempfile.TemporaryDirectory() as tmp:
            _write_config(tmp, {"buffer_token": "from-file"})
            with mock.patch.object(appconfig, "ROOT", tmp), \
                 mock.patch.dict(os.environ, {"BUFFER_TOKEN": ""}, clear=True):
                cfg = appconfig.load()
        self.assertEqual(cfg["buffer_token"], "from-file")

    def test_missing_env_var_keeps_file_value(self):
        with tempfile.TemporaryDirectory() as tmp:
            _write_config(tmp, {"cloudinary_api_key": "from-file"})
            with mock.patch.object(appconfig, "ROOT", tmp), \
                 mock.patch.dict(os.environ, {}, clear=True):
                cfg = appconfig.load()
        self.assertEqual(cfg["cloudinary_api_key"], "from-file")

    def test_all_secret_keys_overridable(self):
        with tempfile.TemporaryDirectory() as tmp:
            _write_config(tmp, {})
            env = {v: f"env-{k}" for k, v in appconfig.ENV_MAP.items()}
            with mock.patch.object(appconfig, "ROOT", tmp), \
                 mock.patch.dict(os.environ, env, clear=True):
                cfg = appconfig.load()
        for key in appconfig.ENV_MAP:
            self.assertEqual(cfg[key], f"env-{key}")

    def test_nonexistent_ffmpeg_path_falls_back_to_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            _write_config(tmp, {"ffmpeg": r"C:\no\such\ffmpeg.exe", "ffprobe": r"C:\no\such\ffprobe.exe"})
            with mock.patch.object(appconfig, "ROOT", tmp), \
                 mock.patch.dict(os.environ, {}, clear=True):
                cfg = appconfig.load()
        self.assertEqual(cfg["ffmpeg"], "ffmpeg")
        self.assertEqual(cfg["ffprobe"], "ffprobe")

    def test_existing_ffmpeg_path_kept(self):
        with tempfile.TemporaryDirectory() as tmp:
            real_exe = os.path.join(tmp, "ffmpeg.exe")
            with open(real_exe, "w") as f:
                f.write("")
            _write_config(tmp, {"ffmpeg": real_exe})
            with mock.patch.object(appconfig, "ROOT", tmp), \
                 mock.patch.dict(os.environ, {}, clear=True):
                cfg = appconfig.load()
        self.assertEqual(cfg["ffmpeg"], real_exe)

    def test_missing_ffmpeg_key_defaults_to_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            _write_config(tmp, {})
            with mock.patch.object(appconfig, "ROOT", tmp), \
                 mock.patch.dict(os.environ, {}, clear=True):
                cfg = appconfig.load()
        self.assertEqual(cfg["ffmpeg"], "ffmpeg")
        self.assertEqual(cfg["ffprobe"], "ffprobe")


if __name__ == "__main__":
    unittest.main()
