from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db

class UserModel(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # Roll number of the student
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="student", nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    def __init__(self, name: str = None, email: str = None, password: str = None, role: str = "student", id: int = None, **kwargs):
        super().__init__(**kwargs)
        if id is not None:
            self.id = id
        if name is not None:
            self.name = name
        if email is not None:
            self.email = email
        if role is not None:
            self.role = role
        if password:
            self.set_password(password)

    def set_password(self, password: str) -> None:
        """Hash and set the user's password."""
        self.password = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verify the user's password against the stored hash."""
        return check_password_hash(self.password, password)

    def to_dict(self) -> dict:
        """Serialize user model to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f"<User {self.id}: {self.email}>"


# Alias for flexibility
User = UserModel

