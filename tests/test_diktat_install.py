"""Testy inštalátora diktat/install.py – všetko v dočasnom ~/.claude, nikdy sa nedotkne reálneho."""
import json
import tempfile
import unittest
from pathlib import Path

from diktat import install


class ClaudeMdMergeTests(unittest.TestCase):
    SNIP = f"{install.BEGIN}\n## Diktát\nx\n{install.END}\n"

    def test_append_to_empty(self):
        self.assertEqual(install.merge_claude_md("", self.SNIP), self.SNIP)

    def test_append_to_existing_keeps_content(self):
        out = install.merge_claude_md("# Moje pravidlá\n- a\n", self.SNIP)
        self.assertTrue(out.startswith("# Moje pravidlá\n- a\n\n"))
        self.assertTrue(out.endswith(self.SNIP))

    def test_replace_existing_block_is_idempotent(self):
        once = install.merge_claude_md("# X\n", self.SNIP)
        new_snip = self.SNIP.replace("x\n", "y\n")
        twice = install.merge_claude_md(once, new_snip)
        self.assertEqual(twice.count(install.BEGIN), 1)
        self.assertIn("y", twice)
        self.assertNotIn("\nx\n", twice)
        self.assertEqual(install.merge_claude_md(twice, new_snip), twice)

    def test_remove_block(self):
        merged = install.merge_claude_md("# X\n- a\n", self.SNIP)
        self.assertEqual(install.remove_from_claude_md(merged), "# X\n- a\n")
        self.assertEqual(install.remove_from_claude_md("# X\n"), "# X\n")


class SettingsHookTests(unittest.TestCase):
    def test_add_hook_idempotent_and_preserves_other_hooks(self):
        settings = {"permissions": {"allow": ["Bash(ls:*)"]},
                    "hooks": {"UserPromptSubmit": [{"hooks": [{"type": "command", "command": "echo hi"}]}],
                              "Stop": [{"hooks": [{"type": "command", "command": "x"}]}]}}
        install.add_hook(settings, "C:/py/python.exe", "C:/u/.claude/hooks/diktat/diktat_hook.py")
        install.add_hook(settings, "C:/py/python.exe", "C:/u/.claude/hooks/diktat/diktat_hook.py")
        ups = settings["hooks"]["UserPromptSubmit"]
        self.assertEqual(len(ups), 2)
        self.assertEqual(ups[0]["hooks"][0]["command"], "echo hi")
        entry = ups[1]["hooks"][0]
        self.assertEqual(entry["type"], "command")
        self.assertEqual(entry["command"], "C:/py/python.exe")
        self.assertEqual(entry["args"], ["C:/u/.claude/hooks/diktat/diktat_hook.py"])
        self.assertEqual(entry["timeout"], 25)
        self.assertIn("Stop", settings["hooks"])
        self.assertEqual(settings["permissions"]["allow"], ["Bash(ls:*)"])

    def test_remove_hook_cleans_empty_containers(self):
        settings = {}
        install.add_hook(settings, "python", "/x/diktat_hook.py")
        install.remove_hook(settings)
        self.assertEqual(settings, {})


class EndToEndTests(unittest.TestCase):
    def test_install_then_uninstall_in_temp_claude_dir(self):
        with tempfile.TemporaryDirectory() as tmp:
            claude_dir = Path(tmp) / ".claude"
            claude_dir.mkdir()
            (claude_dir / "CLAUDE.md").write_text("# Globálne\n- vždy po slovensky\n", encoding="utf-8")
            (claude_dir / "settings.json").write_text('{"model": "opus"}\n', encoding="utf-8")
            logs = []
            install.install(claude_dir, with_hook=True, python_exe="/usr/bin/python3", log=logs.append)

            md = (claude_dir / "CLAUDE.md").read_text(encoding="utf-8")
            self.assertIn("- vždy po slovensky", md)
            self.assertIn(install.BEGIN, md)
            self.assertTrue((claude_dir / "skills" / "diktat" / "SKILL.md").is_file())
            hook_dir = claude_dir / "hooks" / "diktat"
            self.assertTrue((hook_dir / "diktat_hook.py").is_file())
            self.assertTrue((hook_dir / "diktat_core" / "cleanup.py").is_file())
            self.assertTrue((hook_dir / "config.json").is_file())
            settings = json.loads((claude_dir / "settings.json").read_text(encoding="utf-8"))
            self.assertEqual(settings["model"], "opus")
            entry = settings["hooks"]["UserPromptSubmit"][0]["hooks"][0]
            self.assertEqual(entry["command"], "/usr/bin/python3")
            self.assertTrue(entry["args"][0].endswith("hooks/diktat/diktat_hook.py"))
            self.assertTrue(list(claude_dir.glob("settings.json.bak-*")), "záloha settings.json")

            # druhá inštalácia nič nezduplikuje
            install.install(claude_dir, with_hook=True, python_exe="/usr/bin/python3", log=logs.append)
            settings = json.loads((claude_dir / "settings.json").read_text(encoding="utf-8"))
            self.assertEqual(len(settings["hooks"]["UserPromptSubmit"]), 1)
            self.assertEqual((claude_dir / "CLAUDE.md").read_text(encoding="utf-8").count(install.BEGIN), 1)

            install.uninstall(claude_dir, log=logs.append)
            md = (claude_dir / "CLAUDE.md").read_text(encoding="utf-8")
            self.assertEqual(md, "# Globálne\n- vždy po slovensky\n")
            self.assertFalse((claude_dir / "skills" / "diktat").exists())
            self.assertFalse(hook_dir.exists())
            settings = json.loads((claude_dir / "settings.json").read_text(encoding="utf-8"))
            self.assertEqual(settings, {"model": "opus"})

    def test_dry_run_changes_nothing(self):
        with tempfile.TemporaryDirectory() as tmp:
            claude_dir = Path(tmp) / ".claude"
            claude_dir.mkdir()
            install.install(claude_dir, with_hook=True, dry_run=True, log=lambda *_: None)
            self.assertEqual(sorted(p.name for p in claude_dir.iterdir()), [])

    def test_invalid_settings_json_aborts_without_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            claude_dir = Path(tmp) / ".claude"
            claude_dir.mkdir()
            (claude_dir / "settings.json").write_text("{not json", encoding="utf-8")
            with self.assertRaises(json.JSONDecodeError):
                install.install(claude_dir, with_hook=True, log=lambda *_: None)
            self.assertEqual((claude_dir / "settings.json").read_text(encoding="utf-8"), "{not json")


if __name__ == "__main__":
    unittest.main()
