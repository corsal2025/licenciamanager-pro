from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import database, models, schemas

router = APIRouter(
    prefix="/logs",
    tags=["logs"]
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# We need a schema for Log Response if not exists
# It's cleaner to define it here or in schemas.py. 
# For speed, I'll use a dynamic pydantic model or check schemas.py. 
# Let's assume we don't have one and return generic dict/list for now, or use ORM mode.

@router.get("/", response_model=List[dict])
def read_logs(
    skip: int = 0, 
    limit: int = 100, 
    entity_id: str = None, # Optional filter
    db: Session = Depends(get_db)
):
    query = db.query(models.AuditLog)
    
    if entity_id:
        query = query.filter(models.AuditLog.entity_id == entity_id)
        
    logs = query.order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs
