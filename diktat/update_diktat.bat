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
if not exist .venv\Scripts\python.exe (
  echo Chyba: chyba .venv - spusti najprv setup_windows.bat
  pause
  exit /b 1
)
.venv\Scripts\python.exe -m pip install -q -r requirements.txt
rem GPU (NVIDIA): CUDA kniznice cez pip - jednorazovo ~700 MB, potom rychly prepis; bez NVIDIA sa nepouziju
.venv\Scripts\python.exe -m pip install -q -r requirements-gpu.txt
rem ukonci beziaci daemon (PID si zapisuje do logs\diktat.pid) + stary rezidentny strazca (watch.py)
if exist logs\diktat.pid (
  for /f %%p in (logs\diktat.pid) do taskkill /f /pid %%p >nul 2>&1
  del logs\diktat.pid >nul 2>&1
)
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*diktat*app.py*' -or $_.CommandLine -like '*diktat*watch.py*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
timeout /t 2 >nul
rem strazca = uloha Planovaca (raz za minutu, ziadny proces na pozadi); vytvor/obnov ju
.venv\Scripts\python.exe install.py --autostart >nul 2>&1
rem a diktat spusti hned (ak by to nevyslo, uloha ho spusti do minuty)
if exist diktat_tray.vbs (
  wscript diktat_tray.vbs
  echo Hotovo - diktat startuje pri hodinach (pol minuty nacitava model).
) else (
  echo Hotovo. Spusti run_diktat.bat alebo install.py --autostart.
)
timeout /t 4 >nul
