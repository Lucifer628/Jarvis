import os

APP_NAME = "JARVIS-X"
# Prefer environment variables. These fallback placeholders mean no .env file is required.
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "PASTE_GROQ_API_KEY_HERE")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GNEWS_API_KEY = os.getenv("GNEWS_API_KEY", "")
DATABASE_PATH = os.getenv("JARVIS_DB_PATH", "jarvis_memory.db")
MAX_MESSAGE_CHARS = 6000
