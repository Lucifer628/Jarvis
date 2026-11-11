# JARVIS-X 2.0

A personal AI assistant with a futuristic JARVIS-inspired interface. The project contains:
- FastAPI backend
- Responsive web app / installable PWA
- SQLite chat history and opt-in local conversation context
- Groq-compatible chat API
- Calculator, web search, weather, and news endpoints
- Capacitor Android wrapper configuration and GitHub Actions APK build workflow

> The Android wrapper loads your deployed web app. Deploy the backend/web app first, then set the public URL in `capacitor.config.ts`.

## 1. Project layout

```text
JARVIS-X-2.0/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── services.py
│   └── static/
│       ├── index.html
│       ├── styles.css
│       ├── app.js
│       ├── manifest.webmanifest
│       └── icons/
├── requirements.txt
├── Procfile
├── runtime.txt
├── capacitor.config.ts
├── package.json
├── .github/workflows/android-apk.yml
└── .gitignore
```

## 2. Run on Termux (Android)

Install Python and Git in Termux:

```bash
pkg update && pkg upgrade
pkg install python git
```

Extract the ZIP, enter the project folder, then:

```bash
python -m pip install -r requirements.txt
```

Set your Groq key for this terminal session:

```bash
export GROQ_API_KEY="YOUR_GROQ_API_KEY"
```

Start the app:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open `http://127.0.0.1:8000` in your phone browser.

No `.env` file is required. For a persistent key, set it in your shell startup file, but do not share screenshots or commits containing the key.

## 3. Configure the AI provider

Get an API key from Groq's official developer console. Set `GROQ_API_KEY` as an environment variable.

Defaults are in `app/config.py`:
- API base: `https://api.groq.com/openai/v1`
- Model: `openai/gpt-oss-120b`

If the model is unavailable in your account, change `GROQ_MODEL` to a currently available chat model in your Groq console.

The key stays on the backend. Never put it in `app/static/app.js`.

## 4. Deploy the web app

A simple option is Render:
1. Push this folder to a private GitHub repository.
2. Create a new Web Service on Render and connect the repository.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable `GROQ_API_KEY`.
6. Deploy and test the generated HTTPS URL.

SQLite is suitable for a prototype. For a public production deployment, use persistent storage or migrate to PostgreSQL; ephemeral hosting filesystems may reset.

## 5. Install as a web app (PWA)

Open the deployed HTTPS URL in Chrome. Use the browser menu → **Install app** or **Add to Home screen**.

## 6. Build an Android APK with GitHub Actions

This repository includes `.github/workflows/android-apk.yml`.
1. Set `JARVIS_WEB_URL` as a GitHub Actions repository variable (your deployed HTTPS URL).
2. Push the project to GitHub.
3. Open **Actions** → **Build JARVIS-X Android APK** → **Run workflow**.
4. Download the `JARVIS-X-debug-apk` artifact when the workflow finishes.

The APK is a WebView-style shell around the deployed web app, so an internet connection is required. It is a debug APK, not a Play Store release.

## 7. Safety and privacy notes

- Do not add shell-command execution, arbitrary Python execution, or unrestricted device access to the assistant.
- Do not store passwords, API keys, payment details, or sensitive personal information in chat memory.
- Conversation context is stored in local SQLite on the server. Use **Clear history** to delete it.
- The web search endpoint returns public search snippets; verify important claims from primary sources.
- Weather uses Open-Meteo geocoding and forecast services. News uses GNews when an API key is configured.

## 8. Current prototype limitations

- No voice input/output.
- No account system or multi-user isolation. Keep the first deployment private.
- No autonomous actions on the phone.
- Search/news/weather depend on external services and network availability.
