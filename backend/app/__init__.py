from flask import Flask
from app.config import Config
from app.extensions import cors, db, ma


def create_app(config_class=Config):

    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config_class)

    # Initialize extensions
    cors.init_app(
        app,
        resources={
            r"/.*": {
                "origins": app.config.get(
                    "CORS_ORIGINS",
                    ["http://localhost:5173", "http://127.0.0.1:5173"],
                ),
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
            }
        },
        supports_credentials=True,
    )
    db.init_app(app)
    ma.init_app(app)

    # Register routes
    from app.v1.routes import home_bp, auth_bp

    app.register_blueprint(home_bp)
    app.register_blueprint(auth_bp)

    return app
