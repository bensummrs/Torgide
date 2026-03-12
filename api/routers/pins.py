import uuid
from fastapi import APIRouter, HTTPException, Query
from typing import List
import pygeohash as gh

from models import Pin, PinCreate
from database import container

router = APIRouter(prefix="/pins", tags=["pins"])

@router.get("/nearby", response_model=List[Pin])
def get_pins_nearby(lat: float = Query(...), lng: float = Query(...), precision: int = Query(6)):
    """Fetch pins near a location using geohash partition keys (no cross-partition scan)."""
    if container is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    center_hash = gh.encode(lat, lng, precision=precision)
    clat, clng, lat_err, lng_err = gh.decode_exactly(center_hash)
    step_lat, step_lng = lat_err * 2, lng_err * 2
    offsets = [
        (0, 0), (step_lat, 0), (-step_lat, 0),
        (0, step_lng), (0, -step_lng),
        (step_lat, step_lng), (step_lat, -step_lng),
        (-step_lat, step_lng), (-step_lat, -step_lng),
    ]
    cells = list({gh.encode(clat + dlat, clng + dlng, precision=precision) for dlat, dlng in offsets})
    results = []
    for cell in cells:
        items = container.query_items(
            query="SELECT * FROM c WHERE c.geohash = @gh",
            parameters=[{"name": "@gh", "value": cell}],
            partition_key=cell,
        )
        results.extend([Pin(**item) for item in items])
    return results


@router.get("/bbox", response_model=List[Pin])
def get_pins_bbox(
    min_lat: float = Query(...), max_lat: float = Query(...),
    min_lng: float = Query(...), max_lng: float = Query(...),
):
    """Fetch pins within a bounding box (viewport)."""
    if container is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    items = list(container.query_items(
        query=(
            "SELECT * FROM c WHERE c.latitude >= @min_lat AND c.latitude <= @max_lat"
            " AND c.longitude >= @min_lng AND c.longitude <= @max_lng"
        ),
        parameters=[
            {"name": "@min_lat", "value": min_lat},
            {"name": "@max_lat", "value": max_lat},
            {"name": "@min_lng", "value": min_lng},
            {"name": "@max_lng", "value": max_lng},
        ],
        enable_cross_partition_query=True,
    ))
    return [Pin(**item) for item in items]


@router.get("/popular", response_model=List[Pin])
def get_popular_pins():
    """Return all pins as popular spots (temporary — no ranking yet)."""
    if container is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    items = list(container.query_items(
        query="SELECT * FROM c",
        enable_cross_partition_query=True,
    ))
    return [Pin(**item) for item in items]


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
