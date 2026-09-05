# MediKiosk — local setup guide

A patient-facing kiosk prototype (Hindi / English / Urdu, with real
voice-to-text) that you can run on your own laptop.

---

## 1. Install Node.js (skip if you already have it)

You need **Node.js version 18 or newer**.

1. Go to https://nodejs.org
2. Download the **LTS** version for your operating system (Windows / macOS / Linux) and run the installer, clicking "Next" through the defaults.
3. Confirm it installed correctly — open a terminal (Command Prompt / PowerShell on Windows, Terminal on Mac) and run:
   ```
   node -v
   npm -v
   ```
   Both should print a version number (e.g. `v20.11.0` and `10.2.4`). If you get "command not found", restart your terminal, or your computer, and try again.

## 2. Unzip the project

Unzip `medikiosk-app.zip` anywhere you like (e.g. Desktop). You'll get a folder called `medikiosk-app` containing files like `package.json`, `src/App.jsx`, etc.

## 3. Open a terminal inside the project folder

- **Windows:** open the `medikiosk-app` folder in File Explorer, click the address bar, type `cmd`, press Enter.
- **Mac:** right-click the `medikiosk-app` folder → "New Terminal at Folder" (or open Terminal and type `cd ` then drag the folder in, then press Enter).

## 4. Install dependencies

Run:
```
npm install
```
This downloads React, Tailwind, and the icon library the app uses. It only needs to be done once (takes 30 seconds to a couple of minutes depending on your internet).

## 5. Run it

```
npm run dev
```
You'll see output like:
```
  VITE v5.x.x  ready in 400 ms
  ➜  Local:   http://localhost:5173/
```
It should also auto-open in your browser. If not, open **http://localhost:5173** in **Google Chrome** (important — see note below).

You now have the kiosk running locally. Changes you make to the code will hot-reload instantly while `npm run dev` is running.

To stop the server, click the terminal and press `Ctrl + C`.

---

## Using the voice feature

The mic button uses your browser's built-in **Web Speech API** — there's no
API key or backend needed for the demo. To make it work:

1. **Use Google Chrome or Microsoft Edge.** Firefox and Safari don't support
   this API yet — the app will show a grey "mic unavailable" message instead
   of blocking, but voice input will only work in Chrome/Edge.
2. When you press the mic button for the first time, your browser will ask
   for **microphone permission** — click **Allow**.
3. `http://localhost` is treated as a secure origin by Chrome, so the mic
   works even without HTTPS — no extra setup needed.
4. Speak your answer; you'll see the live transcript appear, and once you
   pause, it's added to the conversation automatically.
5. Hindi and English recognition are quite reliable. Urdu speech recognition
   support varies by OS/browser and may be less accurate — this is a
   limitation of the browser's built-in engine, not the app.

## Language support

- **Hindi and English** — fully translated, every screen.
- **Urdu** — fully translated **and** right-to-left layout, so the whole
  kiosk mirrors correctly (menus, chat bubbles, buttons, icons).

## Project structure

```
medikiosk-app/
├── index.html          the page shell
├── package.json         dependencies & scripts
├── vite.config.js        dev server config
├── tailwind.config.js    styling config
├── postcss.config.js
└── src/
    ├── main.jsx          mounts the app
    ├── App.jsx           the entire kiosk (all screens + logic)
    └── index.css         Tailwind imports
```

Everything the kiosk does lives in `src/App.jsx` — language packs, the
conversation script, the voice logic, and every screen.

## Common issues

- **`npm install` fails / times out** — check your internet connection.
  If you're on a college/office network with a proxy or firewall, you may
  need to run this on a personal network, or ask IT for npm registry access.
- **Port 5173 already in use** — close whatever else is running on that
  port, or just re-run `npm run dev`; Vite will automatically offer the
  next free port (e.g. 5174).
- **Mic button greyed out** — you're likely not on Chrome/Edge, or you
  denied the microphone permission. Check the padlock/site-settings icon
  in the browser address bar to re-allow it.
- **Blank white page** — open the browser's DevTools (F12) → Console tab,
  and check for a red error; most often this means `npm install` didn't
  finish successfully — try deleting the `node_modules` folder and
  running `npm install` again.

## Building for deployment (optional)

When you're ready to host this somewhere instead of just running it
locally:
```
npm run build
```
This creates a `dist/` folder with static files you can upload to any
static host (Netlify, Vercel, GitHub Pages, or a hospital's own server).
