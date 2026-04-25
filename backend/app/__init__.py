import os

from flask import Flask
from flask_cors import CORS

from .config import Config
from .db import close_db, init_indexes


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    os.makedirs(app.config["UPLOAD_ROOT"], exist_ok=True)
    os.makedirs(app.config["EMBEDDING_ROOT"], exist_ok=True)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    app.teardown_appcontext(close_db)

    from .routes.auth import bp as auth_bp
    from .routes.dashboard import bp as dashboard_bp
    from .routes.classes import bp as classes_bp
    from .routes.students import bp as students_bp
    from .routes.attendance import bp as attendance_bp
    from .routes.reports import bp as reports_bp
    from .routes.admin import bp as admin_bp
    from .routes.analytics import bp as analytics_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(classes_bp, url_prefix="/api/classes")
    app.register_blueprint(students_bp, url_prefix="/api")
    app.register_blueprint(attendance_bp, url_prefix="/api")
    app.register_blueprint(reports_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(analytics_bp, url_prefix="/api")

    with app.app_context():
        try:
            init_indexes(app)
        except Exception:
            pass

        # Pre-load the DeepFace model so the first request is fast
        try:
            from .face_service import warmup
            warmup()
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning(
                f"Face model warmup failed (will retry on first request): {exc}"
            )

    @app.get("/api/health")
    def health():
        return {"ok": True}

    @app.get("/api/health/db")
    def health_db():
        from pymongo import MongoClient
        from pymongo.errors import PyMongoError

        from .mongo_errors import json_for_mongo_error

        uri = app.config["MONGO_URI"]
        try:
            client = MongoClient(
                uri, serverSelectionTimeoutMS=8000, connectTimeoutMS=8000
            )
            client.admin.command("ping")
            client.close()
        except PyMongoError as e:
            body, status = json_for_mongo_error(e)
            return body, status
        return {"ok": True, "mongodb": "connected"}

    return app
