
import { ProcessStatus } from '../types';
import { formatRut } from '../utils/formatters';

const ROUTING_STORAGE_KEY = 'license_manager_routing_rules';

interface RoutingRule {
  rut: string;
  targetStatus: ProcessStatus;
}

export const routingService = {
  
  // Cargar reglas desde LocalStorage
  getRules: (): Record<string, ProcessStatus> => {
    const stored = localStorage.getItem(ROUTING_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  },

  // Guardar el mapa completo
  saveRules: (rules: Record<string, ProcessStatus>) => {
    localStorage.setItem(ROUTING_STORAGE_KEY, JSON.stringify(rules));
  },

  // Importar una lista (CSV simple o texto) para un estado específico
  importList: async (file: File, status: ProcessStatus): Promise<number> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split(/\r?\n/);
          
          const currentRules = routingService.getRules();
          let count = 0;

          lines.forEach(line => {
            // Limpiar línea y buscar algo que parezca un RUT
            const cleanLine = line.trim();
            if (!cleanLine) return;

            // Formateamos el RUT para asegurar consistencia (ej: 123456789 -> 12.345.678-9)
            // Asumimos que la línea contiene el RUT. Si es CSV complejo, tomamos la primera columna.
            const parts = cleanLine.split(/[,;]/); 
            const potentialRut = parts[0].trim();
            
            if (potentialRut.length > 5) { // Mínima validación de longitud
                const formatted = formatRut(potentialRut);
                currentRules[formatted] = status;
                count++;
            }
          });

          routingService.saveRules(currentRules);
          resolve(count);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsText(file);
    });
  },

  // Determinar el estado basado en el RUT
  resolveStatus: (rut: string): ProcessStatus | null => {
    const rules = routingService.getRules();
    const formatted = formatRut(rut);
    return rules[formatted] || null;
  },

  // Obtener conteo por estado
  getStats: (): Record<string, number> => {
    const rules = routingService.getRules();
    const stats: Record<string, number> = {};
    
    Object.values(rules).forEach(status => {
        stats[status] = (stats[status] || 0) + 1;
    });
    
    return stats;
  },

  clearAll: () => {
    localStorage.removeItem(ROUTING_STORAGE_KEY);
  }
};
