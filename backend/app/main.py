import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import models
from .config import settings
from .database import Base, SessionLocal, engine
from .routers import admin, applications, auth, challenges, pilots, profiles
from .seed import seed_admin, seed_templates
from .seed_demo import seed_demo_data

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(challenges.router)
app.include_router(applications.router)
app.include_router(pilots.router)
app.include_router(admin.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_admin(db)
        seed_templates(db)
        seed_demo_data(db)
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": settings.app_name}


@app.get("/")
def root():
    return {"message": "StartSetu API — see /docs for the interactive API reference."}
