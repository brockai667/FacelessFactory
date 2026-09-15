@echo off
rem Spustí diktat daemon (globálna skratka: numpad ,/Del, viď config.json).
cd /d "%~dp0"
if exist .venv\Scripts\activate.bat call .venv\Scripts\activate.bat
python app.py %*
