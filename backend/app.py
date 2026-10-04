import os
import re
import uuid
from datetime import datetime, timezone

from flask import Flask, jsonify, request

app = Flask(__name__)

PORT = int(os.getenv("PORT", "5000"))

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$")

submissions = []


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


def extract_payload():
    data = request.get_json(silent=True)

    if data is None:
        data = request.form.to_dict()

    return data or {}


def validate(payload):
    name = str(payload.get("name", "")).strip()
    email = str(payload.get("email", "")).strip()
    course = str(payload.get("course", "")).strip()

    errors = {}

    if not name:
        errors["name"] = "Name is required."
    elif len(name) < 2:
        errors["name"] = "Name must be at least 2 characters long."

    if not email:
        errors["email"] = "Email is required."
    elif not EMAIL_PATTERN.match(email):
        errors["email"] = "Please enter a valid email address."

    if not course:
        errors["course"] = "Course is required."

    return {"name": name, "email": email, "course": course}, errors


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "flask-backend",
        "submissions": len(submissions)
    })


@app.route("/submissions", methods=["GET"])
def list_submissions():
    return jsonify({
        "count": len(submissions),
        "submissions": submissions
    })


@app.route("/submissions", methods=["POST"])
def create_submission():
    record, errors = validate(extract_payload())

    if errors:
        return jsonify({
            "status": "failed",
            "message": "Please correct the highlighted fields.",
            "errors": errors
        }), 400

    record["id"] = str(uuid.uuid4())
    record["domain"] = email_domain(record["email"])
    record["submittedAt"] = datetime.now(timezone.utc).isoformat()
    record["processedBy"] = "flask-backend"

    submissions.append(record)

    return jsonify({
        "status": "success",
        "message": f"Hello {record['name']}! Your details were processed successfully.",
        "record": record
    }), 201


@app.route("/process", methods=["POST"])
def process():
    return create_submission()


def email_domain(email):
    return email.split("@")[-1].lower()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)