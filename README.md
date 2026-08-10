# ADR Nord-Vest – Formular & Clasament

Clone funcțional al portalului ADR Nord-Vest, cu:

- pagină de start similară cu [form.regionordvest.ro](https://form.regionordvest.ro/)
- formular de aplicare funcțional
- încărcare documente PDF simulată (validare format/dimensiune)
- nume utilizator salvat în `localStorage` + SQLite
- clasament după timpul de completare a formularului

## Pornire

```bash
npm install
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000).

## Structură

- `/` – landing
- `/aplica` – formular
- `/top` – clasament
- `data/app.sqlite` – baza SQLite (creat automat)
