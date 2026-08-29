import os
import secrets
from datetime import timedelta

import bcrypt

SESSION_COOKIE_NAME = "session_token"
SESSION_TTL = timedelta(days=30)
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def generate_token() -> str:
    return secrets.token_urlsafe(32)
