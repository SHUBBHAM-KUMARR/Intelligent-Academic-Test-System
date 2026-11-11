from flask import Blueprint

home_bp = Blueprint("home", __name__)

@home_bp.route("/")
def home():
    return [{"message":"welcome to IATS"},{"description":"A source-grounded AI testing platform that transforms reference books, course notes, and question repositories into targeted academic assessments."}]