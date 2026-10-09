"""Database connection and session management with optional SQLAlchemy support."""

import os
from pathlib import Path

DEFAULT_DB_DIR = Path(__file__).resolve().parent.parent / "data"
DEFAULT_DB_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_DB_PATH = DEFAULT_DB_DIR / "solpulse_ml.db"

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH.as_posix()}")

try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker, Session
    from .models import Base, HAS_SQLALCHEMY

    connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def init_db():
        if HAS_SQLALCHEMY:
            Base.metadata.create_all(bind=engine)

    def get_db():
        db: Session = SessionLocal()
        try:
            yield db
        finally:
            db.close()

except ImportError:
    engine = None
    SessionLocal = None

    def init_db():
        from .db_manager import DBManager
        DBManager().init_db()

    def get_db():
        from .db_manager import DBManager
        yield DBManager()
