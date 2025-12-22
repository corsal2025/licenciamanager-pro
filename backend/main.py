from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import licenses, auth

# Create database tables (simple approach for now, Alembic is better for prod)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Licencia Manager Pro API",
    description="Backend API for Licencia Manager Pro system",
    version="1.0.0"
)

# CORS Configuration - Allow Frontend access
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(licenses.router)

from .routers import drive, logs, purchases, ai, appointments
app.include_router(drive.router)
app.include_router(logs.router)
app.include_router(purchases.router)
app.include_router(ai.router)
app.include_router(appointments.router)

from .routers import public
app.include_router(public.router)

@app.get("/")
def read_root():
    return {"message": "Licencia Manager Pro API is running"}
