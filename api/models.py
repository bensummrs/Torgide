from pydantic import BaseModel
from typing import Optional


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
