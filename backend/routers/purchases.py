from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import database, models, schemas, logger
import uuid
import time

router = APIRouter(
    prefix="/purchases",
    tags=["Purchases"]
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[schemas.PurchaseResponse])
def read_purchases(skip: int = 0, limit: int = 100, show_deleted: bool = False, db: Session = Depends(get_db)):
    """
    Get all purchases. By default hides deleted items.
    Admin can request show_deleted=True (logic to be refined with roles later).
    """
    query = db.query(models.Purchase)
    
    if not show_deleted:
        query = query.filter(models.Purchase.is_deleted == False)
        
    purchases = query.order_by(models.Purchase.request_date.desc()).offset(skip).limit(limit).all()
    return purchases

@router.post("/", response_model=schemas.PurchaseResponse)
def create_purchase(purchase: schemas.PurchaseCreate, username: str, db: Session = Depends(get_db)):
    # Note: username usually comes from current_user dependency, passing as scalar for now
    new_id = str(uuid.uuid4())
    new_purchase = models.Purchase(
        id=new_id,
        item=purchase.item,
        description=purchase.description,
        amount=purchase.amount,
        requested_by=username 
    )
    db.add(new_purchase)
    db.commit()
    db.refresh(new_purchase)
    
    logger.log_action(db, username=username, action="CREATE_PURCHASE", details=f"Item: {purchase.item}")
    
    return new_purchase

@router.put("/{purchase_id}", response_model=schemas.PurchaseResponse)
def update_purchase(purchase_id: str, purchase: schemas.PurchaseUpdate, username: str = "SYSTEM", db: Session = Depends(get_db)):
    db_purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
        
    # Permission Check: Only Admin can change Status
    if purchase.status is not None and purchase.status != db_purchase.status:
        # Fetch user role
        user = db.query(models.User).filter(models.User.username == username).first()
        if not user or user.role != models.UserRole.ADMIN:
             raise HTTPException(status_code=403, detail="Solo Administradores pueden cambiar el estado.")

    for key, value in purchase.dict(exclude_unset=True).items():
        setattr(db_purchase, key, value)

    db.commit()
    db.refresh(db_purchase)
    
    logger.log_action(db, username=username, action="UPDATE_PURCHASE", details=f"Updated Purchase: {purchase_id} -> {purchase}")

    return db_purchase

@router.delete("/{purchase_id}")
def delete_purchase(purchase_id: str, username: str, db: Session = Depends(get_db)):
    """
    Soft Delete: Marks as deleted instead of removing.
    """
    db_purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    # Soft Delete
    db_purchase.is_deleted = True
    db.commit()
    
    logger.log_action(db, username=username, action="DELETE_PURCHASE", details=f"Soft deleted purchase {purchase_id}")
    
    return {"message": "Purchase moved to trash (Soft Delete)"}

@router.post("/{purchase_id}/restore")
def restore_purchase(purchase_id: str, username: str, db: Session = Depends(get_db)):
    """
    Restores a soft-deleted purchase.
    """
    db_purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
        
    db_purchase.is_deleted = False
    db.commit()
    
    logger.log_action(db, username=username, action="RESTORE_PURCHASE", details=f"Restored purchase {purchase_id}")
    
    return {"message": "Purchase restored successfully"}
