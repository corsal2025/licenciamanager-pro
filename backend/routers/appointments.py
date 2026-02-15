from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import uuid
from ..database import get_db
from ..models import Appointment
import datetime

router = APIRouter(
    prefix="/appointments",
    tags=["appointments"]
)

class AppointmentCreate(BaseModel):
    rut: str
    date: str
    time: str

class AppointmentResponse(BaseModel):
    id: str
    rut: str
    date: str
    time: str
    status: str

@router.get("/slots")
def get_available_slots(date: str, db: Session = Depends(get_db)):
    # 1. Define Standard Slots (9:00 to 14:00, 20 min interval)
    # Simple logic: 09:00, 09:20, 09:40, 10:00 ... 13:40.
    start_hour = 9
    end_hour = 14
    interval_minutes = 20
    
    potential_slots = []
    current_time = datetime.datetime.strptime(f"{date} {start_hour}:00", "%Y-%m-%d %H:%M")
    end_time = datetime.datetime.strptime(f"{date} {end_hour}:00", "%Y-%m-%d %H:%M")
    
    while current_time < end_time:
        potential_slots.append(current_time.strftime("%H:%M"))
        current_time += datetime.timedelta(minutes=interval_minutes)
        
    # 2. Query booked slots from DB
    booked_appointments = db.query(Appointment).filter(
        Appointment.date == date,
        Appointment.status == "CONFIRMED"
    ).all()
    
    booked_times = [appt.time for appt in booked_appointments]
    
    # 3. Filter available
    available_slots = [slot for slot in potential_slots if slot not in booked_times]
    
    return {"date": date, "slots": available_slots}

@router.post("/book", response_model=AppointmentResponse)
def book_appointment(appt: AppointmentCreate, db: Session = Depends(get_db)):
    # 1. Check if slot is already taken (Race condition possible but low risk for this scale)
    existing = db.query(Appointment).filter(
        Appointment.date == appt.date,
        Appointment.time == appt.time,
        Appointment.status == "CONFIRMED"
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Horario ya reservado")
        
    # 2. Check if user already has an appointment that day? (Optional, skipping for simplicity)
    
    new_appt = Appointment(
        id=str(uuid.uuid4()),
        rut=appt.rut,
        date=appt.date,
        time=appt.time,
        status="CONFIRMED"
    )
    
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)
    
    return {
        "id": new_appt.id,
        "rut": new_appt.rut,
        "date": new_appt.date,
        "time": new_appt.time,
        "status": new_appt.status
    }

@router.get("/my-appointment/{rut}")
def get_my_appointment(rut: str, db: Session = Depends(get_db)):
    # Get future appointments
    today = datetime.date.today().isoformat()
    appt = db.query(Appointment).filter(
        Appointment.rut == rut,
        Appointment.date >= today,
        Appointment.status == "CONFIRMED"
    ).order_by(Appointment.date, Appointment.time).first()
    
    if not appt:
        return None
        
    return {
        "id": appt.id,
        "rut": appt.rut,
        "date": appt.date,
        "time": appt.time,
        "status": appt.status
    }
