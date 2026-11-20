from flask import Blueprint, jsonify
from app.v1.controllers.auth_controller import (
    AuthController,
    register as register_controller,
    register_admin as register_admin_controller,
    login as login_controller,
    profile as profile_controller,
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new student/user."""
    return register_controller()


@auth_bp.route("/register/admin", methods=["POST"])
@auth_bp.route("/admin/register", methods=["POST"])
def register_admin():
    """Register a new admin user."""
    return register_admin_controller()


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate a student or admin."""
    return login_controller()


@auth_bp.route("/profile", methods=["GET"])
@auth_bp.route("/me", methods=["GET"])
def profile():
    """Fetch the profile of the current authenticated user."""
    return profile_controller()


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Logout endpoint acknowledging client-side token invalidation."""
    return jsonify({"message": "Successfully logged out"}), 200
