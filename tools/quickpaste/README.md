# QuickPaste

Aplicație care ține texte predefinite și le lipește instant în orice formular,
pe orice site sau aplicație, prin combinații de taste pe care **ți le alegi
singur**. Rulează pe macOS și pe Windows.

## Varianta portabilă (recomandată)

`build.py` produce un executabil de sine stătător, care **nu are nevoie de Python
pe calculatorul pe care îl copiezi**:

```bash
python3 build.py
```

- pe macOS obții `dist/QuickPaste.app` (~30 MB)
- pe Windows obții `dist/QuickPaste.exe` (un singur fișier)

Copiază rezultatul pe stick, în Applications, pe Desktop, pe alt calculator —
funcționează oriunde, atâta timp cât sistemul e același.

Un executabil nu poate fi construit pentru alt sistem decât cel pe care rulezi.
Ca să ai și varianta de Windows, rulează o dată `build.py` pe o mașină Windows
care are Python 3.10+ instalat; fișierul `.exe` rezultat se poate apoi copia pe
orice Windows, inclusiv pe unele fără Python.

### Textele, mutate odată cu aplicația

Implicit, `snippets.json` stă în folderul de date al sistemului
(`~/Library/Application Support/QuickPaste` pe macOS, `%APPDATA%\QuickPaste` pe
Windows), ca să supraviețuiască actualizărilor.

Dacă vrei totul pe un stick, creează un fișier gol numit `portable.txt` lângă
executabil. Aplicația va salva atunci textele acolo și le vei purta cu ea.

## Varianta fără build

Dacă ai Python 3.10+ pe calculator, poți rula direct din sursă:

- **macOS**: dublu-click pe `run-mac.command`
- **Windows**: dublu-click pe `run-windows.bat`

Prima pornire durează ~30 de secunde: își creează singură mediul și instalează
dependența (`pynput`). Pe macOS, versiunea preinstalată de Python (3.9) nu e
suficientă — instalează una nouă cu `brew install python`, iar scriptul o va găsi
automat.

## Permisiune pe macOS

macOS nu lasă nicio aplicație să citească tastatura global fără acord explicit.
Dacă vezi bara galbenă în aplicație, apasă **Cere permisiunea**, acceptă dialogul
sistemului, apoi repornește QuickPaste. Bara dispare singură când permisiunea e
activă.

Permisiunea se acordă aplicației care pornește codul. Cu executabilul vei vedea
în listă chiar **QuickPaste**; dacă pornești cu `run-mac.command`, apare
**Terminal** — bifează-l pe acela. Lista din **Privacy & Security →
Accessibility** conține doar aplicațiile care au cerut deja acces, de aceea pare
goală înainte de prima cerere.

Permisiunea se acordă din nou pe fiecare calculator pe care muți aplicația. Pe
Windows nu e nevoie de nimic.

## Cum se folosește

1. Selectează un slot din listă (sau apasă **+ Slot** pentru unul nou).
2. Scrie textul în caseta din dreapta — se salvează automat.
3. Apasă **Înregistrează** și apoi combinația dorită, de exemplu `Command + 1`.
   Ai 10 secunde, iar `Esc` anulează.
4. Comută pe site, dă click în câmp și apasă combinația: textul apare acolo.

Sloturile implicite sunt legate la `⌘⇧1 … ⌘⇧6` pe macOS și `Ctrl+Alt+1 … 6` pe
Windows, dar poți schimba orice combinație și poți adăuga oricâte sloturi vrei.

Poți seta și `Command + 1` simplu. Ține minte că browserele folosesc deja acea
combinație pentru schimbarea tabului, iar aplicația nu poate bloca acel
comportament — de aceea combinațiile implicite includ și Shift.

## Opțiuni

- **Lipire `paste`** (implicit): textul trece prin clipboard și e lipit cu
  `Cmd/Ctrl+V`. Instantaneu, indiferent de lungime. Clipboardul tău anterior se
  restaurează după ~1,5 secunde.
- **Lipire `type`**: textul e tastat caracter cu caracter. Mai lent, dar merge în
  câmpurile care blochează lipirea.
- **Tab automat după lipire**: sare singur la câmpul următor, util când
  completezi câmpuri consecutive cu sloturi consecutive.
- **Testează (3s)**: îți dă 3 secunde să dai click în câmpul țintă, apoi trimite
  textul — util ca să verifici fără să înregistrezi o combinație.

Dacă alegi o combinație deja folosită de alt slot, aplicația te avertizează în loc
să o suprascrie.

## Variantă web, fără instalare

`web/index.html` generează un bookmarklet: scrii textele, alegi combinația și
tragi butonul albastru în bara de favorite. Pe orice site dai click pe favorit o
dată, apoi combinația + cifră scrie textul în câmpul focusat. Emite evenimentele
`input`/`change`, deci merge și cu formulare React sau Vue.

Limitări față de aplicație: trebuie reactivat după fiecare reîncărcare a paginii,
nu merge în `iframe`-uri de pe alt domeniu și funcționează doar în browser. În
schimb, nu cere absolut nimic instalat.

## Fișiere

```
quickpaste.py       aplicația (interfață + hotkeys globale)
build.py            produce executabilul de sine stătător
requirements.txt    pynput
run-mac.command     rulare din sursă pe macOS
run-windows.bat     rulare din sursă pe Windows
web/index.html      generatorul de bookmarklet pentru varianta din browser
```
