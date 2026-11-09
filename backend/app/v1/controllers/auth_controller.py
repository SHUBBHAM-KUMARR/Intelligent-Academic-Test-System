from datetime import datetime, timezone, timedelta
from flask import request, jsonify, current_app
from marshmallow import ValidationError
import jwt

from app.extensions import db
from app.models.user_model import UserModel
from app.schemas.user_schema import UserSchema
from app.schemas.admin_schema import AdminSchema

user_schema = UserSchema()
admin_schema = AdminSchema()


def generate_token(user, expires_in_days: int = 7) -> str:
    """Generate a JWT token for an authenticated user or admin."""
    secret_key = current_app.config.get("SECRET_KEY", "dev-secret-key-change-in-production-min32")
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": getattr(user, "role", "student"),
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=expires_in_days),
    }
    return jwt.encode(payload, secret_key, algorithm="HS256")


class AuthController:
    """Controller handling authentication operations (registration, login, profile)."""

    @staticmethod
    def register():
        """Register a new student/user."""
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Request body must be a valid JSON object"}), 400

        try:
            validated_data = user_schema.load(data)
        except ValidationError as err:
            return jsonify({"errors": err.messages}), 400

        email = validated_data["email"].strip().lower()

        try:
            # Check if email is already taken
            if UserModel.query.filter_by(email=email).first():
                return jsonify({"error": "A user with this email already exists"}), 409

            user = UserModel(
                name=validated_data["name"].strip(),
                email=email,
                password=validated_data["password"],
                role="student",
            )

            db.session.add(user)
            db.session.commit()

            token = generate_token(user)

            return jsonify({
                "message": "User registered successfully",
                "user": user_schema.dump(user),
                "token": token,
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Failed to register user", "details": str(e)}), 500

    @staticmethod
    def register_admin():
        """Register a new admin user."""
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Request body must be a valid JSON object"}), 400

        try:
            validated_data = admin_schema.load(data)
        except ValidationError as err:
            return jsonify({"errors": err.messages}), 400

        email = validated_data["email"].strip().lower()

        try:
            # Check if email is already taken
            if UserModel.query.filter_by(email=email).first():
                return jsonify({"error": "An admin with this email already exists"}), 409

            admin = UserModel(
                name=validated_data["name"].strip(),
                email=email,
                password=validated_data["password"],
                role=validated_data.get("role", "admin"),
            )

            db.session.add(admin)
            db.session.commit()

            token = generate_token(admin)

            return jsonify({
                "message": "Admin registered successfully",
                "admin": admin_schema.dump(admin),
                "token": token,
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Failed to register admin", "details": str(e)}), 500

    @staticmethod
    def login():
        """Authenticate user or admin and return JWT token."""
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Request body must be a valid JSON object"}), 400

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Both 'email' and 'password' are required"}), 400

        email = email.strip().lower()

        try:
            user = UserModel.query.filter_by(email=email).first()

            if not user or not user.check_password(password):
                return jsonify({"error": "Invalid email or password"}), 401

            token = generate_token(user)

            return jsonify({
                "message": "Login successful",
                "token": token,
                "user": user.to_dict(),
            }), 200

        except Exception as e:
            return jsonify({"error": "Login failed", "details": str(e)}), 500

    @staticmethod
    def profile():
        """Get the profile of the currently authenticated user."""
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token required"}), 401

        token = auth_header.split(" ")[1].strip()
        secret_key = current_app.config.get("SECRET_KEY", "dev-secret-key-change-in-production-min32")

        try:
            payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        try:
            user = db.session.get(UserModel, int(payload["sub"]))
            if not user:
                return jsonify({"error": "User not found"}), 404

            return jsonify({
                "user": user.to_dict()
            }), 200

        except Exception as e:
            return jsonify({"error": "Failed to fetch user profile", "details": str(e)}), 500


# Module-level aliases for direct imports
register = AuthController.register
register_admin = AuthController.register_admin
login = AuthController.login
profile = AuthController.profile
