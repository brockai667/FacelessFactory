"""Stav Claude Code sessions pre panel: hook → JSON súbory → riadky panela."""
import json
import os
import subprocess
import sys
import tempfile
import time
import unittest
import unittest.mock
from pathlib import Path

from diktat.diktat_core import panel as panelmod, procs, sessions
from diktat import install

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "diktat"))
import app as diktat_app  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent / "diktat"
EMPTY_APP_DIR = ""          # prázdny priečinok „názvov chatov“, nech testy nezávisia od tohto počítača


def setUpModule():
    """Panel berie názvy z priečinka aplikácie Claude – v testoch ho nasmerujeme na prázdny."""
    global EMPTY_APP_DIR
    EMPTY_APP_DIR = tempfile.mkdtemp()
    os.environ["DIKTAT_APP_SESSION_DIR"] = EMPTY_APP_DIR
    forget_titles()


def tearDownModule():
    os.environ.pop("DIKTAT_APP_SESSION_DIR", None)
    forget_titles()


def forget_titles():
    """diktat/app.py si diktat_core importuje pod inou cestou, takže kópie modulu sú dve – a kešu má každá vlastnú."""
    sessions.forget_app_titles()
    diktat_app.sessionsmod.forget_app_titles()


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
        self.assertEqual(entry["label"], "Nemecko výmenný pobyt, sprav plán")
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

    def test_bad_title_from_an_older_version_is_never_shown(self):
        base = {"session_id": "a", "cwd": "C:/u/Dokumenty"}
        sessions.record("UserPromptSubmit", base, self.out, 1000,
                        extra={"title": "<task-notification> <task-id…"})
        self.assertEqual(sessions.read_states(self.out, now=1001)[0]["label"], "Dokumenty")
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


class TranscriptTitleTests(unittest.TestCase):
    """Názov má sedieť so zoznamom chatov: najprv súhrn od Claude, až potom prvá ľudská správa."""

    def setUp(self):
        self.out = Path(tempfile.mkdtemp())
        sessions._TITLE_CACHE.clear()

    def _transcript(self, name, lines):
        path = self.out / f"{name}.jsonl"
        path.write_text("\n".join(json.dumps(x) for x in lines), encoding="utf-8")
        return str(path)

    def test_summary_wins_over_the_first_message(self):
        path = self._transcript("a", [{"type": "summary", "summary": "Rozvrh sync workflow"},
                                      {"type": "user", "message": {"role": "user", "content": "nejaky prvy prompt"}}])
        self.assertEqual(sessions.title_from_transcript(path), "Rozvrh sync workflow")

    def test_first_human_message_when_there_is_no_summary(self):
        path = self._transcript("b", [{"type": "user", "message": {"role": "user", "content": "<task-notification>x"}},
                                      {"type": "user", "message": {"role": "user", "content": "Odosielanie emailov"}}])
        self.assertEqual(sessions.title_from_transcript(path), "Odosielanie emailov")

    def test_stored_system_title_is_replaced_when_reading(self):
        path = self._transcript("c", [{"type": "summary", "summary": "Curio engine"}])
        sessions.record("Stop", {"session_id": "c", "cwd": "C:/u/Dokumenty", "transcript_path": path},
                        self.out, 1000, extra={"title": "<task-notification> <task-id…"})
        self.assertEqual(sessions.read_states(self.out, now=1001)[0]["label"], "Curio engine")


class TranscriptActivityTests(unittest.TestCase):
    """Session zobudenú systémom nepozná žiadny „nový prompt“ – poznať ju podľa rastúceho prepisu."""

    def setUp(self):
        self.out = Path(tempfile.mkdtemp())
        sessions._TITLE_CACHE.clear()
        self.path = self.out / "t.jsonl"
        self.path.write_text(json.dumps({"type": "summary", "summary": "Rozvrh sync"}), encoding="utf-8")

    def _entry(self, state="done", updated=1000.0):
        return {"state": state, "updated": updated, "since": updated, "transcript": str(self.path)}

    def test_growing_transcript_means_the_session_works(self):
        os.utime(self.path, (1100, 1100))
        entry = sessions.refresh_from_transcript(self._entry(), now=1105)
        self.assertEqual(entry["state"], "working")

    def test_a_long_tool_call_still_counts_as_work(self):
        """Render alebo build beží aj 15 minút a do prepisu za ten čas nenapíše nič – riadok nesmie
        spadnúť na „hotovo“, keď sa do prepisu písalo dávno po tom hlásení."""
        os.utime(self.path, (1100, 1100))
        self.assertEqual(sessions.refresh_from_transcript(self._entry(), now=1100 + 900)["state"], "working")

    def test_a_transcript_quiet_for_half_an_hour_is_done(self):
        os.utime(self.path, (1100, 1100))
        self.assertEqual(sessions.refresh_from_transcript(self._entry(), now=1100 + 2000)["state"], "done")

    def test_write_at_the_moment_of_stop_is_not_work(self):
        os.utime(self.path, (1001, 1001))
        self.assertEqual(sessions.refresh_from_transcript(self._entry(updated=1000), now=1005)["state"], "done")

    def test_working_state_is_left_alone(self):
        os.utime(self.path, (1100, 1100))
        self.assertEqual(sessions.refresh_from_transcript(self._entry("working"), now=1105)["state"], "working")

    def test_missing_transcript_changes_nothing(self):
        entry = {"state": "done", "updated": 1000, "transcript": str(self.out / "niet.jsonl")}
        self.assertEqual(sessions.refresh_from_transcript(entry, now=1005)["state"], "done")

    def test_asking_becomes_working_once_the_transcript_grows_again(self):
        """Keď povolíš nástroj, žiadny hook nepríde – ale prepis zase rastie, takže session pracuje."""
        path = self.out / "a.jsonl"
        path.write_text("x", encoding="utf-8")
        sessions.record("Notification", {"session_id": "a", "cwd": "C:/u/x", "transcript_path": str(path),
                                         "notification_type": "permission_prompt"}, self.out, 1000)
        os.utime(path, (1010, 1010))          # povolil si nástroj, Claude píše ďalej
        self.assertEqual(sessions.read_states(self.out, now=1012)[0]["state"], "working")

    def test_asking_stays_while_nothing_is_written(self):
        """„pýta sa ťa“ nesmie zmiznúť samo – to je stav, ktorý používateľ nesmie prehliadnuť."""
        path = self.out / "a.jsonl"
        path.write_text("x", encoding="utf-8")
        os.utime(path, (1002, 1002))          # zápis tesne pred otázkou sa nesmie rátať
        sessions.record("Notification", {"session_id": "a", "cwd": "C:/u/x", "transcript_path": str(path),
                                         "notification_type": "permission_prompt"}, self.out, 1000)
        self.assertEqual(sessions.read_states(self.out, now=1030)[0]["state"], "asking")

    def test_the_working_window_closes_again(self):
        path = self.out / "a.jsonl"
        path.write_text("x", encoding="utf-8")
        sessions.record("Stop", {"session_id": "a", "cwd": "C:/u/x", "transcript_path": str(path)}, self.out, 1000)
        os.utime(path, (1020, 1020))
        self.assertEqual(sessions.read_states(self.out, now=1022)[0]["state"], "working")
        late = sessions.read_states(self.out, now=1020 + 2000, stale_minutes=9999, done_keep_minutes=9999)
        self.assertEqual(late[0]["state"], "done")

    def test_the_window_can_be_shortened(self):
        path = self.out / "a.jsonl"
        path.write_text("x", encoding="utf-8")
        sessions.record("Stop", {"session_id": "a", "cwd": "C:/u/x", "transcript_path": str(path)}, self.out, 1000)
        os.utime(path, (1010, 1010))
        self.assertEqual(sessions.read_states(self.out, now=1040, working_window_seconds=5)[0]["state"], "done")

class HookEncodingTests(unittest.TestCase):
    """Windows by stdin dekódoval kódovaním konzoly – slovenčina a 🎤 sa rozsypú na „ZatiaÄľ“."""

    def test_slovak_and_emoji_survive_the_hook(self):
        out = Path(tempfile.mkdtemp())
        env = {**os.environ, "DIKTAT_SESSION_DIR": str(out)}
        payload = json.dumps({"hook_event_name": "Stop", "session_id": "s", "cwd": "/x/projekt",
                              "prompt": "🎤 Zatiaľ to nedávaj, ďakujem"}, ensure_ascii=False)
        res = subprocess.run([sys.executable, str(ROOT / "hook" / "diktat_session.py")],
                             input=payload.encode("utf-8"), capture_output=True, timeout=60, env=env)
        self.assertEqual(res.returncode, 0, res.stderr)
        entry = json.loads((out / "s.json").read_text(encoding="utf-8"))
        self.assertEqual(entry["name"], "projekt")
        self.assertEqual(entry["title"], "Zatiaľ to nedávaj, ďakujem")


class AppTitleTests(unittest.TestCase):
    """Názov riadka má byť presne ten, čo je v bočnom zozname aplikácie Claude."""

    def setUp(self):
        self.out = Path(tempfile.mkdtemp())
        self.app = Path(tempfile.mkdtemp()) / "1a618a54" / "887fad3f"
        self.app.mkdir(parents=True)
        os.environ["DIKTAT_APP_SESSION_DIR"] = str(self.app.parent.parent)
        forget_titles()
        sessions._TITLE_CACHE.clear()

    def tearDown(self):
        os.environ["DIKTAT_APP_SESSION_DIR"] = EMPTY_APP_DIR
        forget_titles()

    def _chat(self, session_id, title, **extra):
        """Súbor, aký si aplikácia Claude píše pre jeden chat z bočného zoznamu."""
        data = {"sessionId": f"local_{session_id}", "cliSessionId": session_id,
                "cwd": "C:/Users/x/Helen Doron App", "lastActivityAt": 1790184246991,
                "isArchived": False, "title": title, **extra}
        path = self.app / f"local_{session_id}.json"
        path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        return path

    def test_title_comes_from_the_app_list(self):
        self._chat("a", "Odisielanie emailov")
        self.assertEqual(sessions.app_title("a"), "Odisielanie emailov")

    def test_panel_row_uses_it_instead_of_the_folder_name(self):
        self._chat("a", "Rozvrh sync workflow")
        sessions.record("Stop", {"session_id": "a", "cwd": "C:/u/cool-aryabhata-c87495"}, self.out, 1000)
        self.assertEqual(sessions.read_states(self.out, now=1001)[0]["label"], "Rozvrh sync workflow")

    def test_it_beats_the_first_message_and_the_transcript(self):
        """Prvá správa aj súhrn z prepisu sú len náhrada – zoznam v aplikácii má prednosť."""
        self._chat("a", "Curio engine")
        transcript = self.out / "a.jsonl"
        transcript.write_text(json.dumps({"type": "summary", "summary": "nieco uplne ine"}), encoding="utf-8")
        sessions.record("UserPromptSubmit", {"session_id": "a", "cwd": "C:/u/Dokumenty", "prompt": "viem si prepojit firemny gmail",
                                             "transcript_path": str(transcript)}, self.out, 1000)
        self.assertEqual(sessions.read_states(self.out, now=1001)[0]["label"], "Curio engine")

    def test_renaming_a_chat_renames_the_row(self):
        self._chat("a", "Stary nazov")
        sessions.record("Stop", {"session_id": "a", "cwd": "C:/u/Dokumenty"}, self.out, 1000)
        self.assertEqual(sessions.read_states(self.out, now=1001)[0]["label"], "Stary nazov")
        self._chat("a", "Novy nazov")
        forget_titles()
        self.assertEqual(sessions.read_states(self.out, now=1002)[0]["label"], "Novy nazov")

    def test_unknown_session_falls_back_to_the_old_way(self):
        """Cloudová session (alebo iná verzia aplikácie) v zozname nie je – názov sa doberie postaru."""
        self._chat("a", "Odisielanie emailov")
        sessions.record("Stop", {"session_id": "b", "cwd": "C:/u/epizodar"}, self.out, 1000)
        self.assertEqual(sessions.read_states(self.out, now=1001)[0]["label"], "epizodar")

    def test_newer_file_wins_when_two_hold_the_same_session(self):
        first = self._chat("a", "Stary nazov")
        os.utime(first, (1000, 1000))
        second = self.app / "local_kopia.json"
        second.write_text(json.dumps({"cliSessionId": "a", "title": "Novy nazov"}), encoding="utf-8")
        os.utime(second, (2000, 2000))
        self.assertEqual(sessions.app_title("a"), "Novy nazov")

    def test_a_title_from_a_tool_description_is_not_mistaken_for_the_chat_name(self):
        """V tom istom súbore je „title“ aj v popisoch nástrojov MCP – brať sa smie len ten vrchný."""
        self._chat("a", "Curio engine", remoteMcpServersConfig=[{"tools": [{"title": "Odoslať e-mail"}]}])
        self.assertEqual(sessions.app_title("a"), "Curio engine")

    def test_broken_files_are_ignored(self):
        (self.app / "local_zly.json").write_text("{toto nie je json", encoding="utf-8")
        (self.app / "local_polovicny.json").write_text('{"cliSessionId":"c","title":"nedopis', encoding="utf-8")
        self._chat("a", "Curio engine")
        self.assertEqual(sessions.app_title("a"), "Curio engine")
        self.assertEqual(sessions.app_title("c"), "")

    def test_missing_folder_is_not_an_error(self):
        os.environ["DIKTAT_APP_SESSION_DIR"] = str(self.out / "nieco-co-neexistuje")
        forget_titles()
        self.assertEqual(sessions.app_title("a"), "")
        self.assertEqual(sessions.app_titles(), {})

    def test_only_the_head_of_a_big_file_is_read(self):
        """Súbory majú stovky kB a panel sa pýta raz za sekundu – čítať sa smie len ich začiatok."""
        path = self._chat("a", "Curio engine", padding="x" * 400_000)
        self.assertGreater(path.stat().st_size, 400_000)
        self.assertEqual(sessions.app_title("a"), "Curio engine")
        self.assertEqual(sessions._app_chat_of(path, head_bytes=40)["title"], "")   # useknuté = radšej nič

    def test_a_hook_without_a_session_id_writes_nothing(self):
        """Taký stav by sa zlial do jedného cudzieho riadka „neznama“ – radšej žiadny."""
        self.assertIsNone(sessions.record("UserPromptSubmit", {"cwd": "C:/u/x", "prompt": "hmm oprav testy"},
                                          self.out, 1000))
        self.assertEqual(list(self.out.glob("*.json")), [])

    def test_a_row_left_over_without_an_id_is_not_shown(self):
        (self.out / "neznama.json").write_text(json.dumps(
            {"session": "", "name": "session", "state": "working", "since": 1000, "updated": 1000,
             "title": "hmm oprav testy. Ignoruj posledný…"}), encoding="utf-8")
        self.assertEqual(sessions.read_states(self.out, now=1001), [])

    def test_an_archived_chat_is_not_shown(self):
        """Archivovaný chat v bočnom zozname nie je, takže ani v paneli byť nemá."""
        self._chat("a", "Curio engine", isArchived=True)
        sessions.record("Stop", {"session_id": "a", "cwd": "C:/u/Dokumenty"}, self.out, 1000)
        self.assertEqual(sessions.read_states(self.out, now=1001), [])

    def test_a_session_the_app_does_not_know_is_kept(self):
        """Session z príkazového riadka aplikácia nepozná – tá sa skryť nesmie."""
        self._chat("a", "Curio engine")
        sessions.record("Stop", {"session_id": "z", "cwd": "C:/u/epizodar"}, self.out, 1000)
        self.assertFalse(sessions.app_archived("z"))
        self.assertEqual(sessions.read_states(self.out, now=1001)[0]["label"], "epizodar")

    def test_top_level_reader_handles_true_false_and_numbers(self):
        text = '{"cliSessionId":"a","lastActivityAt":1790184246991,"isArchived":true,"title":"Curio engine"}'
        fields = sessions._top_level_fields(text, ("cliSessionId", "isArchived", "title"))
        self.assertEqual(fields, {"cliSessionId": "a", "isArchived": True, "title": "Curio engine"})
    def test_a_row_knows_the_link_to_its_chat(self):
        self._chat("a", "Curio engine")
        self.assertEqual(sessions.app_link("a"), sessions.APP_LINK.format("local_a"))

    def test_an_unknown_session_has_no_link(self):
        self._chat("a", "Curio engine")
        self.assertEqual(sessions.app_link("z"), "")
        self.assertEqual(sessions.app_link(""), "")

    def test_a_file_without_its_own_id_gives_no_link(self):
        (self.app / "local_bez.json").write_text(
            json.dumps({"cliSessionId": "b", "title": "Bez id"}), encoding="utf-8")
        self.assertEqual(sessions.app_title("b"), "Bez id")
        self.assertEqual(sessions.app_link("b"), "")


class AppTitlesRecoverTests(unittest.TestCase):
    """Diktat sa spúšťa aj pár sekúnd po prebudení počítača. Keď vtedy priečinok aplikácie ešte nevidno,
    panel sa z toho musí spamätať sám – nie až po reštarte."""

    def setUp(self):
        self.out = Path(tempfile.mkdtemp())
        self.app = self.out / "sessions"
        os.environ["DIKTAT_APP_SESSION_DIR"] = str(self.app)
        forget_titles()

    def tearDown(self):
        os.environ["DIKTAT_APP_SESSION_DIR"] = EMPTY_APP_DIR
        forget_titles()

    def _chat(self, session_id, title):
        self.app.mkdir(parents=True, exist_ok=True)
        (self.app / f"local_{session_id}.json").write_text(
            json.dumps({"sessionId": f"local_{session_id}", "cliSessionId": session_id, "title": title}),
            encoding="utf-8")

    def test_a_folder_that_shows_up_later_is_picked_up(self):
        self.assertEqual(sessions.app_titles(), {})          # priečinok ešte nie je
        self._chat("a", "Curio engine")
        self.assertEqual(sessions.app_titles(), {"a": "Curio engine"})   # bez čakania na ttl

    def test_a_missing_folder_is_not_remembered_as_an_answer(self):
        sessions.app_titles()
        self.assertEqual(sessions._APP_SCANNED_AT, 0.0, "prázdny výsledok sa nesmie zapamätať")

    def test_a_clock_jump_backwards_does_not_freeze_it(self):
        self._chat("a", "Curio engine")
        sessions.app_titles()
        sessions._APP_SCANNED_AT = time.time() + 3600        # hodiny skočili dozadu o hodinu
        self._chat("b", "Nový chat")
        self.assertIn("b", sessions.app_titles())

    def test_a_working_folder_is_still_cached(self):
        self._chat("a", "Curio engine")
        sessions.app_titles()
        self._chat("b", "Pribudlo hneď potom")
        self.assertNotIn("b", sessions.app_titles(), "do ttl sa nemá hľadať znova")
    def test_a_broken_scan_throws_everything_away_and_retries(self):
        """Keď čítanie zlyhá, zapamätané údaje sú podozrivé – panel sa nesmie na nich zaseknúť."""
        self._chat("a", "Curio engine")
        self.assertEqual(sessions.app_titles(), {"a": "Curio engine"})
        sessions._APP_SCANNED_AT = 0.0          # inak by do ttl vrátil zapamätané a k čítaniu by nedošlo
        with unittest.mock.patch.object(sessions, "_scan_app_titles", side_effect=RuntimeError("rozbité")):
            self.assertEqual(sessions.app_titles(), {})
            self.assertEqual(sessions._APP_SCANNED_AT, 0.0)
            self.assertEqual(sessions._APP_CACHE, {})
        self.assertEqual(sessions.app_titles(), {"a": "Curio engine"})   # hneď ďalšie volanie, bez čakania

    def test_the_panel_never_sees_the_exception(self):
        self._chat("a", "Curio engine")
        sessions._APP_SCANNED_AT = 0.0
        with unittest.mock.patch.object(sessions, "_scan_app_titles", side_effect=RuntimeError("rozbité")):
            self.assertEqual(sessions.app_title("a"), "")
            self.assertFalse(sessions.app_archived("a"))
            self.assertEqual(sessions.app_link("a"), "")


class AppTitleStatusTests(unittest.TestCase):
    """Diagnostika musí povedať, či názvy z aplikácie vôbec vidíme."""

    def tearDown(self):
        os.environ["DIKTAT_APP_SESSION_DIR"] = EMPTY_APP_DIR
        forget_titles()

    def test_says_how_many_titles_it_sees(self):
        app = Path(tempfile.mkdtemp())
        (app / "local_a.json").write_text(json.dumps({"cliSessionId": "a", "title": "Curio engine"}), encoding="utf-8")
        os.environ["DIKTAT_APP_SESSION_DIR"] = str(app)
        forget_titles()
        self.assertIn("1 z aplikácie", diktat_app.app_titles_status())

    def test_says_when_the_folder_is_missing(self):
        os.environ["DIKTAT_APP_SESSION_DIR"] = str(Path(tempfile.mkdtemp()) / "niet")
        forget_titles()
        self.assertIn("nenašiel", diktat_app.app_titles_status())


class TitleFinderTests(unittest.TestCase):
    """Hľadač názvov: nájde súbor, v ktorom je text z bočného zoznamu Claude."""

    def test_reports_the_file_that_contains_the_title(self):
        home = Path(tempfile.mkdtemp())
        claude = home / ".claude" / "projects" / "p"
        claude.mkdir(parents=True)
        (claude / "a.jsonl").write_text('{"type":"summary","summary":"Rozvrh sync workflow"}', encoding="utf-8")
        (claude / "b.jsonl").write_text('{"type":"user"}', encoding="utf-8")
        with unittest.mock.patch.object(Path, "home", staticmethod(lambda: home)):
            out = "\n".join(diktat_app.find_title("Rozvrh sync workflow"))
        self.assertIn("NÁJDENÉ", out)
        self.assertIn("a.jsonl", out)
        self.assertNotIn("b.jsonl", out)

    def test_says_when_nothing_matches(self):
        home = Path(tempfile.mkdtemp())
        (home / ".claude").mkdir(parents=True)
        with unittest.mock.patch.object(Path, "home", staticmethod(lambda: home)):
            out = "\n".join(diktat_app.find_title("čosi čo tam nie je"))
        self.assertIn("nenašlo", out)

    def test_without_a_name_it_shows_the_layout(self):
        home = Path(tempfile.mkdtemp())
        (home / ".claude" / "projects").mkdir(parents=True)
        with unittest.mock.patch.object(Path, "home", staticmethod(lambda: home)):
            out = "\n".join(diktat_app.find_title(""))
        self.assertIn("Názvy chatov berie panel odtiaľto", out)
        self.assertIn("projects/", out)


class SummaryTailTests(unittest.TestCase):
    def test_summary_added_later_is_found_at_the_end(self):
        out = Path(tempfile.mkdtemp())
        sessions._TITLE_CACHE.clear()
        path = out / "t.jsonl"
        path.write_text("\n".join([
            json.dumps({"type": "user", "message": {"role": "user", "content": "prvy prompt o rozvrhu"}}),
            json.dumps({"type": "assistant", "message": {"role": "assistant", "content": "…"}}),
            json.dumps({"type": "summary", "summary": "Rozvrh sync workflow"}),
        ]), encoding="utf-8")
        self.assertEqual(sessions.title_from_transcript(path), "Rozvrh sync workflow")


class DoneRowsWaitTests(unittest.TestCase):
    """Hotový riadok nemá zmiznúť sám – čaká, kým ho zavrieš krížikom."""

    def setUp(self):
        self.out = Path(tempfile.mkdtemp())

    def test_a_done_row_is_still_there_hours_later(self):
        sessions.record("Stop", {"session_id": "a", "cwd": "C:/u/epizodar"}, self.out, 1000)
        rows = sessions.read_states(self.out, now=1000 + 3 * 3600, stale_minutes=9999)
        self.assertEqual(rows[0]["state"], "done")

    def test_it_can_still_be_set_to_expire(self):
        sessions.record("Stop", {"session_id": "a", "cwd": "C:/u/epizodar"}, self.out, 1000)
        self.assertEqual(sessions.read_states(self.out, now=1000 + 3600, done_keep_minutes=30), [])

    def test_live_rows_are_never_pushed_out_by_done_ones(self):
        """Keď sa hotové hromadia, nesmú vytlačiť session, ktorá pracuje alebo sa pýta."""
        for i in range(6):
            sessions.record("Stop", {"session_id": f"h{i}", "cwd": f"C:/u/h{i}"}, self.out, 1000 + i)
        sessions.record("UserPromptSubmit", {"session_id": "prac", "cwd": "C:/u/prac"}, self.out, 1100)
        sessions.record("Notification", {"session_id": "pyta", "cwd": "C:/u/pyta",
                                         "notification_type": "permission_prompt"}, self.out, 1101)
        rows = sessions.read_states(self.out, now=1102, max_rows=4)
        states = [r["state"] for r in rows]
        self.assertEqual(len(rows), 4)
        self.assertIn("asking", states)
        self.assertIn("working", states)

    def test_trimming_keeps_the_order_it_was_given(self):
        entries = [{"state": "asking"}, {"state": "done"}, {"state": "working"}, {"state": "done"}]
        self.assertEqual(sessions.trim_rows(entries, 3),
                         [{"state": "asking"}, {"state": "done"}, {"state": "working"}])

    def test_trimming_does_nothing_when_everything_fits(self):
        entries = [{"state": "done"}, {"state": "done"}]
        self.assertEqual(sessions.trim_rows(entries, 8), entries)

class HiddenRowTests(unittest.TestCase):
    """Krížik na riadku: session je vybavená, nech ju panel neukazuje – kým sa zase neozve."""

    def setUp(self):
        self.out = Path(tempfile.mkdtemp())

    def _stop(self, session="a", now=1000.0):
        sessions.record("Stop", {"session_id": session, "cwd": "C:/u/epizodar"}, self.out, now)

    def test_a_closed_row_disappears(self):
        self._stop()
        entry = sessions.read_states(self.out, now=1001)[0]
        sessions.hide_row(entry["session"], entry["reported"], self.out)
        self.assertEqual(sessions.read_states(self.out, now=1002), [])

    def test_it_comes_back_when_the_session_reports_again(self):
        self._stop()
        sessions.hide_row("a", 1000.0, self.out)
        self.assertEqual(sessions.read_states(self.out, now=1002), [])
        sessions.record("UserPromptSubmit", {"session_id": "a", "cwd": "C:/u/epizodar"}, self.out, 1100)
        self.assertEqual(sessions.read_states(self.out, now=1101)[0]["state"], "working")

    def test_closing_one_row_leaves_the_others(self):
        self._stop("a")
        self._stop("b")
        sessions.hide_row("a", 1000.0, self.out)
        rows = sessions.read_states(self.out, now=1001)
        self.assertEqual([r["session"] for r in rows], ["b"])

    def test_a_long_tool_call_does_not_bring_a_closed_row_back(self):
        """Zavrieť sa dá aj session, ktorej ešte rastie prepis – nesmie sa hneď vrátiť."""
        path = self.out / "t.jsonl"
        path.write_text("x", encoding="utf-8")
        sessions.record("Stop", {"session_id": "a", "cwd": "C:/u/x", "transcript_path": str(path)}, self.out, 1000)
        os.utime(path, (1020, 1020))
        self.assertEqual(sessions.read_states(self.out, now=1022)[0]["state"], "working")
        sessions.hide_row("a", 1000.0, self.out)
        self.assertEqual(sessions.read_states(self.out, now=1030), [])

    def test_show_all_rows_brings_them_back(self):
        self._stop()
        sessions.hide_row("a", 1000.0, self.out)
        self.assertEqual(sessions.show_all_rows(self.out), 1)
        self.assertEqual(len(sessions.read_states(self.out, now=1001)), 1)

    def test_closing_without_an_id_does_nothing(self):
        self.assertFalse(sessions.hide_row("", 1000.0, self.out))
        self.assertFalse(sessions.hide_row(None, 1000.0, self.out))

    def test_the_helper_file_is_never_a_row(self):
        self._stop()
        sessions.hide_row("b", 1.0, self.out)
        self.assertTrue((self.out / sessions.HIDDEN_FILE).is_file())
        self.assertEqual(len(sessions.read_states(self.out, now=1001)), 1)


class WindowFocusTests(unittest.TestCase):
    """Klik na riadok prepne na okno Claude."""

    def test_it_focuses_the_window_it_already_knows(self):
        calls = []
        t = procs.WindowTracker(["claude.exe"], find=lambda: (7, (0, 0, 10, 10)),
                                rect_of=lambda h: (0, 0, 10, 10), focus_of=lambda h: calls.append(h) or True)
        t.rect(now=0)
        self.assertTrue(t.focus())
        self.assertEqual(calls, [7])

    def test_it_looks_for_the_window_when_it_does_not_know_one(self):
        t = procs.WindowTracker(["claude.exe"], find=lambda: (9, None), rect_of=lambda h: None,
                                focus_of=lambda h: h == 9)
        self.assertTrue(t.focus())

    def test_no_window_means_no_crash(self):
        t = procs.WindowTracker(["claude.exe"], find=lambda: (None, None), rect_of=lambda h: None,
                                focus_of=lambda h: True)
        self.assertFalse(t.focus())

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
