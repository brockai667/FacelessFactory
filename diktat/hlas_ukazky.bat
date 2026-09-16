@echo off
rem Ukazky hlasov (kazdy sa predstavi), vyber cislom - ulozi sa do config.json (hlas.voice).
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
if exist .venv\Scripts\python.exe (
  .venv\Scripts\python.exe -m pip install -q edge-tts mcp
  .venv\Scripts\python.exe hlas\ukazky.py %*
) else (
  python hlas\ukazky.py %*
)
pause
