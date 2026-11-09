from flask import Flask
from app.config import Config
from app.extensions import db, ma

def create_app(config_class=Config):

    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    ma.init_app(app)

    # Register routes
    from app.v1.routes import home_bp, auth_bp

    app.register_blueprint(home_bp)
    app.register_blueprint(auth_bp)

    return app
