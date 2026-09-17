import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.dependencies.db import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or not credentials.credentials:
        raise credentials_exception

    try:
        payload = decode_token(credentials.credentials)
    except ValueError as exc:
        raise credentials_exception from exc

    if payload.get("type") != "access":
        raise credentials_exception

    subject = payload.get("sub")
    if not subject:
        raise credentials_exception

    try:
        user_id = uuid.UUID(subject)
    except ValueError as exc:
        raise credentials_exception from exc

    user = UserRepository(db).get_by_id(user_id)
    if user is None or not user.is_active:
        raise credentials_exception

    return user
