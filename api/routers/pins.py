import uuid
from fastapi import APIRouter, HTTPException
from typing import List
import pygeohash as gh

from models import Pin, PinCreate
from database import container

router = APIRouter(prefix="/pins", tags=["pins"])


@router.get("", response_model=List[Pin])
def get_pins():
    if container is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    items = list(container.query_items(
        query="SELECT * FROM c",
        enable_cross_partition_query=True,
    ))
    return [Pin(**item) for item in items]


@router.post("", response_model=Pin)
def create_pin(pin: PinCreate):
    if container is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    geohash = gh.encode(pin.latitude, pin.longitude, precision=6)
    new_pin = Pin(id=str(uuid.uuid4()), geohash=geohash, **pin.model_dump())
    container.create_item(body=new_pin.model_dump())
    return new_pin


@router.delete("/{pin_id}")
def delete_pin(pin_id: str):
    if container is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    items = list(container.query_items(
        query="SELECT * FROM c WHERE c.id = @id",
        parameters=[{"name": "@id", "value": pin_id}],
        enable_cross_partition_query=True,
    ))
    if not items:
        raise HTTPException(status_code=404, detail="Pin not found")
    container.delete_item(item=pin_id, partition_key=items[0]["geohash"])
    return {"deleted": pin_id}
