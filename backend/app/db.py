from urllib.parse import urlparse

from flask import current_app, g
from pymongo import MongoClient


def _db_name_from_uri(uri: str) -> str:
    path = (urlparse(uri).path or "/").strip("/")
    return path or "smart_attendance_db"


def get_client():
    if "mongo_client" not in g:
        g.mongo_client = MongoClient(
            current_app.config["MONGO_URI"],
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
        )
    return g.mongo_client


def get_db():
    uri = current_app.config["MONGO_URI"]
    name = _db_name_from_uri(uri)
    return get_client()[name]


def close_db(_e=None):
    client = g.pop("mongo_client", None)
    if client is not None:
        client.close()


def init_indexes(app):
    uri = app.config["MONGO_URI"]
    db = MongoClient(uri)[_db_name_from_uri(uri)]
    db.teachers.create_index("email", unique=True)
    db.classes.create_index([("teacher_id", 1), ("class_name", 1)])
    db.students.create_index([("class_id", 1), ("roll_number", 1)], unique=True)
    db.attendance.create_index(
        [("class_id", 1), ("student_id", 1), ("date", 1)], unique=True
    )
