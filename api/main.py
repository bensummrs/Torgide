from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
import os
from dotenv import load_dotenv
import pygeohash as gh

load_dotenv()
from azure.cosmos import CosmosClient, PartitionKey

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

COSMOS_URI = os.environ["COSMOS_URI"]
COSMOS_KEY = os.environ["COSMOS_KEY"]
COSMOS_DB_NAME = os.environ.get("COSMOS_DB_NAME", "torgide")
CONTAINER_NAME = "pins"

client = CosmosClient(COSMOS_URI, credential=COSMOS_KEY)
database = client.create_database_if_not_exists(id=COSMOS_DB_NAME)
container = database.create_container_if_not_exists(
    id=CONTAINER_NAME,
    partition_key=PartitionKey(path="/geohash"),
)


class PinCreate(BaseModel):
    name: str
    type: str  # "view_spot" | "cool_spot"
    notes: Optional[str] = None
    latitude: float
    longitude: float
    videos: list[str] = []


class Pin(PinCreate):
    id: str
    geohash: str


@app.get("/")
def root():
    return {"message": "Hello from Torgide API"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/pins", response_model=List[Pin])
def get_pins():
    items = list(container.query_items(
        query="SELECT * FROM c",
        enable_cross_partition_query=True,
    ))
    return [Pin(**item) for item in items]


@app.post("/pins", response_model=Pin)
def create_pin(pin: PinCreate):
    geohash = gh.encode(pin.latitude, pin.longitude, precision=6)
    new_pin = Pin(id=str(uuid.uuid4()), geohash=geohash, **pin.model_dump())
    container.create_item(body=new_pin.model_dump())
    return new_pin


@app.delete("/pins/{pin_id}")
def delete_pin(pin_id: str):
    items = list(container.query_items(
        query="SELECT * FROM c WHERE c.id = @id",
        parameters=[{"name": "@id", "value": pin_id}],
        enable_cross_partition_query=True,
    ))
    if not items:
        raise HTTPException(status_code=404, detail="Pin not found")
    container.delete_item(item=pin_id, partition_key=items[0]["geohash"])
    return {"deleted": pin_id}
