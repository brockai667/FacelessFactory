@echo off
rem Zozbiera stav diktatu (uloha Planovaca, subory, logy) do logs\diagnostika.txt a do schranky.
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
if exist .venv\Scripts\python.exe (
  .venv\Scripts\python.exe app.py --diag
) else (
  python app.py --diag
)
echo.
echo Skopirovane do schranky - vloz do Claude cez Ctrl+V. (Aj v logs\diagnostika.txt)
pause
