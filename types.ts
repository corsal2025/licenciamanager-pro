
export enum LicenseStatus {
  VALID = 'VIGENTE',
  EXPIRED = 'VENCIDA',
  NEAR_EXPIRY = 'PROX. A VENCER'
}

export enum ProcessStatus {
  CONASET = 'SUBIDA A CONASET',
  AGENDA_MENSUAL = 'AGENDA MENSUAL',
  AGENDA_PLACILLA = 'AGENDA PLACILLA',
  ADDRESS_CHANGE = 'CAMBIO DOMICILIO',
  NO_FOLDER = 'SIN CARPETA',
  PENDING = 'PENDIENTE', // Mantenido para compatibilidad, pero oculto de métricas principales si se desea
  FIRST_LICENSE = 'PRIMERA LICENCIA',
  OFFICE_43 = 'EN OFICINA 43',
  IN_ARCHIVES = 'EN ARCHIVOS',
  UPLOADED_F8 = 'SUBIDA CON F8',
  URGENT = 'URGENTES POR PEDIR',
  DENIED = 'DENEGADA',
  READY_FOR_PICKUP = 'LISTA PARA ENTREGA',
  DELIVERED = 'ENTREGADA',
  IN_DISPUTE = 'EN_OBSERVACION'
}

export enum UserRole {
  ADMIN = 'ADMINISTRADOR',
  OPERATOR = 'OPERADOR'
}

export enum TipoTramite {
  RENOVACION = 'RENOVACIÓN',
  PRIMERA_VEZ = 'PRIMERA VEZ',
  EXTENSION = 'EXTENSIÓN',
  DUPLICADO = 'DUPLICADO',
  CAMBIO_DOMICILIO = 'CAMBIO DOMICILIO',
  CANJE = 'CANJE INTERNACIONAL'
}

export enum ExamStatus {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  REPROBADO_1 = 'REPROBADO (1er intento)',
  REPROBADO_2 = 'REPROBADO (2do intento)',
  NO_APLICA = 'NO APLICA'
}

// ... existing enums ...

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  createdAt: number;
}

export interface LicenseData {
  id: string;
  fullName: string;
  rut: string;
  licenseNumber: string;
  category: string;
  lastControlDate: string;
  status: LicenseStatus;
  processStatus: ProcessStatus;
  uploadDate: number;
  uploadedBy: string;

  // Contact Fields
  email?: string;
  phone?: string;

  // Soft Delete
  isDeleted?: boolean;

  // Process Tracking Fields
  tipoTramite?: string;
  examTeorico?: string;
  examPractico?: string;
  examMedico?: string;
  restriccionesMedicas?: string;
  fechaControl?: string;

  // Legacy fields
  issueDate?: string;
  expirationDate?: string;
  issuingAuthority?: string;
  country?: string;
}

export enum PurchaseStatus {
  PENDING = 'PENDIENTE',
  APPROVED = 'APROBADO',
  PURCHASED = 'COMPRADO',
  REJECTED = 'RECHAZADO'
}

export interface Purchase {
  id: string;
  item: string;
  description: string;
  requestDate: number;
  status: PurchaseStatus;
  amount?: number;
  requestedBy: string;
  isDeleted?: boolean;
}

export interface DriveSyncItem {
  id: string;
  rut: string;
  fullName: string;
  folderStatus: 'PENDING' | 'MOVED';
  originalFolder: string;
  targetFolder: string;
}

export enum AuditAction {
  LOGIN = 'INICIO SESIÓN',
  LOGOUT = 'CIERRE SESIÓN',
  CREATE_LICENSE = 'CREAR LICENCIA',
  EDIT_LICENSE = 'EDITAR LICENCIA',
  DELETE_LICENSE = 'ELIMINAR LICENCIA',
  BULK_ACTION = 'ACCIÓN MASIVA',
  CREATE_USER = 'CREAR USUARIO',
  DELETE_USER = 'ELIMINAR USUARIO',
  SYSTEM_BACKUP = 'RESPALDO SISTEMA',
  SYSTEM_RESTORE = 'RESTAURACIÓN SISTEMA',
  CREATE_PURCHASE = 'CREAR PEDIDO',
  UPDATE_PURCHASE = 'ACTUALIZAR PEDIDO',
  DELETE_PURCHASE = 'ELIMINAR PEDIDO'
}

export interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  username: string;
  action: AuditAction;
  details: string;
  ip?: string;
}

export type ViewMode = 'dashboard' | 'upload' | 'list' | 'users' | 'analytics' | 'drive-sync' | 'audit' | 'settings' | 'folder-finder' | 'module-16' | 'module-12' | 'comparison' | 'purchases' | 'public-portal';


export interface SystemHealth {
  lastBackupTime: number | null;
  isSaving: boolean;
  needsBackup: boolean;
}