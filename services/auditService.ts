import { api } from './api';

export interface LogEntry {
  id: string;
  timestamp: number;
  user_id: string;
  username: string;
  action: string;
  details: string;
  ip?: string;
  entity_id?: string;
  changes?: string;
}

export const auditService = {
  getLogs: async (entityId?: string) => {
    let url = '/logs/';
    if (entityId) {
      url += `?entity_id=${entityId}`;
    }
    return await api.get(url);
  },

  // Helper to format timestamp
  formatTime: (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('es-CL');
  }
};
