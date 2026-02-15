from pydantic import BaseModel, validator
from typing import Optional, List
from .models import UserRole, LicenseStatus, ProcessStatus

# User Schemas
class UserBase(BaseModel):
    username: str
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None

class UserResponse(UserBase):
    id: str
    created_at: int
    
    class Config:
        orm_mode = True

# License Schemas
class LicenseBase(BaseModel):
    full_name: str
    rut: str
    license_number: str
    category: str
    last_control_date: str
    status: str
    process_status: str
    email: Optional[str] = None
    phone: Optional[str] = None
    # New tracking fields
    tipo_tramite: Optional[str] = None
    exam_teorico: Optional[str] = 'PENDIENTE'
    exam_practico: Optional[str] = 'PENDIENTE'
    exam_medico: Optional[str] = 'PENDIENTE'
    restricciones_medicas: Optional[str] = None
    fecha_control: Optional[str] = None

class LicenseCreate(LicenseBase):
    @validator('rut')
    def validate_chilean_rut(cls, v):
        from .utils.rut import validate_rut, format_rut
        if not validate_rut(v):
            raise ValueError('RUT inválido. Verifique el dígito verificador.')
        return format_rut(v)

class LicenseResponse(LicenseBase):
    id: str
    upload_date: int
    uploaded_by: str
    is_deleted: bool = False

    class Config:
        orm_mode = True

# --- PURCHASE SCHEMAS ---

class PurchaseBase(BaseModel):
    item: str
    description: str
    amount: Optional[int] = None

class PurchaseCreate(PurchaseBase):
    pass

class PurchaseUpdate(BaseModel):
    status: Optional[str] = None
    item: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[int] = None

class PurchaseResponse(PurchaseBase):
    id: str
    request_date: int
    status: str
    requested_by: str
    is_deleted: bool = False

    class Config:
        orm_mode = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
