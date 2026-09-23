@echo off
rem Ukazkove session v paneli (nech vidis, ako panel vyzera). Zmazanie: panel_ukazka.bat off
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
if exist .venv\Scripts\python.exe (
  .venv\Scripts\python.exe app.py --panel-demo %1
) else (
  python app.py --panel-demo %1
)
pause
