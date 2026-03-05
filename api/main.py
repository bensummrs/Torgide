from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Hello from Pebl API"}


@app.get("/health")
def health():
    return {"status": "ok"}
