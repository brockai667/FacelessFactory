@echo off
rem Aktualizuje diktat (git pull + zavislosti), ukonci beziaci daemon a spusti ho znova skryto s ikonou v liste.
rem Skript sa najprv skopiruje do %TEMP% a bezi odtial - git pull by ho inak prepisal pocas behu.
if /i not "%~1"=="--from-temp" (
  copy /y "%~f0" "%TEMP%\diktat_update.bat" >nul
  start "diktat update" cmd /c ""%TEMP%\diktat_update.bat" --from-temp "%~dp0.""
  exit /b 0
)
cd /d "%~2"
echo Aktualizujem diktat v %CD% ...
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
timeout /t 2 >nul
rem prvy raz po pridani strazcu: prepni autostart na strazcu (diktat_watch.vbs)
if not exist diktat_watch.vbs .venv\Scripts\python.exe install.py --autostart >nul 2>&1
if exist diktat_watch.vbs (
  powershell -NoProfile -Command "if (-not (Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*diktat*watch.py*' })) { Start-Process wscript.exe -ArgumentList 'diktat_watch.vbs' }" >nul 2>&1
)
if exist diktat_tray.vbs (
  wscript diktat_tray.vbs
  echo Hotovo - diktat startuje pri hodinach (pol minuty nacitava model).
) else (
  echo Hotovo. Spusti run_diktat.bat alebo install.py --autostart.
)
timeout /t 4 >nul
