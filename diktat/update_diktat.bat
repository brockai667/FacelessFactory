@echo off
rem Aktualizuje diktat (git pull + zavislosti), ukonci beziaci daemon a spusti ho znova skryto s ikonou v liste.
rem Skript sa najprv skopiruje do %TEMP% a bezi odtial - git pull by ho inak prepisal pocas behu.
rem Kazdy krok sa zapisuje do logs\update.log.
if /i not "%~1"=="--from-temp" (
  if not exist "%~dp0logs" mkdir "%~dp0logs"
  echo === %date% %time% start [%~f0] >> "%~dp0logs\update.log"
  copy /y "%~f0" "%TEMP%\diktat_update.bat" >nul
  start "diktat update" cmd /c ""%TEMP%\diktat_update.bat" --from-temp "%~dp0.""
  exit /b 0
)
cd /d "%~2"
set PYTHONIOENCODING=utf-8
if not exist logs mkdir logs
set LOG=logs\update.log
echo === %date% %time% from-temp, cwd=%CD% >> %LOG%
echo Aktualizujem diktat v %CD% ...
echo [1/5] git pull
git pull >> %LOG% 2>&1
echo    git kod: %errorlevel% >> %LOG%
if not exist .venv\Scripts\python.exe (
  echo Chyba: chyba .venv - spusti najprv setup_windows.bat
  echo CHYBA: chyba .venv >> %LOG%
  pause
  exit /b 1
)
echo [2/5] Zavislosti (moze chvilu trvat)...
.venv\Scripts\python.exe -m pip install -q -r requirements.txt >> %LOG% 2>&1
echo    pip kod: %errorlevel% >> %LOG%
echo [3/5] CUDA kniznice pre GPU (prvykrat ~700 MB)...
.venv\Scripts\python.exe -m pip install -q -r requirements-gpu.txt >> %LOG% 2>&1
echo    pip-gpu kod: %errorlevel% >> %LOG%
echo [4/5] Ukoncujem stary beh...
if exist logs\diktat.pid (
  for /f %%p in (logs\diktat.pid) do taskkill /f /pid %%p >> %LOG% 2>&1
  del logs\diktat.pid >nul 2>&1
)
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*diktat*app.py*' -or $_.CommandLine -like '*diktat*watch.py*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >> %LOG% 2>&1
timeout /t 2 >nul
echo [5/5] Nastavenie Claude (CLAUDE.md, skill, hook), Planovac uloh + start...
.venv\Scripts\python.exe install.py >> %LOG% 2>&1
.venv\Scripts\python.exe install.py --autostart >> %LOG% 2>&1
echo    install kod: %errorlevel% >> %LOG%
if not exist diktat_tray.vbs (
  echo Chyba: chyba diktat_tray.vbs - pozri logs\update.log
  echo CHYBA: chyba diktat_tray.vbs >> %LOG%
  pause
  exit /b 1
)
wscript diktat_tray.vbs
echo    wscript diktat_tray.vbs spustene >> %LOG%
set /a tries=0
:waitloop
timeout /t 1 >nul
if exist logs\diktat.pid goto started
set /a tries+=1
if %tries% lss 25 goto waitloop
echo Diktat sa neohlasil, skusam este raz...
echo    druhy pokus >> %LOG%
wscript diktat_tray.vbs
timeout /t 10 >nul
if exist logs\diktat.pid goto started
echo CHYBA: diktat nenastartoval. Pozri logs\update.log a logs\diktat.log a posli ich Claudovi.
echo CHYBA: diktat nenastartoval >> %LOG%
pause
exit /b 1
:started
echo    OK, diktat bezi (pid subor existuje) >> %LOG%
echo Hotovo - diktat bezi (modra ikona = nacitava model, siva = pripraveny).
timeout /t 5 >nul
