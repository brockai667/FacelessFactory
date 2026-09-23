@echo off
rem Najde, kde Claude drzi nazvy chatov. Pouzitie: najdi_nazvy.bat "Rozvrh sync workflow"
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
set PY=python
if exist .venv\Scripts\python.exe set PY=.venv\Scripts\python.exe
if "%~1"=="" (
  set /p NAZOV="Napis presny nazov chatu zo zoznamu: "
) else (
  set NAZOV=%~1
)
%PY% app.py --find-title "%NAZOV%"
echo.
pause
