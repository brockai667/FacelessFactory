# -*- coding: utf-8 -*-
"""Cela fabrika jednym prikazom -> out/<slug>.mp4 (+ _qc.jpg + .txt s popisom a kreditom hudby).
  python engine/factory.py                 -> dalsi overeny scenar z factory/queue (vizualnu reziu doplni automat)
  python engine/factory.py --groq ["tema"] -> scenar napise bezplatny LLM (Groq); oznaci sa "groq" = pred zverejnenim skontrolovat
  --snap                                   -> len kontrolne snimky, bez renderu
Po uspesnom renderi: scenar z fronty ide do factory/done, volby do factory/history.json (dalsie video bude vyzerat inak)."""
import json
import os
import shutil
import subprocess
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")   # Windows: presmerovany vystup je cp1250
    except Exception:
        pass

HERE = os.path.dirname(os.path.abspath(__file__))
FACTORY = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import writer  # noqa: E402
import compose  # noqa: E402


def main():
    argv = sys.argv[1:]
    args = [a for i, a in enumerate(argv) if not a.startswith("--") and not (i and argv[i - 1] == "--out")]
    got = None if "--groq" in sys.argv else writer.from_queue()
    if got is None:
        if "--groq" not in sys.argv:
            raise SystemExit("Fronta factory/queue je prazdna. Doplnit scenare (Claude) alebo spustit s --groq.")
        got = writer.build_spec(args[0] if args else writer.next_topic())
    path, S, d = got
    C = compose.Composer(json.load(open(path, encoding="utf-8")))
    ep, script = C.compose()
    ep_dir = os.path.join(FACTORY, "episodes", S["slug"])
    os.makedirs(ep_dir, exist_ok=True)
    json.dump(ep, open(os.path.join(ep_dir, "episode.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(os.path.join(ep_dir, "script.js"), "w", encoding="utf-8").write(script)
    print(f"[compose] {S['slug']}: {len(S['beats'])} beatov, varovania: {C.warn or 'ziadne'}")
    if "--snap" in sys.argv:
        subprocess.run([sys.executable, os.path.join(HERE, "snap.py"), ep_dir, "1,4,8,12,16,20,24,28"])
        return
    r = subprocess.run([sys.executable, os.path.join(HERE, "build.py"), ep_dir, "--render"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    print((r.stdout or "")[-900:] or (r.stderr or "")[-900:])
    if r.returncode == 0 and "FINAL" in (r.stdout or "") and "zvuk OK" in (r.stdout or ""):
        writer.remember(S, d)
        if "--out" in sys.argv:                       # odovzdanie publikacii (FacelessFactory/output: mp4 + txt + jpg)
            dst = os.path.abspath(sys.argv[sys.argv.index("--out") + 1])
            os.makedirs(dst, exist_ok=True)
            for ext in (".mp4", ".txt", ".jpg"):
                src = os.path.join(FACTORY, "out", S["slug"] + ext)
                if os.path.exists(src):
                    shutil.copy(src, os.path.join(dst, "paper-" + S["slug"] + ext))
            print("[odovzdane]", os.path.join(dst, f"paper-{S['slug']}.mp4"))
        if S.get("queue_file"):
            os.makedirs(os.path.join(writer.FDIR, "done"), exist_ok=True)
            shutil.move(os.path.join(writer.FDIR, "queue", S["queue_file"]), os.path.join(writer.FDIR, "done", S["queue_file"]))
        if S.get("source") == "groq":
            print("POZOR: scenar od bezplatneho modelu - pred zverejnenim skontrolovat fakty.")
    else:
        print("CHYBA: render alebo kontrola zvuku zlyhala, scenar ostava vo fronte.")
        sys.exit(1)


if __name__ == "__main__":
    main()
