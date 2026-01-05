from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, logger
from ..utils.email import send_notification_email

router = APIRouter(
    prefix="/licenses",
    tags=["licenses"]
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[schemas.LicenseResponse])
def read_licenses(skip: int = 0, limit: int = 100, show_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.License)
    if not show_deleted:
        query = query.filter(models.License.is_deleted == False)
        
    licenses = query.offset(skip).limit(limit).all()
    return licenses

@router.post("/", response_model=schemas.LicenseResponse)
def create_license(license: schemas.LicenseCreate, username: str = "SYSTEM", db: Session = Depends(get_db)):
    # Note: Added 'username' param. Frontend should send it or extract from token. 
    # For now ensuring backward compatibility if needed, or assuming updated call.
    
    import time
    db_license = models.License(
        **license.dict(), 
        id=license.rut,
        upload_date=int(time.time()),
        uploaded_by=username
    ) 
    # Check if exists (and not deleted? OR if deleted, restore it?)
    existing = db.query(models.License).filter(models.License.rut == license.rut).first()
    if existing:
        if existing.is_deleted:
             # Logic to revive? Or error. Let's error and tell user it's in trash.
             raise HTTPException(status_code=400, detail="License exists in Trash. Restore it instead.")
        raise HTTPException(status_code=400, detail="License with this RUT already exists")
    
    db.add(db_license)
    db.commit()
    db.refresh(db_license)
    
    logger.log_action(db, username=username, action="CREATE_LICENSE", details=f"RUT: {license.rut}")
    
    return db_license

@router.put("/{license_id}", response_model=schemas.LicenseResponse)
def update_license(license_id: str, license: schemas.LicenseCreate, username: str = "SYSTEM", db: Session = Depends(get_db)):
    db_license = db.query(models.License).filter(models.License.id == license_id).first()
    if not db_license:
        raise HTTPException(status_code=404, detail="License not found")
    
    for key, value in license.dict().items():
        setattr(db_license, key, value)
        
    # Check for Status Change to TRIGGER NOTIFICATION
    old_status = db_license.process_status
    new_status = license.process_status
    
    if new_status == models.ProcessStatus.READY_FOR_PICKUP and old_status != models.ProcessStatus.READY_FOR_PICKUP:
        if db_license.email:
            send_notification_email(
                db_license.email, 
                "Su Licencia está Lista - LicenciaManager", 
                f"Estimado/a {db_license.full_name},\n\nSu licencia de conducir (RUT: {db_license.rut}) ya se encuentra LISTA PARA ENTREGA en nuestras oficinas.\n\nPor favor acérquese a retirar.\n\nAtte,\nDepartamento de Tránsito"
            )
        else:
            logger.log_action(db, username=username, action="NOTIFICATION_FAILED", details=f"No email for RUT: {license_id}")

    db.commit()
    db.refresh(db_license)
    
    logger.log_action(db, username=username, action="UPDATE_LICENSE", details=f"Updated RUT: {license_id}")

    return db_license

@router.delete("/{license_id}")
def delete_license(license_id: str, username: str = "SYSTEM", db: Session = Depends(get_db)):
    db_license = db.query(models.License).filter(models.License.id == license_id).first()
    if not db_license:
        raise HTTPException(status_code=404, detail="License not found")
        
    # Soft Delete
    db_license.is_deleted = True
    db.commit()
    
    logger.log_action(db, username=username, action="DELETE_LICENSE", details=f"Soft deleted RUT: {license_id}")
    
    return {"message": "License moved to trash (Soft Delete)"}

@router.post("/{license_id}/restore")
def restore_license(license_id: str, username: str = "SYSTEM", db: Session = Depends(get_db)):
    db_license = db.query(models.License).filter(models.License.id == license_id).first()
    if not db_license:
        raise HTTPException(status_code=404, detail="License not found")
        
    db_license.is_deleted = False
    db.commit()
    
    logger.log_action(db, username=username, action="RESTORE_LICENSE", details=f"Restored RUT: {license_id}")

    return {"message": "License restored successfully"}
