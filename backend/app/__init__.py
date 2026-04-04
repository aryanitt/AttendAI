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
        resources={r"/*": {"origins": "*"}},
        supports_credentials=True
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
            from .face_service import warmup_models
            warmup_models()
        except Exception as e:
            print(f"[INDEX ERROR/WARMUP ERROR] {e}")
            pass

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

    @app.errorhandler(Exception)
    def handle_exception(e):
        print(f"[FATAL ERROR] {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}, 500

    return app
