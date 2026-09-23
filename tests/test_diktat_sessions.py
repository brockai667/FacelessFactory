"""Stav Claude Code sessions pre panel: hook → JSON súbory → riadky panela."""
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from diktat.diktat_core import panel as panelmod, sessions
from diktat import install

ROOT = Path(__file__).resolve().parent.parent / "diktat"


class RecordTests(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())

    def _state(self, session="a"):
        data = json.loads((self.dir / f"{session}.json").read_text(encoding="utf-8"))
        return data["state"]

    def test_events_map_to_states(self):
        payload = {"session_id": "a", "cwd": "C:/Users/x/epizodar"}
        sessions.record("SessionStart", payload, self.dir, now=100)
        self.assertEqual(self._state(), "ready")
        sessions.record("UserPromptSubmit", payload, self.dir, now=101)
        self.assertEqual(self._state(), "working")
        sessions.record("Stop", payload, self.dir, now=102)
        self.assertEqual(self._state(), "done")

    def test_notification_type_decides(self):
        payload = {"session_id": "a", "cwd": "C:/x/proj", "notification_type": "permission_prompt",
                   "message": "Claude needs your permission to use Bash"}
        sessions.record("Notification", payload, self.dir, now=100)
        self.assertEqual(self._state(), "asking")
        sessions.record("Notification", {**payload, "notification_type": "idle_prompt"}, self.dir, now=101)
        self.assertEqual(self._state(), "done")

    def test_unknown_notification_does_not_change_state(self):
        payload = {"session_id": "a", "cwd": "C:/x/proj"}
        sessions.record("UserPromptSubmit", payload, self.dir, now=100)
        self.assertIsNone(sessions.record("Notification", {**payload, "notification_type": "auth_success"},
                                          self.dir, now=101))
        self.assertEqual(self._state(), "working")

    def test_session_end_removes_the_file(self):
        payload = {"session_id": "a", "cwd": "C:/x/proj"}
        sessions.record("UserPromptSubmit", payload, self.dir, now=100)
        sessions.record("SessionEnd", {**payload, "end_reason": "logout"}, self.dir, now=101)
        self.assertEqual(list(self.dir.glob("*.json")), [])

    def test_since_keeps_running_while_state_holds(self):
        payload = {"session_id": "a", "cwd": "C:/x/proj"}
        sessions.record("UserPromptSubmit", payload, self.dir, now=100)
        sessions.record("UserPromptSubmit", payload, self.dir, now=160)
        entry = json.loads((self.dir / "a.json").read_text(encoding="utf-8"))
        self.assertEqual(entry["since"], 100)
        self.assertEqual(entry["updated"], 160)

    def test_dangerous_session_id_does_not_escape_the_directory(self):
        sessions.record("Stop", {"session_id": "../../evil", "cwd": "C:/x"}, self.dir, now=100)
        files = [f.name for f in self.dir.glob("*.json")]
        self.assertEqual(files, ["evil.json"])


class ReadStatesTests(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        now = 1000.0
        sessions.record("UserPromptSubmit", {"session_id": "a", "cwd": "C:/x/epizodar"}, self.dir, now)
        sessions.record("Stop", {"session_id": "b", "cwd": "C:/x/redesign"}, self.dir, now + 1)
        sessions.record("Notification", {"session_id": "c", "cwd": "C:/x/curio",
                                         "notification_type": "permission_prompt"}, self.dir, now + 2)

    def test_waiting_first_then_done_then_working(self):
        states = sessions.read_states(self.dir, now=1100)
        self.assertEqual([e["name"] for e in states], ["curio", "redesign", "epizodar"])

    def test_done_disappears_after_the_keep_time(self):
        states = sessions.read_states(self.dir, now=1000 + 40 * 60, done_keep_minutes=30)
        self.assertEqual([e["name"] for e in states], ["curio", "epizodar"])

    def test_stale_sessions_are_ignored_and_pruned(self):
        self.assertEqual(sessions.read_states(self.dir, now=1000 + 5 * 3600, stale_minutes=240), [])
        self.assertEqual(sessions.prune(self.dir, now=1000 + 5 * 3600, stale_minutes=240), 3)
        self.assertEqual(list(self.dir.glob("*.json")), [])

    def test_max_rows(self):
        self.assertEqual(len(sessions.read_states(self.dir, now=1100, max_rows=2)), 2)

    def test_row_text(self):
        states = sessions.read_states(self.dir, now=1000 + 90)
        icon, text, color = sessions.row_for(states[0])
        self.assertEqual(icon, "●")
        self.assertEqual(text, "curio · pýta sa ťa 1 min")
        self.assertEqual(color, "#ffb300")

    def test_missing_directory_is_empty_not_an_error(self):
        self.assertEqual(sessions.read_states(self.dir / "niet", now=1100), [])


class HumanTimeTests(unittest.TestCase):
    def test_formats(self):
        self.assertEqual(sessions.human_time(7), "0:07")
        self.assertEqual(sessions.human_time(185), "3 min")
        self.assertEqual(sessions.human_time(7300), "2 h")
        self.assertEqual(sessions.human_time(-5), "0:00")


class PanelPositionTests(unittest.TestCase):
    def test_under_the_window_buttons_on_the_right(self):
        p = panelmod.Panel({"offset_y": 44, "margin_right": 12})
        self.assertEqual(p.position((100, 50, 900, 700), 200, 1920), (688, 94))

    def test_hidden_without_a_claude_window(self):
        self.assertIsNone(panelmod.Panel({}).position(None, 200, 1920))

    def test_screen_corner_when_not_following(self):
        p = panelmod.Panel({"follow_window": False, "offset_y": 44, "margin_right": 12})
        self.assertEqual(p.position(None, 200, 1920), (1708, 44))

    def test_never_starts_left_of_the_window(self):
        p = panelmod.Panel({"margin_right": 12})
        self.assertEqual(p.position((0, 0, 100, 600), 300, 1920)[0], 0)


class SessionHookInstallTests(unittest.TestCase):
    def test_all_events_registered_and_removed(self):
        settings = {"hooks": {"PreToolUse": [{"hooks": [{"type": "command", "command": "cudzie.py"}]}]}}
        install.add_hook(settings, "py", "/h/diktat_hook.py")
        install.add_session_hooks(settings, "py", "/h/diktat_session.py")
        for event in install.SESSION_EVENTS:
            self.assertEqual(len(settings["hooks"][event]), 1, event)
            self.assertEqual(settings["hooks"][event][0]["hooks"][0]["args"], ["/h/diktat_session.py"])
        install.add_session_hooks(settings, "py", "/h/diktat_session.py")   # idempotentné
        self.assertEqual(len(settings["hooks"]["Stop"]), 1)
        install.remove_hook(settings)
        self.assertEqual(settings["hooks"], {"PreToolUse": [{"hooks": [{"type": "command", "command": "cudzie.py"}]}]})


class HookScriptTests(unittest.TestCase):
    def test_hook_script_writes_state(self):
        out = Path(tempfile.mkdtemp())
        env = {**os.environ, "DIKTAT_SESSION_DIR": str(out), "PYTHONIOENCODING": "utf-8"}
        payload = json.dumps({"hook_event_name": "Stop", "session_id": "s1", "cwd": "/home/x/redesign"})
        res = subprocess.run([sys.executable, str(ROOT / "hook" / "diktat_session.py")], input=payload,
                             capture_output=True, text=True, env=env, timeout=60)
        self.assertEqual(res.returncode, 0, res.stderr)
        self.assertEqual(res.stdout, "")
        entry = json.loads((out / "s1.json").read_text(encoding="utf-8"))
        self.assertEqual((entry["state"], entry["name"]), ("done", "redesign"))

    def test_hook_script_survives_rubbish_input(self):
        env = {**os.environ, "DIKTAT_SESSION_DIR": str(Path(tempfile.mkdtemp()))}
        res = subprocess.run([sys.executable, str(ROOT / "hook" / "diktat_session.py")], input="neplatny json",
                             capture_output=True, text=True, env=env, timeout=60)
        self.assertEqual(res.returncode, 0)




class RestartSummaryTests(unittest.TestCase):
    def test_working_session_blocks_the_restart(self):
        ok, text = sessions.restart_summary([{"state": "working", "name": "epizodar"},
                                             {"state": "done", "name": "redesign"}])
        self.assertFalse(ok)
        self.assertIn("epizodar", text)

    def test_only_waiting_sessions_allow_the_restart(self):
        ok, text = sessions.restart_summary([{"state": "asking", "name": "curio"}])
        self.assertTrue(ok)
        self.assertIn("curio", text)

    def test_nothing_running(self):
        ok, text = sessions.restart_summary([])
        self.assertTrue(ok)
        self.assertIn("žiadna session", text)


class DemoTests(unittest.TestCase):
    def test_demo_writes_three_states_and_clears_them(self):
        out = Path(tempfile.mkdtemp())
        paths = sessions.demo(out, now=1000)
        self.assertEqual(len(paths), 3)
        states = sessions.read_states(out, now=1000)
        self.assertEqual([e["state"] for e in states], ["asking", "done", "working"])
        self.assertEqual(sessions.demo_clear(out), 3)
        self.assertEqual(sessions.read_states(out, now=1000), [])

    def test_demo_cli_writes_and_removes(self):
        out = Path(tempfile.mkdtemp())
        env = {**os.environ, "DIKTAT_SESSION_DIR": str(out), "PYTHONIOENCODING": "utf-8"}
        run = lambda *a: subprocess.run([sys.executable, str(ROOT / "app.py"), *a], capture_output=True,  # noqa: E731
                                        text=True, env=env, timeout=120, cwd=str(ROOT))
        res = run("--panel-demo")
        self.assertEqual(res.returncode, 0, res.stderr)
        self.assertEqual(len(list(out.glob("*.json"))), 3)
        res = run("--panel-demo", "off")
        self.assertEqual(res.returncode, 0, res.stderr)
        self.assertEqual(list(out.glob("*.json")), [])

    def test_restart_check_cli_reports_busy_sessions(self):
        out = Path(tempfile.mkdtemp())
        env = {**os.environ, "DIKTAT_SESSION_DIR": str(out), "PYTHONIOENCODING": "utf-8"}
        sessions.record("UserPromptSubmit", {"session_id": "a", "cwd": "/x/epizodar"}, out)
        res = subprocess.run([sys.executable, str(ROOT / "app.py"), "--restart-check"], capture_output=True,
                             text=True, env=env, timeout=120, cwd=str(ROOT))
        self.assertEqual(res.returncode, 1)
        self.assertIn("epizodar", res.stdout)


if __name__ == "__main__":
    unittest.main()
