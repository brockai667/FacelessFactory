@echo off
rem Aktualizuje diktat (git pull + zavislosti), ukonci beziaci daemon a spusti ho znova skryto s ikonou v liste.
cd /d "%~dp0"
echo Aktualizujem diktat...
git pull
if exist .venv\Scripts\python.exe (
  .venv\Scripts\python.exe -m pip install -q -r requirements.txt
) else (
  echo Chyba: chyba .venv - spusti najprv setup_windows.bat
  pause
  exit /b 1
)
rem ukonci beziaci daemon (PID si zapisuje do logs\diktat.pid)
if exist logs\diktat.pid (
  for /f %%p in (logs\diktat.pid) do taskkill /f /pid %%p >nul 2>&1
  del logs\diktat.pid >nul 2>&1
)
rem pre istotu aj podla prikazoveho riadku (stare verzie bez PID suboru)
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*diktat*app.py*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
timeout /t 1 >nul
if exist diktat_tray.vbs (
  wscript diktat_tray.vbs
  echo Hotovo - diktat startuje pri hodinach (pol minuty nacitava model).
) else (
  echo Hotovo. Spusti run_diktat.bat alebo install.py --autostart.
)
timeout /t 4 >nul
