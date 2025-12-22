
import { AuditLog, AuditAction, User } from '../types';
import { v4 as uuidv4 } from 'uuid';

const AUDIT_STORAGE_KEY = 'license_manager_audit_logs';

export const auditService = {
  
  log: (user: User | null, action: AuditAction, details: string) => {
    const currentLogs = auditService.getLogs();
    
    const newLog: AuditLog = {
      id: uuidv4(),
      timestamp: Date.now(),
      userId: user?.id || 'system',
      username: user?.username || 'SISTEMA',
      action: action,
      details: details
    };

    // Keep only last 1000 logs to prevent storage overflow
    const updatedLogs = [newLog, ...currentLogs].slice(0, 1000);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updatedLogs));
  },

  getLogs: (): AuditLog[] => {
    const logsStr = localStorage.getItem(AUDIT_STORAGE_KEY);
    return logsStr ? JSON.parse(logsStr) : [];
  },

  clearLogs: () => {
    localStorage.removeItem(AUDIT_STORAGE_KEY);
  },

  // For Backup purposes
  getAllDataForBackup: () => {
    return {
      auditLogs: auditService.getLogs()
    };
  }
};
