from pydantic import BaseModel
from typing import Optional, Literal


class Transport(BaseModel):
    best: Literal["walk", "bus", "drive"]
    walk_mins: Optional[int] = None    # walk time from bus stop / car park to the pin
    bus_stop: Optional[str] = None     # e.g. "Bus 42 – High Street stop"
    car_park: Optional[str] = None     # e.g. "Elm St car park (200 m away)"
    notes: Optional[str] = None        # e.g. "Drive to car park, then 10 min walk"


class PinCreate(BaseModel):
    name: str
    type: str  # "view_spot" | "cool_spot"
    notes: Optional[str] = None
    latitude: float
    longitude: float
    videos: list[str] = []
    transport: Optional[Transport] = None
    sun: Optional[Literal["sunrise", "sunset", "both"]] = None


class Pin(PinCreate):
    id: str
    geohash: str
