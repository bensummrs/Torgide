import os
from azure.cosmos import CosmosClient, PartitionKey
from dotenv import load_dotenv

load_dotenv()

COSMOS_URI = os.environ.get("COSMOS_URI")
COSMOS_KEY = os.environ.get("COSMOS_KEY")
COSMOS_DB_NAME = os.environ.get("COSMOS_DB_NAME", "torgide")
CONTAINER_NAME = "pins"

container = None
if COSMOS_URI and COSMOS_KEY:
    _client = CosmosClient(COSMOS_URI, credential=COSMOS_KEY)
    _database = _client.create_database_if_not_exists(id=COSMOS_DB_NAME)
    container = _database.create_container_if_not_exists(
        id=CONTAINER_NAME,
        partition_key=PartitionKey(path="/geohash"),
    )
else:
    print("WARNING: COSMOS_URI/COSMOS_KEY not set — pin endpoints disabled")
