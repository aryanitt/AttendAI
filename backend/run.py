import os
from dotenv import load_dotenv

load_dotenv()

from app import create_app

app = create_app()

if __name__ == "__main__":
    from app.config import Config
    print(f"DEBUG: Starting app with MONGO_URI: {Config.MONGO_URI.split('@')[-1] if '@' in Config.MONGO_URI else Config.MONGO_URI}")
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
