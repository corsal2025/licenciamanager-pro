from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base
import enum
import time

class UserRole(str, enum.Enum):
    ADMIN = "ADMINISTRADOR"
    OPERATOR = "OPERADOR"

class LicenseStatus(str, enum.Enum):
    VALID = 'VIGENTE'
    EXPIRED = 'VENCIDA'
    NEAR_EXPIRY = 'PROX. A VENCER'

class ProcessStatus(str, enum.Enum):
    CONASET = 'SUBIDA A CONASET'
    AGENDA_MENSUAL = 'AGENDA MENSUAL'
    AGENDA_PLACILLA = 'AGENDA PLACILLA'
    ADDRESS_CHANGE = 'CAMBIO DOMICILIO'
    NO_FOLDER = 'SIN CARPETA'
    PENDING = 'PENDIENTE'
    FIRST_LICENSE = 'PRIMERA LICENCIA'
    OFFICE_43 = 'EN OFICINA 43'
    IN_ARCHIVES = 'EN ARCHIVOS'
    UPLOADED_F8 = 'SUBIDA CON F8'
    URGENT = 'URGENTES POR PEDIR'
    DENIED = 'DENEGADA'
    READY_FOR_PICKUP = 'LISTA PARA ENTREGA'
    DELIVERED = 'ENTREGADA'
    IN_DISPUTE = 'EN_OBSERVACION'

class PurchaseStatus(str, enum.Enum):
    PENDING = 'PENDIENTE'
    APPROVED = 'APROBADO'
    PURCHASED = 'COMPRADO'
    REJECTED = 'RECHAZADO'

class TipoTramite(str, enum.Enum):
    RENOVACION = 'RENOVACIÓN'
    PRIMERA_VEZ = 'PRIMERA VEZ'
    EXTENSION = 'EXTENSIÓN'
    DUPLICADO = 'DUPLICADO'
    CAMBIO_DOMICILIO = 'CAMBIO DOMICILIO'
    CANJE = 'CANJE INTERNACIONAL'

class ExamStatus(str, enum.Enum):
    PENDIENTE = 'PENDIENTE'
    APROBADO = 'APROBADO'
    REPROBADO_1 = 'REPROBADO (1er intento)'
    REPROBADO_2 = 'REPROBADO (2do intento)'
    NO_APLICA = 'NO APLICA'

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String, default=UserRole.OPERATOR)
    created_at = Column(Integer, default=lambda: int(time.time()))

class License(Base):
    __tablename__ = "licenses"

    id = Column(String, primary_key=True, index=True)
    full_name = Column(String, index=True)
    rut = Column(String, index=True)
    license_number = Column(String)
    category = Column(String)
    last_control_date = Column(String)
    status = Column(String) 
    process_status = Column(String)
    upload_date = Column(Integer)
    uploaded_by = Column(String, ForeignKey("users.username"))
    
    # New Fields for Notifications
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    
    # New Field for Soft Delete
    is_deleted = Column(Boolean, default=False)
    
    # New Fields for Process Tracking
    tipo_tramite = Column(String, nullable=True)  # RENOVACIÓN, PRIMERA VEZ, etc.
    exam_teorico = Column(String, nullable=True, default='PENDIENTE')
    exam_practico = Column(String, nullable=True, default='PENDIENTE')
    exam_medico = Column(String, nullable=True, default='PENDIENTE')
    restricciones_medicas = Column(String, nullable=True)  # Lentes, audífonos, etc.
    fecha_control = Column(String, nullable=True)  # Fecha próximo control

class Purchase(Base):
    __tablename__ = "purchases"
    
    id = Column(String, primary_key=True, index=True)
    item = Column(String)
    description = Column(String)
    request_date = Column(Integer, default=lambda: int(time.time()))
    status = Column(String, default=PurchaseStatus.PENDING)
    amount = Column(Integer, nullable=True)
    requested_by = Column(String, ForeignKey("users.username"))
    
    # Note: Using String for requested_by allows simple linking. 
    # Relationship is optional but good.
    
    is_deleted = Column(Boolean, default=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(Integer, default=lambda: int(time.time()))
    user_id = Column(String)
    username = Column(String)
    action = Column(String)
    details = Column(String)
    ip = Column(String, nullable=True)
    
    # Enhanced Tracking
    entity_id = Column(String, nullable=True, index=True) # ID of License/User affected
    changes = Column(String, nullable=True) # JSON string of changes


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String, primary_key=True, index=True)
    rut = Column(String, index=True) # Linked to citizen RUT
    date = Column(String) # YYYY-MM-DD
    time = Column(String) # HH:MM
    status = Column(String, default="CONFIRMED") # CONFIRMED, CANCELLED, COMPLETED
    created_at = Column(Integer, default=lambda: int(time.time()))

