from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import pins, places

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://torgide.com",
        "https://www.torgide.com",
        "http://localhost:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pins.router)
app.include_router(places.router)


@app.get("/")
def root():
    return {"message": "Hello from Torgide API"}


@app.get("/health")
def health():
    return {"status": "ok"}
