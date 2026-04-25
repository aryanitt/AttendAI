from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "smart_attendance_db")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(MONGODB_URI)
    db.db = db.client[DB_NAME]
    print("Connected to MongoDB Atlas!")

async def close_mongo_connection():
    db.client.close()
    print("Closed MongoDB connection.")
