"""
Run from backend folder: python scripts/check_mongo.py
Uses MONGO_URI from .env (does not print your password).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

uri = os.getenv("MONGO_URI", "")
if not uri or "cluster" not in uri and "localhost" not in uri:
    print("MONGO_URI missing or empty in backend/.env")
    sys.exit(1)

from urllib.parse import urlparse

parsed = urlparse(uri)
user_host = parsed.netloc.split("@")[-1] if "@" in parsed.netloc else parsed.netloc
path = (parsed.path or "/").strip("/") or "(default)"
print("Host:", user_host)
print("Database name in URI path:", path)
print("Testing ping...")

from pymongo import MongoClient
from pymongo.errors import OperationFailure, PyMongoError

try:
    client = MongoClient(uri, serverSelectionTimeoutMS=15000, connectTimeoutMS=15000)
    client.admin.command("ping")
    print("OK: Connected and authenticated.")
    client.close()
except OperationFailure as e:
    print("FAIL: MongoDB authentication error.")
    print("  Atlas: Database Access - your user must match the username in MONGO_URI.")
    print("  Use Edit Password, then paste the new password into .env.")
    print("  URL-encode in the URI: @ -> %40, : -> %3A, / -> %2F, # -> %23, ? -> %3F")
    print("  Error:", e)
    sys.exit(2)
except PyMongoError as e:
    print("FAIL: Could not reach cluster (network, IP allowlist, or DNS).")
    print("  Atlas: Network Access - add your IP or 0.0.0.0/0 (dev only).")
    print("  pip install dnspython")
    print("  Error:", e)
    sys.exit(3)
