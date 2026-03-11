import httpx
from fastapi import APIRouter, Query


router = APIRouter(prefix="/places", tags=["places"])


@router.get("/search")
async def search_places(q: str = Query(..., min_length=1)):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://photon.komoot.io/api/",
            params={"q": q, "limit": 10},
            timeout=8,
            headers={"User-Agent": "Torgide/1.0"},
        )
        res.raise_for_status()
        data = res.json()

    places = []
    for f in data.get("features", []):
        p = f["properties"]
        coords = f["geometry"]["coordinates"]
        label = ", ".join(filter(None, [p.get("name"), p.get("city") or p.get("town") or p.get("village"), p.get("country")]))
        places.append({
            "id": str(p.get("osm_id", "")),
            "name": label or p.get("name", "Unknown"),
            "lat": coords[1],
            "lon": coords[0],
            "category": p.get("type") or p.get("osm_type") or "place",
        })
    return places
