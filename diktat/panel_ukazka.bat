@echo off
rem Panel session: ukazka zap/vyp + kontrola. Staci dvojklik, vyber cislo.
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
set PY=python
if exist .venv\Scripts\python.exe set PY=.venv\Scripts\python.exe
if not "%~1"=="" (
  %PY% app.py --panel-demo %1
  pause
  exit /b 0
)
echo.
echo   1 = zapni ukazkove session (nech vidis, ako panel vyzera)
echo   2 = zmaz ukazkove session
echo   3 = kontrola panela (co panel prave vidi)
echo.
choice /c 123 /n /m "Vyber (1/2/3): "
if errorlevel 3 goto check
if errorlevel 2 goto off
%PY% app.py --panel-demo on
goto end
:off
%PY% app.py --panel-demo off
goto end
:check
%PY% app.py --panel-check
:end
echo.
pause
