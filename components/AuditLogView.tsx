
import React, { useState, useMemo } from 'react';
import { AuditLog, AuditAction } from '../types';
import { auditService } from '../services/auditService';
import { ShieldAlert, Search, Calendar, User as UserIcon, Activity } from 'lucide-react';

const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  React.useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await auditService.getLogs();
        setLogs(data);
      } catch (error) {
        console.error("Failed to fetch logs", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch =
        log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = filterAction === 'ALL' || log.action === filterAction;

      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, filterAction]);

  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case AuditAction.DELETE_LICENSE:
      case AuditAction.DELETE_USER:
        return 'text-red-600 bg-red-50 border-red-100';
      case AuditAction.CREATE_USER:
      case AuditAction.CREATE_LICENSE:
        return 'text-green-600 bg-green-50 border-green-100';
      case AuditAction.LOGIN:
        return 'text-blue-600 bg-blue-50 border-blue-100';
      case AuditAction.SYSTEM_RESTORE:
        return 'text-purple-600 bg-purple-50 border-purple-100';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  if (isLoading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Cargando historial de eventos...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-slate-700" />
            Bitácora de Auditoría
          </h2>
          <p className="text-slate-500 text-sm">Registro inmutable de todas las acciones realizadas en el sistema.</p>
        </div>
        <div className="text-right">
          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
            {logs.length} eventos registrados
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative grow md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por usuario o detalle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:outline-none"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
        >
          <option value="ALL">Todos los Eventos</option>
          <option value={AuditAction.LOGIN}>Inicios de Sesión</option>
          <option value={AuditAction.DELETE_LICENSE}>Eliminaciones</option>
          <option value={AuditAction.EDIT_LICENSE}>Ediciones</option>
          <option value={AuditAction.SYSTEM_BACKUP}>Respaldos</option>
        </select>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 w-48">Fecha / Hora</th>
                <th className="px-6 py-3 w-40">Usuario</th>
                <th className="px-6 py-3 w-48">Acción</th>
                <th className="px-6 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 opacity-50" />
                      {new Date(log.timestamp).toLocaleString('es-CL', { hour12: false })}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-3 h-3 text-slate-400" />
                      <span className="font-bold text-slate-700">{log.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${getActionColor(log.action)}`}>
                      <Activity className="w-3 h-3" />
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-600 truncate max-w-md" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No se encontraron registros de auditoría.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogView;
