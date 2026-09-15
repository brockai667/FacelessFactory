@echo off
rem Aktualizuje diktat (git pull + zavislosti), ukonci beziaci daemon a spusti ho znova skryto s ikonou v liste.
rem Skript sa najprv skopiruje do %TEMP% a bezi odtial - git pull by ho inak prepisal pocas behu.
if /i not "%~1"=="--from-temp" (
  copy /y "%~f0" "%TEMP%\diktat_update.bat" >nul
  start "diktat update" cmd /c ""%TEMP%\diktat_update.bat" --from-temp "%~dp0.""
  exit /b 0
)
cd /d "%~2"
set PYTHONIOENCODING=utf-8
if not exist logs mkdir logs
echo Aktualizujem diktat v %CD% ...
git pull
if not exist .venv\Scripts\python.exe (
  echo Chyba: chyba .venv - spusti najprv setup_windows.bat
  pause
  exit /b 1
)
echo [1/4] Zavislosti...
.venv\Scripts\python.exe -m pip install -q -r requirements.txt
echo [2/4] CUDA kniznice pre GPU (prvykrat ~700 MB, potom uz nic) - pockaj, moze to trvat par minut...
.venv\Scripts\python.exe -m pip install -r requirements-gpu.txt | findstr /i /c:"Downloading" /c:"Successfully" /c:"already satisfied" /c:"ERROR"
rem ukonci beziaci daemon (PID si zapisuje do logs\diktat.pid) + stary rezidentny strazca (watch.py)
if exist logs\diktat.pid (
  for /f %%p in (logs\diktat.pid) do taskkill /f /pid %%p >nul 2>&1
  del logs\diktat.pid >nul 2>&1
)
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*diktat*app.py*' -or $_.CommandLine -like '*diktat*watch.py*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
timeout /t 2 >nul
echo [3/4] Planovac uloh (diktat-watch)...
.venv\Scripts\python.exe install.py --autostart
echo [4/4] Spustam diktat...
if not exist diktat_tray.vbs (
  echo Chyba: chyba diktat_tray.vbs - spusti install.py --autostart
  pause
  exit /b 1
)
wscript diktat_tray.vbs
rem pockaj, kym sa novy beh ohlasi PID suborom (max ~25 s); ak nie, skus este raz
set /a tries=0
:waitloop
timeout /t 1 >nul
if exist logs\diktat.pid goto started
set /a tries+=1
if %tries% lss 25 goto waitloop
echo Diktat sa neohlasil, skusam este raz...
wscript diktat_tray.vbs
timeout /t 10 >nul
if exist logs\diktat.pid goto started
echo CHYBA: diktat nenastartoval. Pozri logs\diktat.log a posli ho Claudovi.
pause
exit /b 1
:started
echo Hotovo - diktat bezi (modra ikona = nacitava model, siva = pripraveny).
timeout /t 5 >nul
