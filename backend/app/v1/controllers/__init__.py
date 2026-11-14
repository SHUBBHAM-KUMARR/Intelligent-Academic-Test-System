from app.v1.controllers.auth_controller import (
    AuthController,
    register,
    register_admin,
    login,
    profile,
)
from app.v1.controllers.test_controller import TestController
from app.v1.controllers.source_controller import SourceController

__all__ = [
    "AuthController",
    "register",
    "register_admin",
    "login",
    "profile",
    "TestController",
    "SourceController",
]
