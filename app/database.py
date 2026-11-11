import sqlite3
from contextlib import contextmanager
from .config import DATABASE_PATH

@contextmanager
def connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def init_db():
    with connection() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)

def recent_messages(limit=12):
    with connection() as db:
        rows = db.execute(
            "SELECT role, content FROM messages ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [dict(row) for row in reversed(rows)]

def save_message(role, content):
    with connection() as db:
        db.execute("INSERT INTO messages(role, content) VALUES (?, ?)", (role, content))

def clear_messages():
    with connection() as db:
        db.execute("DELETE FROM messages")
