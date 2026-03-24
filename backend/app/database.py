from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

client = None
db = None

async def init_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client.get_database() # Uses db name from URI, e.g., 'visicare'
    
    # Create unique indexes
    await db.users.create_index("email", unique=True)
    await db.patients.create_index("access_code", unique=True)

async def close_db():
    global client
    if client:
        client.close()

async def get_db():
    global db
    if db is None:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client.get_database()
    yield db
