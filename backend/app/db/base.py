"""Declarative base class shared by all ORM models.

This module intentionally does NOT import the model modules themselves to avoid
circular imports (models import `Base` from here). Alembic's `env.py` and the
`app.models` package aggregate the model imports so that `Base.metadata`
contains all tables when needed (autogenerate, `create_all`, etc.).
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
