"""Testy UserPromptSubmit hooku – spúšťa sa ako samostatný proces, presne ako ho volá Claude Code."""
import json
import os
import subprocess
import sys
import unittest
from pathlib import Path

HOOK = Path(__file__).resolve().parent.parent / "diktat" / "hook" / "diktat_hook.py"


def run_hook(payload, env_extra=None):
    env = dict(os.environ, DIKTAT_HOOK_LLM="0", DIKTAT_CONFIG="/nonexistent.json")
    env.update(env_extra or {})
    proc = subprocess.run(
        [sys.executable, str(HOOK)], input=payload, capture_output=True, text=True, env=env, timeout=30,
        encoding="utf-8",
    )
    return proc


class HookTests(unittest.TestCase):
    def test_plain_prompt_produces_no_output(self):
        proc = run_hook(json.dumps({"hook_event_name": "UserPromptSubmit", "prompt": "Oprav testy."}))
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout.strip(), "")

    def test_dictated_prompt_adds_context_with_cleaned_version(self):
        payload = json.dumps({"hook_event_name": "UserPromptSubmit",
                              "prompt": "🎤 hmm oprav testy. Ignoruj posledný riadok. Oprav retry."},
                             ensure_ascii=False)
        proc = run_hook(payload)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        out = json.loads(proc.stdout)
        hso = out["hookSpecificOutput"]
        self.assertEqual(hso["hookEventName"], "UserPromptSubmit")
        self.assertIn("NADIKTOVAL", hso["additionalContext"])
        self.assertIn("Oprav retry.", hso["additionalContext"])
        self.assertNotIn("Ignoruj posledný riadok", hso["additionalContext"].split("vyčistená verzia")[-1])

    def test_dictated_prompt_identical_after_cleanup_has_no_cleaned_block(self):
        proc = run_hook(json.dumps({"prompt": "[d] Oprav testy."}, ensure_ascii=False))
        out = json.loads(proc.stdout)
        self.assertNotIn("vyčistená verzia", out["hookSpecificOutput"]["additionalContext"])

    def test_garbage_stdin_is_silent_and_exit_zero(self):
        proc = run_hook("this is not json")
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout.strip(), "")

    def test_empty_prompt_is_silent(self):
        proc = run_hook(json.dumps({"prompt": "   "}))
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout.strip(), "")


if __name__ == "__main__":
    unittest.main()
