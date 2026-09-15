@echo off
rem Jednorazová inštalácia diktat na Windows: venv + závislosti + config + globálne nastavenie Claude Code.
cd /d "%~dp0"
if not exist .venv (
  python -m venv .venv || (echo Chyba: python -m venv zlyhal. Je Python 3.10+ v PATH? & exit /b 1)
)
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r requirements.txt || (echo Chyba pri instalacii zavislosti. & exit /b 1)
if not exist config.json copy config.example.json config.json >nul
python install.py
echo.
echo Hotovo. Spusti run_diktat.bat, klikni do okna Claude Code a stlac Ctrl+Alt+D.
pause
