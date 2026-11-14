from flask import Blueprint
from app.v1.controllers.source_controller import SourceController

source_bp = Blueprint("source", __name__, url_prefix="/api/v1/source")


@source_bp.route("/upload", methods=["POST"])
def upload():
    """Ingest and index reference material for deterministic grounding."""
    return SourceController.upload()
