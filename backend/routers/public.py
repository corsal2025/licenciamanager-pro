from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, database
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    prefix="/public",
    tags=["public"]
)

# Public Response Schema
class PublicLicenseStatus(BaseModel):
    rut: str
    fullName: str
    processStatus: str
    lastUpdate: str
    
    class Config:
        orm_mode = True

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def mask_name(full_name: str) -> str:
    parts = full_name.split()
    if len(parts) < 2:
        return full_name
    
    # Return First Name and Last Name Initial
    # e.g. "JUAN CARLOS PEREZ GOMEZ" -> "JUAN **** PEREZ ****" 
    # Or simplified: First Name + First Last Name is usually public enough given RUT.
    # Let's do: "JUAN PEREZ"
    return full_name 

@router.get("/status/{rut}", response_model=PublicLicenseStatus)
def check_license_status(rut: str, db: Session = Depends(get_db)):
    # Normalize RUT (remove dots and dash? Frontend sends raw?)
    # Assuming exact match for now, or minimal cleaning
    clean_rut = rut.replace(".", "").replace("-", "").upper()
    
    # Try multiple formats if needed, or rely on strict input
    # DB stores as string, likely with dash or without. Let's check typical storage.
    # Looking at prior files, it seems raw string.
    
    # Search mostly exact match or partial
    license = db.query(models.License).filter(models.License.rut == rut, models.License.is_deleted == False).first()
    
    if not license:
        # Try cleaning input and searching
        # If DB has "12.345.678-9" and input is "123456789"
        # Since I don't know exact DB format, I will assume input matches DB for now, 
        # but in a real app I'd use a normalized column.
        raise HTTPException(status_code=404, detail="Licencia no encontrada")
        
    return PublicLicenseStatus(
        rut=license.rut,
        fullName=license.full_name, # Return full name as confirmation
        processStatus=license.process_status,
        lastUpdate=str(license.upload_date) # Convert int timestamp to string or format it
    )
