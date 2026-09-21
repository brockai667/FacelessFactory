@echo off
rem Ukazky hlasov: spyta sa na engine (Microsoft / Google / ElevenLabs) a pripadne na API kluc,
rem kazdy hlas sa predstavi, vyber cislom - ulozi sa do config.json (sekcia hlas).
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
if exist .venv\Scripts\python.exe (
  .venv\Scripts\python.exe -m pip install -q edge-tts mcp
  .venv\Scripts\python.exe hlas\ukazky.py %*
) else (
  python hlas\ukazky.py %*
)
pause
