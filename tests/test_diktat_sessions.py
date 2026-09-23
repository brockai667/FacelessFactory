"""Stav Claude Code sessions pre panel: hook → JSON súbory → riadky panela."""
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from diktat.diktat_core import panel as panelmod, procs, sessions
from diktat import install

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "diktat"))
import app as diktat_app  # noqa: E402

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

    def test_row_text_has_no_clock_by_default(self):
        states = sessions.read_states(self.dir, now=1000 + 90)
        icon, text, color = sessions.row_for(states[0])
        self.assertEqual(icon, "●")
        self.assertEqual(text, "curio · pýta sa ťa")
        self.assertEqual(color, "#ffb300")

    def test_row_text_with_time_when_asked(self):
        states = sessions.read_states(self.dir, now=1000 + 90)
        self.assertEqual(sessions.row_for(states[0], show_time=True)[1], "curio · pýta sa ťa 1 min")

    def test_row_key_ignores_the_clock(self):
        a = sessions.read_states(self.dir, now=1000 + 90)
        b = sessions.read_states(self.dir, now=1000 + 200)
        self.assertEqual([sessions.row_key(e) for e in a], [sessions.row_key(e) for e in b])

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


class PulseTests(unittest.TestCase):
    def test_no_pulse_without_depth(self):
        self.assertEqual(panelmod.pulse_color("#4a9eff", 0.3, 0.0), "#4a9eff")

    def test_pulse_darkens_and_returns(self):
        bright = panelmod.pulse_color("#4a9eff", 0.0, 0.5)
        dark = panelmod.pulse_color("#4a9eff", 0.5, 0.5)
        back = panelmod.pulse_color("#4a9eff", 1.0, 0.5)
        self.assertEqual(bright, "#4a9eff")
        self.assertEqual(back, bright)
        self.assertLess(int(dark[5:7], 16), int(bright[5:7], 16))

    def test_stays_a_valid_colour(self):
        for phase in (0.0, 0.25, 0.5, 0.75, 1.0, 1.25):
            value = panelmod.pulse_color("#ffb300", phase, 0.7)
            self.assertRegex(value, r"^#[0-9a-f]{6}$")

    def test_rubbish_colour_is_returned_as_is(self):
        self.assertEqual(panelmod.pulse_color("zelena", 0.2, 0.5), "zelena")

    def test_only_active_states_pulse(self):
        self.assertGreater(panelmod.PULSE["working"][1], 0)
        self.assertGreater(panelmod.PULSE["asking"][1], 0)
        self.assertEqual(panelmod.PULSE["done"], (0.0, 0.0))


class WindowTrackerTests(unittest.TestCase):
    """Panel nesmie prechádzať všetky okná pri každom mihnutí – to bolo to sekanie."""

    def setUp(self):
        self.scans = 0

        def find():
            self.scans += 1
            return ("hwnd-1", (0, 0, 800, 600))

        self.rects = {"hwnd-1": (0, 0, 800, 600)}
        self.tracker = procs.WindowTracker(["claude.exe"], rescan_seconds=3.0, find=find,
                                           rect_of=lambda h: self.rects.get(h))

    def test_window_is_looked_up_once_and_then_reused(self):
        self.assertEqual(self.tracker.rect(now=0), (0, 0, 800, 600))
        for i in range(20):
            self.tracker.rect(now=i * 0.16)
        self.assertEqual(self.scans, 1)

    def test_moved_window_is_followed_without_a_new_scan(self):
        self.tracker.rect(now=0)
        self.rects["hwnd-1"] = (100, 40, 900, 640)
        self.assertEqual(self.tracker.rect(now=1), (100, 40, 900, 640))
        self.assertEqual(self.scans, 1)

    def test_closed_window_rescans_at_most_every_few_seconds(self):
        self.tracker.rect(now=0)
        self.rects.clear()                       # okno zmizlo
        self.assertIsNone(self.tracker.rect(now=1))
        self.assertIsNone(self.tracker.rect(now=2))
        self.assertEqual(self.scans, 1)          # ešte neuplynulo rescan_seconds
        self.rects["hwnd-1"] = (0, 0, 800, 600)
        self.assertEqual(self.tracker.rect(now=5), (0, 0, 800, 600))
        self.assertEqual(self.scans, 2)


class DemoIsRecognisableTests(unittest.TestCase):
    def test_demo_rows_say_they_are_a_demo(self):
        out = Path(tempfile.mkdtemp())
        sessions.demo(out, now=1000)
        states = sessions.read_states(out, now=1000)
        for entry in states:
            self.assertTrue(entry.get("demo"))
            self.assertIn("ukážka", sessions.row_for(entry)[1])

    def test_demo_disappears_on_its_own(self):
        out = Path(tempfile.mkdtemp())
        sessions.demo(out, now=1000)
        self.assertEqual(len(sessions.read_states(out, now=1000 + 10 * 60)), 3)
        self.assertEqual(sessions.read_states(out, now=1000 + 20 * 60, demo_keep_minutes=15), [])


class DuplicateNamesTests(unittest.TestCase):
    def test_second_session_in_the_same_folder_gets_a_number(self):
        out = Path(tempfile.mkdtemp())
        sessions.record("UserPromptSubmit", {"session_id": "x1", "cwd": "C:/u/Dokumenty"}, out, 1000)
        sessions.record("UserPromptSubmit", {"session_id": "x2", "cwd": "C:/u/Dokumenty"}, out, 1001)
        sessions.record("UserPromptSubmit", {"session_id": "y", "cwd": "C:/u/nemecko"}, out, 1002)
        labels = [e["label"] for e in sessions.read_states(out, now=1003)]
        self.assertEqual(sorted(labels), ["Dokumenty", "Dokumenty (2)", "nemecko"])

    def test_demo_rows_are_not_numbered_and_read_cleanly(self):
        out = Path(tempfile.mkdtemp())
        sessions.demo(out, now=1000)
        texts = [sessions.row_for(e)[1] for e in sessions.read_states(out, now=1001)]
        self.assertEqual(sorted(texts), ["ukážka · hotovo", "ukážka · pracuje", "ukážka · pýta sa ťa"])


class DiagnosticsTests(unittest.TestCase):
    def test_hooks_status_reports_missing_and_registered(self):
        claude = Path(tempfile.mkdtemp())
        self.assertIn("CHÝBA", diktat_app.hooks_status(claude))
        settings = {"hooks": {"Stop": [{"hooks": [{"type": "command", "command": "py",
                                                   "args": ["/h/diktat_session.py"]}]}]}}
        (claude / "settings.json").write_text(json.dumps(settings), encoding="utf-8")
        line = diktat_app.hooks_status(claude)
        self.assertIn("Stop=áno", line)
        self.assertIn("SessionStart=NIE", line)

    def test_panel_status_lists_sessions_and_marks_the_demo(self):
        out = Path(tempfile.mkdtemp())
        sessions.demo(out)
        sessions.record("UserPromptSubmit", {"session_id": "real", "cwd": "/x/nemecko"}, out)
        lines = diktat_app.panel_status({"panel": {"enabled": True, "state_dir": str(out)}})
        self.assertIn(str(out), lines[0])
        self.assertTrue(any("nemecko: working" in ln for ln in lines))
        self.assertEqual(sum("[UKÁŽKA]" in ln for ln in lines), 3)


class TitleTests(unittest.TestCase):
    """Panel má ukazovať to, ako sa chat volá, nie názov priečinka."""

    def setUp(self):
        self.out = Path(tempfile.mkdtemp())

    def test_first_prompt_becomes_the_label(self):
        sessions.record("UserPromptSubmit", {"session_id": "a", "cwd": "C:/u/Dokumenty",
                                             "prompt": "🎤 Nemecko výmenný pobyt, sprav plán"}, self.out, 1000)
        entry = sessions.read_states(self.out, now=1001)[0]
        self.assertEqual(entry["label"], "Nemecko výmenný pobyt, sprav…")
        self.assertEqual(entry["name"], "Dokumenty")

    def test_the_first_prompt_wins_over_later_ones(self):
        base = {"session_id": "a", "cwd": "C:/u/x"}
        sessions.record("UserPromptSubmit", {**base, "prompt": "prvá vec"}, self.out, 1000)
        sessions.record("UserPromptSubmit", {**base, "prompt": "druhá vec"}, self.out, 1001)
        self.assertEqual(sessions.read_states(self.out, now=1002)[0]["label"], "prvá vec")

    def test_folder_is_used_when_no_prompt_was_seen(self):
        sessions.record("SessionStart", {"session_id": "a", "cwd": "C:/u/nemecko"}, self.out, 1000)
        self.assertEqual(sessions.read_states(self.out, now=1001)[0]["label"], "nemecko")

    def test_clean_title_strips_markers_and_shortens(self):
        self.assertEqual(sessions.clean_title("🎤  ahoj   svet "), "ahoj svet")
        self.assertEqual(sessions.clean_title("[diktát] oprav mi to"), "oprav mi to")
        self.assertTrue(sessions.clean_title("a" * 60).endswith("…"))
        self.assertEqual(sessions.clean_title(""), "")


class SystemPromptTests(unittest.TestCase):
    """Obálky harnessu (<task-notification> a spol.) sa nesmú stať názvom session."""

    def setUp(self):
        self.out = Path(tempfile.mkdtemp())

    def _transcript(self, *messages):
        path = self.out / "t.jsonl"
        path.write_text("\n".join(json.dumps(m) for m in messages), encoding="utf-8")
        return str(path)

    def test_system_text_is_recognised(self):
        for text in ("<task-notification>\n<task-id>x</task-id>", "<system-reminder>x</system-reminder>",
                     "[Request interrupted by user]", "Caveat: The messages below…", "   "):
            self.assertTrue(sessions.is_system_text(text), text)
        self.assertFalse(sessions.is_system_text("sprav mi rozvrh < 5 minút"))

    def test_title_falls_back_to_the_transcript(self):
        transcript = self._transcript(
            {"type": "summary", "summary": "nieco"},
            {"type": "user", "isMeta": True, "message": {"role": "user", "content": "Caveat: blah"}},
            {"type": "user", "message": {"role": "user", "content": "<task-notification>x"}},
            {"type": "user", "message": {"role": "user", "content": [{"type": "text", "text": "🎤 Rozvrh sync workflow"}]}},
        )
        sessions.record("UserPromptSubmit", {"session_id": "a", "cwd": "C:/u/Dokumenty",
                                             "prompt": "<task-notification>x", "transcript_path": transcript},
                        self.out, 1000)
        self.assertEqual(sessions.read_states(self.out, now=1001)[0]["label"], "Rozvrh sync workflow")

    def test_session_without_a_prompt_gets_its_name_from_the_transcript(self):
        transcript = self._transcript({"type": "user", "message": {"role": "user", "content": "Odosielanie emailov"}})
        sessions.record("Stop", {"session_id": "b", "cwd": "C:/u/cities", "transcript_path": transcript},
                        self.out, 1000)
        self.assertEqual(sessions.read_states(self.out, now=1001)[0]["label"], "Odosielanie emailov")

    def test_broken_or_missing_transcript_falls_back_to_the_folder(self):
        self.assertEqual(sessions.title_from_transcript(None), "")
        self.assertEqual(sessions.title_from_transcript(self.out / "niet.jsonl"), "")
        bad = self.out / "bad.jsonl"
        bad.write_text("toto nie je json\n{\"type\": \"user\"}\n", encoding="utf-8")
        self.assertEqual(sessions.title_from_transcript(bad), "")
        sessions.record("Stop", {"session_id": "c", "cwd": "C:/u/cities", "transcript_path": str(bad)},
                        self.out, 1000)
        self.assertEqual(sessions.read_states(self.out, now=1001)[0]["label"], "cities")

    def test_bad_title_from_an_older_version_is_replaced(self):
        base = {"session_id": "a", "cwd": "C:/u/Dokumenty"}
        sessions.record("UserPromptSubmit", base, self.out, 1000,
                        extra={"title": "<task-notification> <task-id…"})
        self.assertEqual(sessions.read_states(self.out, now=1001)[0]["label"], "<task-notification> <task-id…")
        sessions.record("UserPromptSubmit", {**base, "prompt": "Rozvrh sync workflow"}, self.out, 1002)
        self.assertEqual(sessions.read_states(self.out, now=1003)[0]["label"], "Rozvrh sync workflow")

    def test_long_label_is_shortened_before_numbering(self):
        long_text = "Toto je velmi dlhy nazov chatu ktory sa nezmesti"
        for sid in ("a", "b"):
            sessions.record("UserPromptSubmit", {"session_id": sid, "cwd": "C:/u/x", "prompt": long_text},
                            self.out, 1000)
        labels = sorted(e["label"] for e in sessions.read_states(self.out, now=1001))
        self.assertTrue(labels[0].endswith("…"), labels)
        self.assertTrue(labels[1].endswith("… (2)"), labels)


class PanelDragTests(unittest.TestCase):
    def test_dropped_position_wins_over_the_window(self):
        p = panelmod.Panel({"x": 300, "y": 500})
        self.assertEqual(p.position((100, 50, 900, 700), 200, 1920), (300, 500))
        self.assertEqual(p.position(None, 200, 1920), (300, 500))

    def test_without_a_dropped_position_it_follows_the_window(self):
        p = panelmod.Panel({"offset_y": 44, "margin_right": 12})
        self.assertEqual(p.position((100, 50, 900, 700), 200, 1920), (688, 94))


class PanelCheckTests(unittest.TestCase):
    """Kontrola panela musí povedať ľudskou rečou, prečo panel nič neukazuje."""

    def setUp(self):
        self.out = Path(tempfile.mkdtemp())
        self.cfg = {"panel": {"enabled": True, "state_dir": str(self.out)}}
        self._running = diktat_app.procs.diktat_running

    def tearDown(self):
        diktat_app.procs.diktat_running = self._running

    def _check(self, running):
        diktat_app.procs.diktat_running = lambda: running
        return "\n".join(diktat_app.panel_check(self.cfg))

    def test_says_when_diktat_is_not_running(self):
        text = self._check(False)
        self.assertIn("diktat beží: NIE", text)
        self.assertIn("Diktat na ploche", text)

    def test_says_when_no_session_reports_yet(self):
        text = self._check(True)
        self.assertIn("žiadna session zatiaľ nehlási stav", text)

    def test_demo_alone_does_not_count_as_a_real_session(self):
        sessions.demo(self.out)
        self.assertIn("žiadna session zatiaľ nehlási stav", self._check(True))

    def test_reports_real_sessions(self):
        sessions.record("UserPromptSubmit", {"session_id": "a", "cwd": "/x/nemecko"}, self.out)
        text = self._check(True)
        self.assertIn("panel má čo ukazovať (1 session)", text)


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
