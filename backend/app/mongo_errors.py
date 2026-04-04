from flask import jsonify
from pymongo.errors import OperationFailure, PyMongoError


def json_for_mongo_error(exc: BaseException):
    if isinstance(exc, OperationFailure):
        code = getattr(exc, "code", None)
        text = str(exc).lower()
        if code == 18:
            return (
                jsonify(
                    {
                        "error": "MongoDB authentication failed (wrong username or password in MONGO_URI). In Atlas: Database Access → select your user → Edit password → update backend/.env. If the password contains @ : / ? # encode them (e.g. @ → %40).",
                        "code": "MONGODB_AUTH_FAILED",
                    }
                ),
                503,
            )
        if code == 8000 or "bad auth" in text or "authentication failed" in text:
            return (
                jsonify(
                    {
                        "error": "MongoDB Atlas rejected your database user or password. Fix: Atlas → Database Access → confirm USERNAME in the URI matches exactly → reset password → put the new password in MONGO_URI in backend/.env (URL-encode special characters).",
                        "code": "MONGODB_BAD_AUTH",
                    }
                ),
                503,
            )
    if isinstance(exc, PyMongoError):
        return (
            jsonify(
                {
                    "error": "Cannot reach MongoDB. Check MONGO_URI, Atlas Network Access (allow your IP or 0.0.0.0/0 for testing), and run: pip install dnspython",
                    "code": "MONGODB_UNREACHABLE",
                    "detail": str(exc),
                }
            ),
            503,
        )
    return jsonify({"error": "Unexpected database error", "detail": str(exc)}), 500
