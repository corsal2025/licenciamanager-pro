import React, { useEffect, useState } from 'react';
import { X, Clock, User, Shield, Activity } from 'lucide-react';
import { auditService, LogEntry } from '../services/auditService';

interface AuditTimelineProps {
    entityId: string;
    entityTitle: string;
    isOpen: boolean;
    onClose: () => void;
}

const AuditTimeline: React.FC<AuditTimelineProps> = ({ entityId, entityTitle, isOpen, onClose }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && entityId) {
            fetchLogs();
        }
    }, [isOpen, entityId]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await auditService.getLogs(entityId);
            setLogs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-600" />
                            Historial de Cambios
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 truncate max-w-[250px]">
                            {entityTitle}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm">
                            <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            No hay registros de auditoría para este ítem.
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-indigo-100 space-y-8 ml-3">
                            {logs.map((log, index) => (
                                <div key={log.id || index} className="relative pl-6">
                                    {/* Dot */}
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm bg-indigo-500" />

                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">
                                                {log.action}
                                            </span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {auditService.formatTime(log.timestamp)}
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-700 mb-3">
                                            {log.details}
                                        </p>

                                        <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                <User className="w-3 h-3 text-slate-500" />
                                            </div>
                                            <span className="text-xs font-medium text-slate-600">
                                                {log.username}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditTimeline;
