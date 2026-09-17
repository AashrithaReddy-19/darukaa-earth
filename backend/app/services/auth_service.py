import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenResponse


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)

    def register(self, *, full_name: str, email: str, password: str) -> User:
        if self.users.get_by_email(email) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
            )
        hashed_password = hash_password(password)
        return self.users.create(full_name=full_name, email=email, hashed_password=hashed_password)

    def authenticate(self, *, email: str, password: str) -> User:
        invalid = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
        user = self.users.get_by_email(email)
        if user is None or not verify_password(password, user.hashed_password):
            raise invalid
        if not user.is_active:
            raise invalid
        return user

    def issue_tokens(self, user: User) -> TokenResponse:
        access_token = create_access_token(str(user.id))
        refresh_token = create_refresh_token(str(user.id))
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    def refresh(self, refresh_token: str) -> TokenResponse:
        invalid = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
        try:
            payload = decode_token(refresh_token)
        except ValueError as exc:
            raise invalid from exc

        if payload.get("type") != "refresh":
            raise invalid

        subject = payload.get("sub")
        if not subject:
            raise invalid

        try:
            user_id = uuid.UUID(subject)
        except ValueError as exc:
            raise invalid from exc

        user = self.users.get_by_id(user_id)
        if user is None or not user.is_active:
            raise invalid

        return self.issue_tokens(user)
