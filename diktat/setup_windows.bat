@echo off
rem Jednorazová inštalácia diktat na Windows: venv + závislosti + config + globálne nastavenie Claude Code.
cd /d "%~dp0"
if not exist .venv (
  python -m venv .venv || (echo Chyba: python -m venv zlyhal. Je Python 3.10+ v PATH? & exit /b 1)
)
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r requirements.txt || (echo Chyba pri instalacii zavislosti. & exit /b 1)
rem NVIDIA karta? Potom aj CUDA kniznice - prepis je s nimi 5-10x rychlejsi (jednorazovo ~700 MB).
where nvidia-smi >nul 2>&1
if %errorlevel%==0 (
  echo Nasiel som NVIDIA grafiku - instalujem CUDA kniznice pre rychly prepis...
  python -m pip install -q -r requirements-gpu.txt || echo Varovanie: CUDA kniznice sa nepodarilo nainstalovat, prepis pobezi na procesore.
) else (
  echo NVIDIA grafika sa nenasla - prepis pobezi na procesore ^(minuta reci cca 15-40 s^).
)
if not exist config.json copy config.example.json config.json >nul
python install.py
echo.
echo Hotovo. Skratku nastavis cez: .venv\Scripts\python.exe install.py --hotkey "F9"
echo Potom spusti run_diktat.bat, klikni do okna Claude Code a stlac svoju skratku.
rem Cakaj na klavesu len pri dvojkliku. Ked skript spusta Claude z terminalu, pause by ho zasekol.
echo %cmdcmdline% | find /i "%~nx0" >nul && pause
exit /b 0
