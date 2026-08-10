@echo off
REM Dublu-click pe acest fisier porneste QuickPaste pe Windows.
setlocal
cd /d "%~dp0"

if exist ".venv\Scripts\pythonw.exe" goto :run

set "PY="
where py >nul 2>&1 && set "PY=py -3"
if not defined PY (
  where python >nul 2>&1 && set "PY=python"
)
if not defined PY (
  echo Nu am gasit Python. Instaleaza-l de pe https://www.python.org/downloads/
  echo si bifeaza "Add python.exe to PATH".
  pause
  exit /b 1
)

echo Pregatesc mediul Python ^(o singura data^)...
%PY% -m venv .venv || goto :error
".venv\Scripts\python.exe" -m pip install --upgrade pip >nul
".venv\Scripts\python.exe" -m pip install -r requirements.txt || goto :error

:run
start "" ".venv\Scripts\pythonw.exe" quickpaste.py
exit /b 0

:error
echo.
echo Nu am putut pregati mediul. Verifica versiunea de Python (minim 3.10).
pause
exit /b 1
