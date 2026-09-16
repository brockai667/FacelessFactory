#!/usr/bin/env python3
"""Nainštaluje diktat do Claude Code GLOBÁLNE (~/.claude) – platí pre všetky projekty a sessions.

Čo robí (idempotentne, dá sa spustiť opakovane):
  1. ~/.claude/CLAUDE.md            – pridá/obnoví blok pravidiel pre diktovaný vstup (medzi značkami diktat:begin/end)
  2. ~/.claude/skills/diktat/       – globálny skill /diktat
  3. ~/.claude/hooks/diktat/        – UserPromptSubmit hook + diktat_core + config.json
  4. ~/.claude/settings.json        – zaregistruje hook (exec forma: python + cesta, bez shellu, funguje aj na Windows)
     (pred zápisom sa spraví záloha settings.json.bak-<čas>)

Použitie:
  python install.py                # nainštaluj všetko
  python install.py --no-hook      # bez hooku (len CLAUDE.md + skill)
  python install.py --dry-run      # len ukáž, čo by sa zmenilo
  python install.py --uninstall    # odstráň všetko, čo inštalátor pridal
  python install.py --claude-dir C:/iná/cesta/.claude
  python install.py --autostart    # Windows: spúšťaj diktat skryto (ikona v lište) po prihlásení
  python install.py --no-autostart # zruš autoštart
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BEGIN, END = "<!-- diktat:begin -->", "<!-- diktat:end -->"
HOOK_FILE = "diktat_hook.py"


VBS_NAME = "diktat_tray.vbs"
WATCH_VBS_NAME = "diktat_watch.vbs"
TASK_NAME = "diktat-watch"


def safe_print(msg: str) -> None:
    """print, ktorý nespadne na emoji v konzole s cp1250 (a pri presmerovaní do súboru)."""
    try:
        print(msg, flush=True)
    except UnicodeEncodeError:
        print(msg.encode("ascii", "replace").decode("ascii"), flush=True)
    try:
        with open(HERE / "logs" / "install.log", "a", encoding="utf-8") as fh:
            import datetime as _dt
            fh.write(f"{_dt.datetime.now():%Y-%m-%d %H:%M:%S} {msg}\n")
    except Exception:  # noqa: BLE001
        pass



def startup_folder() -> Path:
    """Windows priečinok „Po spustení“ aktuálneho používateľa."""
    appdata = os.environ.get("APPDATA") or str(Path.home() / "AppData" / "Roaming")
    return Path(appdata) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"


def pythonw_for(python_exe: str) -> str:
    p = Path(python_exe)
    if p.name.lower() == "python.exe":
        cand = p.with_name("pythonw.exe")
        if cand.is_file():
            return str(cand)
    return str(p)


def vbs_launcher(python_exe: str, script_path: Path, args: str = "--tray") -> str:
    """VBScript, ktorý spustí skript bez konzolového okna (0 = skryté)."""
    py = pythonw_for(python_exe)
    arg = f" {args}" if args else ""
    return (
        'Set sh = CreateObject("WScript.Shell")\r\n'
        f'sh.CurrentDirectory = "{script_path.parent}"\r\n'
        f'sh.Run """{py}"" ""{script_path}""{arg}", 0, False\r\n'
    )


def watch_vbs(python_exe: str, app_path: Path, follow: list[str]) -> str:
    """Jednorazová kontrola (spúšťa ju Plánovač úloh raz za minútu, trvá ~1 s, nič nezostáva bežať):
    ak má niektorý zo sledovaných programov OTVORENÉ OKNO (nie len proces na pozadí) a diktat nebeží,
    spustí diktat skryto. Okná zisťuje PowerShell (MainWindowHandle), spustený bez okna cez sh.Run(…, 0)."""
    py = pythonw_for(python_exe)
    ps_names = ",".join(f"'{p.strip().lower()[:-4] if p.strip().lower().endswith('.exe') else p.strip().lower()}'"
                        for p in follow if p.strip()) or "'claude'"
    ps = ("$n=@(" + ps_names + "); exit [int](((Get-Process -Name $n -ErrorAction SilentlyContinue | "
          "Where-Object { $_.MainWindowHandle -ne 0 }) | Measure-Object).Count -gt 0)")
    ps_vbs = ps.replace('"', '""')
    return (
        "' diktat strážca – generuje install.py --autostart, spúšťa Plánovač úloh (úloha diktat-watch) raz za minútu\r\n"
        'Set sh = CreateObject("WScript.Shell")\r\n'
        "' 1) má Claude/prehliadač otvorené okno? (procesy na pozadí sa nerátajú)\r\n"
        f'code = sh.Run("powershell -NoProfile -NonInteractive -Command ""{ps_vbs}""", 0, True)\r\n'
        "claudeRunning = (code = 1)\r\n"
        "If Not claudeRunning Then WScript.Quit 0\r\n"
        "' 2) beží už diktat? (podľa príkazového riadku alebo PID súboru)\r\n"
        'Set wmi = GetObject("winmgmts:\\\\.\\root\\cimv2")\r\n'
        'Set procs = wmi.ExecQuery("SELECT Name, CommandLine, ProcessId FROM Win32_Process")\r\n'
        "diktatRunning = False : pidRunning = \"\"\r\n"
        "Set fso = CreateObject(\"Scripting.FileSystemObject\")\r\n"
        f'pidFile = "{app_path.parent / "logs" / "diktat.pid"}"\r\n'
        "If fso.FileExists(pidFile) Then\r\n"
        "  On Error Resume Next\r\n"
        "  pidRunning = Trim(fso.OpenTextFile(pidFile, 1).ReadAll)\r\n"
        "  On Error GoTo 0\r\n"
        "End If\r\n"
        "For Each p In procs\r\n"
        '  If InStr(LCase(p.CommandLine & ""), "diktat\\app.py") > 0 Then diktatRunning = True\r\n'
        "  If pidRunning <> \"\" And CStr(p.ProcessId) = pidRunning And InStr(LCase(p.Name & \"\"), \"python\") > 0 Then diktatRunning = True\r\n"
        "Next\r\n"
        "If Not diktatRunning Then\r\n"
        f'  sh.CurrentDirectory = "{app_path.parent}"\r\n'
        f'  sh.Run """{py}"" ""{app_path}"" --tray", 0, False\r\n'
        "End If\r\n"
    )


def task_xml(watch_vbs_path: Path, user: str | None = None) -> str:
    """Úloha Plánovača: od prihlásenia TOHTO používateľa (a hneď od registrácie) každú minútu spusti kontrolu;
    aj na batérii; skrytá. Spúšťač pri prihlásení bez UserId by vyžadoval správcu (Access is denied)."""
    user = user or current_user()
    action = f'<Command>wscript.exe</Command><Arguments>"{watch_vbs_path}"</Arguments>'
    rep = "<Repetition><Interval>PT1M</Interval><StopAtDurationEnd>false</StopAtDurationEnd></Repetition>"
    return f"""<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo><Description>diktat: spusti diktat, keď beží Claude/prehliadač (kontrola raz za minútu)</Description></RegistrationInfo>
  <Triggers>
    <LogonTrigger><Enabled>true</Enabled><UserId>{user}</UserId>{rep}</LogonTrigger>
    <RegistrationTrigger><Enabled>true</Enabled>{rep}</RegistrationTrigger>
  </Triggers>
  <Principals><Principal id="Author"><UserId>{user}</UserId><LogonType>InteractiveToken</LogonType><RunLevel>LeastPrivilege</RunLevel></Principal></Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings><StopOnIdleEnd>false</StopOnIdleEnd><RestartOnIdle>false</RestartOnIdle></IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>true</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT1M</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author"><Exec>{action}</Exec></Actions>
</Task>
"""


def _run(cmd: list[str], timeout: int = 90):
    import subprocess
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, errors="replace")


def register_task(watch_vbs_path: Path, log=safe_print) -> bool:
    """Zaregistruje úlohu diktat-watch bez práv správcu. Tri spôsoby za sebou, prvý úspešný vyhráva:
    1. schtasks /xml s výslovne uvedeným používateľom,
    2. PowerShell Register-ScheduledTask (logon + každú minútu, aj na batérii),
    3. schtasks /sc minute /mo 1 (najjednoduchšia minútová úloha)."""
    import tempfile
    user = current_user()
    # 1. XML
    try:
        xml_path = Path(tempfile.gettempdir()) / "diktat-watch.xml"
        xml_path.write_text(task_xml(watch_vbs_path, user), encoding="utf-16")
        res = _run(["schtasks", "/create", "/tn", TASK_NAME, "/xml", str(xml_path), "/f"])
        if res.returncode == 0:
            log(f"schtasks /xml ({user}): {(res.stdout or '').strip()[:160]}")
            return True
        log(f"✖ schtasks /xml (kód {res.returncode}): {(res.stderr or res.stdout).strip()[:200]}")
    except Exception as exc:  # noqa: BLE001
        log(f"✖ schtasks /xml zlyhal: {exc}")
    # 2. PowerShell
    ps = (
        "$ErrorActionPreference='Stop';"
        f"$a = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument '\"{watch_vbs_path}\"';"
        "$rep = (New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 1)).Repetition;"
        f"$t1 = New-ScheduledTaskTrigger -AtLogOn -User '{user}'; $t1.Repetition = $rep;"
        "$t2 = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1);"
        "$s = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew "
        "-ExecutionTimeLimit (New-TimeSpan -Minutes 1) -Hidden -StartWhenAvailable;"
        f"Register-ScheduledTask -TaskName '{TASK_NAME}' -Action $a -Trigger $t1,$t2 -Settings $s -Force | Out-Null;"
        "'OK'"
    )
    try:
        res = _run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps])
        if res.returncode == 0 and "OK" in (res.stdout or ""):
            log("PowerShell Register-ScheduledTask: OK")
            return True
        log(f"✖ PowerShell Register-ScheduledTask (kód {res.returncode}): {(res.stderr or res.stdout).strip()[:300]}")
    except Exception as exc:  # noqa: BLE001
        log(f"✖ PowerShell zlyhal: {exc}")
    # 3. jednoduchá minútová úloha
    try:
        res = _run(["schtasks", "/create", "/sc", "minute", "/mo", "1", "/tn", TASK_NAME,
                    "/tr", f'wscript.exe "{watch_vbs_path}"', "/f"])
        if res.returncode == 0:
            log(f"schtasks /sc minute: {(res.stdout or '').strip()[:160]} (pozor: na batérii môže byť pozastavená)")
            return True
        log(f"✖ schtasks /sc minute (kód {res.returncode}): {(res.stderr or res.stdout).strip()[:200]}")
    except Exception as exc:  # noqa: BLE001
        log(f"✖ schtasks /sc minute zlyhal: {exc}")
    return False


def task_exists() -> bool:
    try:
        return _run(["schtasks", "/query", "/tn", TASK_NAME], timeout=30).returncode == 0
    except Exception:  # noqa: BLE001
        return False


def unregister_task(log=safe_print) -> None:
    try:
        _run(["schtasks", "/delete", "/tn", TASK_NAME, "/f"], timeout=60)
    except Exception:  # noqa: BLE001
        pass


def install_autostart(python_exe: str, app_path: Path, follow: list[str] | None = None,
                      startup_dir: Path | None = None, dry_run: bool = False, log=safe_print,
                      register: bool | None = None) -> Path:
    """diktat_tray.vbs (ručné spustenie) + diktat_watch.vbs + úloha Plánovača „diktat-watch“ (raz za minútu):
    ak beží Claude/prehliadač (follow.processes) a diktat nie, spustí ho. Žiadny proces nezostáva bežať.
    Prázdny follow = diktat sa spustí pri prihlásení priamo (Startup priečinok)."""
    startup_dir = startup_dir or startup_folder()
    tag = "[dry-run] " if dry_run else ""
    if follow is None:
        try:
            sys.path.insert(0, str(app_path.parent))
            from diktat_core import config as _cfgmod
            follow = _cfgmod.load_config(app_path.parent / "config.json").get("follow", {}).get("processes") or []
        except Exception as exc:  # noqa: BLE001
            log(f"✖ config sa nepodarilo načítať ({exc}) – používam predvolený zoznam programov")
            follow = ["claude.exe", "opera.exe", "chrome.exe"]
    local = app_path.parent / VBS_NAME
    watch_local = app_path.parent / WATCH_VBS_NAME
    if not dry_run:
        local.write_text(vbs_launcher(python_exe, app_path, "--tray"), encoding="utf-8")
        startup_dir.mkdir(parents=True, exist_ok=True)
        for stale in (startup_dir / VBS_NAME, startup_dir / WATCH_VBS_NAME):   # staršie inštalácie
            if stale.is_file():
                stale.unlink()
    log(f"{tag}✔ {local}: spúšťač diktatu (dvojklik = spusti hneď teraz)")
    if not follow:
        target = startup_dir / VBS_NAME
        if not dry_run:
            target.write_text(vbs_launcher(python_exe, app_path, "--tray"), encoding="utf-8")
            unregister_task(log)
        log(f"{tag}✔ {target}: autoštart diktatu po prihlásení (follow je prázdny)")
        return target
    if not dry_run:
        watch_local.write_text(watch_vbs(python_exe, app_path, follow), encoding="utf-8")
    log(f"{tag}✔ {watch_local}: kontrola „beží Claude?“ (sleduje: {', '.join(follow)})")
    if register is None:
        register = sys.platform == "win32"
    if register and not dry_run:
        ok = register_task(watch_local, log)
        if ok and not task_exists():
            log("✖ úloha sa po registrácii nenašla (schtasks /query)")
            ok = False
        log(f"✔ Plánovač úloh: úloha {TASK_NAME} raz za minútu" if ok
            else f"✖ úlohu {TASK_NAME} sa nepodarilo vytvoriť – diktat spúšťaj dvojklikom na {VBS_NAME}")
    else:
        log(f"{tag}✔ Plánovač úloh: úloha {TASK_NAME} raz za minútu")
    return watch_local


def remove_autostart(app_path: Path, startup_dir: Path | None = None, dry_run: bool = False, log=safe_print) -> None:
    startup_dir = startup_dir or startup_folder()
    tag = "[dry-run] " if dry_run else ""
    for path in (startup_dir / VBS_NAME, startup_dir / WATCH_VBS_NAME,
                 app_path.parent / VBS_NAME, app_path.parent / WATCH_VBS_NAME):
        if path.is_file():
            if not dry_run:
                path.unlink()
            log(f"{tag}✔ {path}: odstránené")
    if not dry_run and sys.platform == "win32":
        unregister_task(log)
        log(f"✔ Plánovač úloh: úloha {TASK_NAME} odstránená")


def default_claude_dir() -> Path:
    env = os.environ.get("CLAUDE_CONFIG_DIR")
    return Path(env) if env else Path.home() / ".claude"


# --- 1. CLAUDE.md ---------------------------------------------------------------------------------
def merge_claude_md(existing: str, snippet: str) -> str:
    snippet = snippet.strip("\n")
    if BEGIN in existing and END in existing:
        start = existing.index(BEGIN)
        end = existing.index(END) + len(END)
        return existing[:start] + snippet + existing[end:]
    base = existing.rstrip("\n")
    return (base + "\n\n" if base else "") + snippet + "\n"


def remove_from_claude_md(existing: str) -> str:
    if BEGIN not in existing or END not in existing:
        return existing
    start = existing.index(BEGIN)
    end = existing.index(END) + len(END)
    out = existing[:start].rstrip("\n") + "\n" + existing[end:].lstrip("\n")
    return out.strip("\n") + ("\n" if out.strip() else "")


# --- 4. settings.json -------------------------------------------------------------------------------
def _is_diktat_entry(entry: dict) -> bool:
    for h in entry.get("hooks", []) or []:
        blob = " ".join([str(h.get("command", ""))] + [str(a) for a in (h.get("args") or [])])
        if HOOK_FILE in blob:
            return True
    return False


def hook_entry(python_exe: str, hook_path: str, timeout: int = 25) -> dict:
    return {"hooks": [{"type": "command", "command": python_exe, "args": [hook_path], "timeout": timeout}]}


def add_hook(settings: dict, python_exe: str, hook_path: str) -> dict:
    hooks = settings.setdefault("hooks", {})
    entries = hooks.get("UserPromptSubmit")
    if not isinstance(entries, list):
        entries = []
    entries = [e for e in entries if not (isinstance(e, dict) and _is_diktat_entry(e))]
    entries.append(hook_entry(python_exe, hook_path))
    hooks["UserPromptSubmit"] = entries
    return settings


def remove_hook(settings: dict) -> dict:
    hooks = settings.get("hooks") or {}
    entries = hooks.get("UserPromptSubmit")
    if isinstance(entries, list):
        entries = [e for e in entries if not (isinstance(e, dict) and _is_diktat_entry(e))]
        if entries:
            hooks["UserPromptSubmit"] = entries
        else:
            hooks.pop("UserPromptSubmit", None)
    if not hooks:
        settings.pop("hooks", None)
    return settings


def _load_settings(path: Path) -> dict:
    if not path.is_file():
        return {}
    text = path.read_text(encoding="utf-8")
    if not text.strip():
        return {}
    return json.loads(text)   # neplatný JSON = radšej spadnúť než prepísať používateľove nastavenia


def _write_settings(path: Path, settings: dict, dry_run: bool) -> None:
    if dry_run:
        return
    if path.is_file():
        backup = path.with_name(f"settings.json.bak-{dt.datetime.now():%Y%m%d%H%M%S}")
        shutil.copy2(path, backup)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(settings, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


# --- orchestrácia -----------------------------------------------------------------------------------
def install(claude_dir: Path, with_hook: bool = True, python_exe: str | None = None,
            dry_run: bool = False, log=safe_print) -> None:
    claude_dir = Path(claude_dir)
    python_exe = python_exe or sys.executable
    tag = "[dry-run] " if dry_run else ""

    # 1. CLAUDE.md
    snippet = (HERE / "claude" / "CLAUDE.diktat.md").read_text(encoding="utf-8")
    claude_md = claude_dir / "CLAUDE.md"
    existing = claude_md.read_text(encoding="utf-8") if claude_md.is_file() else ""
    merged = merge_claude_md(existing, snippet)
    if merged != existing:
        if not dry_run:
            claude_md.parent.mkdir(parents=True, exist_ok=True)
            claude_md.write_text(merged, encoding="utf-8")
        log(f"{tag}✔ {claude_md}: blok 'Diktovaný vstup' {'obnovený' if BEGIN in existing else 'pridaný'}")
    else:
        log(f"{tag}= {claude_md}: už aktuálne")

    # 2. skill
    skill_src = HERE / "claude" / "skills" / "diktat"
    skill_dst = claude_dir / "skills" / "diktat"
    if not dry_run:
        skill_dst.mkdir(parents=True, exist_ok=True)
        shutil.copy2(skill_src / "SKILL.md", skill_dst / "SKILL.md")
    log(f"{tag}✔ {skill_dst}: skill /diktat")

    # 3. + 4. hook
    if with_hook:
        hook_dir = claude_dir / "hooks" / "diktat"
        if not dry_run:
            hook_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(HERE / "hook" / HOOK_FILE, hook_dir / HOOK_FILE)
            core_dst = hook_dir / "diktat_core"
            if core_dst.exists():
                shutil.rmtree(core_dst)
            shutil.copytree(HERE / "diktat_core", core_dst, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
            cfg_src = HERE / "config.json" if (HERE / "config.json").is_file() else HERE / "config.example.json"
            shutil.copy2(cfg_src, hook_dir / "config.json")
        log(f"{tag}✔ {hook_dir}: hook + diktat_core + config.json")

        settings_path = claude_dir / "settings.json"
        settings = _load_settings(settings_path)
        add_hook(settings, Path(python_exe).as_posix(), (hook_dir / HOOK_FILE).as_posix())
        _write_settings(settings_path, settings, dry_run)
        log(f"{tag}✔ {settings_path}: UserPromptSubmit hook zaregistrovaný ({Path(python_exe).as_posix()})")
    else:
        log(f"{tag}- hook preskočený (--no-hook)")

    log("\nHotovo. Platí pre všetky projekty a sessions Claude Code na tomto počítači "
        "(CLI, desktop app, VS Code). Nové sessions to načítajú automaticky; bežiacu session reštartuj.")


def uninstall(claude_dir: Path, dry_run: bool = False, log=safe_print) -> None:
    claude_dir = Path(claude_dir)
    tag = "[dry-run] " if dry_run else ""
    claude_md = claude_dir / "CLAUDE.md"
    if claude_md.is_file():
        existing = claude_md.read_text(encoding="utf-8")
        cleaned = remove_from_claude_md(existing)
        if cleaned != existing:
            if not dry_run:
                claude_md.write_text(cleaned, encoding="utf-8")
            log(f"{tag}✔ {claude_md}: blok odstránený")
    for sub in ("skills/diktat", "hooks/diktat"):
        path = claude_dir / sub
        if path.exists():
            if not dry_run:
                shutil.rmtree(path)
            log(f"{tag}✔ {path}: odstránené")
    settings_path = claude_dir / "settings.json"
    if settings_path.is_file():
        settings = _load_settings(settings_path)
        before = json.dumps(settings, sort_keys=True)
        remove_hook(settings)
        if json.dumps(settings, sort_keys=True) != before:
            _write_settings(settings_path, settings, dry_run)
            log(f"{tag}✔ {settings_path}: hook odregistrovaný")
    log("Hotovo.")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Nainštaluje diktat globálne do Claude Code (~/.claude).")
    ap.add_argument("--claude-dir", default=str(default_claude_dir()))
    ap.add_argument("--python", default=sys.executable, help="interpreter pre hook (default: tento)")
    ap.add_argument("--no-hook", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--uninstall", action="store_true")
    ap.add_argument("--autostart", action="store_true", help="Windows: skrytý beh s ikonou po prihlásení")
    ap.add_argument("--no-autostart", action="store_true", help="zruš autoštart")
    args = ap.parse_args(argv)
    app_path = HERE / "app.py"
    if args.autostart:
        if sys.platform != "win32":
            print("--autostart je zatiaľ len pre Windows (Startup priečinok).")
            return 1
        install_autostart(args.python, app_path, dry_run=args.dry_run)
        return 0
    if args.no_autostart:
        remove_autostart(app_path, dry_run=args.dry_run)
        return 0
    if args.uninstall:
        uninstall(Path(args.claude_dir), dry_run=args.dry_run)
        remove_autostart(app_path, dry_run=args.dry_run)
    else:
        install(Path(args.claude_dir), with_hook=not args.no_hook, python_exe=args.python, dry_run=args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())
