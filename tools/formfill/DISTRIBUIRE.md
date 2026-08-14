# Ce dai utilizatorilor — fără instalare

## Windows (recomandat)
Dai **doar** `FormFill.exe` (un fișier).

Cum obții `.exe`-ul:
1. Push pe GitHub → Actions → **Build FormFill** → descarci artifactul `FormFill-Windows`
2. Sau pe un PC Windows cu Python: `build-windows.bat` → iei `dist\FormFill.exe`

Utilizatorul: dublu-click → Run anyway (SmartScreen) → gata.
Nu e nevoie de Python.

Opțional pe stick: pune un fișier gol `portable.txt` lângă `.exe`
ca setările să se salveze pe stick, nu în AppData.

## macOS
`./make-mac-app.sh` → `FormFill.app` pe Desktop  
sau artifactul `FormFill-macOS` din GitHub Actions.
