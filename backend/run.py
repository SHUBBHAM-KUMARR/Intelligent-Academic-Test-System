import os
import sys
from pathlib import Path

# Ensure backend directory is in Python path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import create_app
from app.extensions import db

app = create_app()

# Auto-create database tables on startup if reachable
with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        app.logger.warning(f"Could not auto-create database tables on startup: {e}")

if __name__ == "__main__":
    host = os.getenv("FLASK_RUN_HOST", os.getenv("HOST", "0.0.0.0"))
    port = int(os.getenv("FLASK_RUN_PORT", os.getenv("PORT", 5000)))
    debug = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "t")

    print(f"🚀 Starting IATS Backend Server at http://127.0.0.1:{port} (host={host}, debug={debug})")
    app.run(
        host=host,
        port=port,
        debug=debug,
    )

