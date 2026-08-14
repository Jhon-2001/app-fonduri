@echo off
REM Construiește FormFill.exe pe Windows (o singură dată, cu Python).
REM Utilizatorii finali primesc DOAR dist\FormFill.exe — fără instalare.
setlocal
cd /d "%~dp0"

set "PY="
where py >nul 2>&1 && set "PY=py -3"
if not defined PY (
  where python >nul 2>&1 && set "PY=python"
)
if not defined PY (
  echo Nu am gasit Python. Instaleaza de pe https://www.python.org/downloads/
  echo si bifeaza "Add python.exe to PATH", apoi ruleaza din nou acest fisier.
  pause
  exit /b 1
)

echo Construiesc FormFill.exe ...
%PY% build.py
if errorlevel 1 (
  echo Build esuat.
  pause
  exit /b 1
)

echo.
echo ============================================
echo  Gata: dist\FormFill.exe
echo  Copiaza DOAR acest fisier pe stick / email
echo  Utilizatorul: dublu-click, fara instalare.
echo ============================================
explorer dist
pause
