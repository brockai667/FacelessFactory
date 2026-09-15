@echo off
rem Aktualizuje diktat (git pull + zavislosti) a znova ho spusti skryto s ikonou v liste.
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
taskkill /f /fi "WINDOWTITLE eq diktat" >nul 2>&1
if exist diktat_tray.vbs (
  wscript diktat_tray.vbs
  echo Hotovo - diktat bezi pri hodinach.
) else (
  echo Hotovo. Spusti run_diktat.bat alebo install.py --autostart.
)
timeout /t 3 >nul
