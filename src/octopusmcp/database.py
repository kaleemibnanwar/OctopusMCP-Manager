from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from .models import Installation


class Database:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.migrate()

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        try:
            yield connection
            connection.commit()
        finally:
            connection.close()

    def migrate(self) -> None:
        with self.connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS installations (
                    id TEXT PRIMARY KEY,
                    document TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    package_id TEXT,
                    kind TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                """
            )

    def save(self, installation: Installation) -> None:
        with self.connect() as connection:
            connection.execute(
                "INSERT INTO installations(id, document) VALUES(?, ?) "
                "ON CONFLICT(id) DO UPDATE SET document=excluded.document",
                (installation.id, installation.model_dump_json()),
            )

    def get(self, package_id: str) -> Installation | None:
        with self.connect() as connection:
            row = connection.execute(
                "SELECT document FROM installations WHERE id = ?", (package_id,)
            ).fetchone()
        return Installation.model_validate_json(row["document"]) if row else None

    def list(self) -> list[Installation]:
        with self.connect() as connection:
            rows = connection.execute("SELECT document FROM installations ORDER BY id").fetchall()
        return [Installation.model_validate_json(row["document"]) for row in rows]

    def delete(self, package_id: str) -> None:
        with self.connect() as connection:
            connection.execute("DELETE FROM installations WHERE id = ?", (package_id,))

    def event(self, package_id: str | None, kind: str, message: str) -> None:
        with self.connect() as connection:
            connection.execute(
                "INSERT INTO events(package_id, kind, message) VALUES (?, ?, ?)",
                (package_id, kind, message),
            )

    def events(self, limit: int = 20) -> list[dict[str, str]]:
        with self.connect() as connection:
            rows = connection.execute(
                "SELECT package_id, kind, message, created_at FROM events "
                "ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [dict(row) for row in rows]
