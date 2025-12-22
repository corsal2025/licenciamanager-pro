import React, { useState } from 'react';
import { AlertCircle, FileWarning, Search, CheckCircle, ArrowRight, XCircle } from 'lucide-react';
import { LicenseData, ProcessStatus, User } from '../types';

interface Module16Props {
  licenses: LicenseData[];
  onUpdateStatus: (id: string, status: ProcessStatus) => void;
  currentUser?: User;
}

// Mock Component for compatibility if used without props
const Module16: React.FC = () => {
  return <div className="p-8 text-center text-slate-500">Cargando Centro de Resoluciones...</div>;
};

// Real Component
export const ResolutionModule: React.FC<Module16Props> = ({ licenses, onUpdateStatus, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Critical Statuses
  const CRITICAL_STATUSES = [
    ProcessStatus.DENIED,
    ProcessStatus.NO_FOLDER,
    ProcessStatus.IN_DISPUTE
  ];

  const pendingIssues = licenses.filter(l =>
    CRITICAL_STATUSES.includes(l.processStatus) &&
    (l.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.rut.includes(searchTerm))
  );

  const getStatusBadge = (status: ProcessStatus) => {
    switch (status) {
      case ProcessStatus.DENIED:
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> DENEGADA</span>;
      case ProcessStatus.NO_FOLDER:
        return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><FileWarning className="w-3 h-3" /> SIN CARPETA</span>;
      case ProcessStatus.IN_DISPUTE:
        return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> EN OBSERVACIÓN</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const activeCount = pendingIssues.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            Módulo 16: Resoluciones
          </h2>
          <p className="text-slate-500">Gestión de licencias con problemas, bloqueos o denegaciones.</p>
        </div>
        <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-lg font-bold border border-amber-200">
          {activeCount} Casos Pendientes
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar caso por nombre o RUT..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600 text-sm">Licencia</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Problema Detectado</th>
              <th className="p-4 font-semibold text-slate-600 text-sm">Fecha Reporte</th>
              <th className="p-4 font-semibold text-slate-600 text-sm text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pendingIssues.length > 0 ? (
              pendingIssues.map(license => (
                <tr key={license.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{license.fullName}</div>
                    <div className="text-xs text-slate-500">{license.rut} - Clase {license.category}</div>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(license.processStatus)}
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {new Date(license.uploadDate * 1000).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          const note = prompt("Ingrese nota de resolución (Opcional):");
                          if (note !== null) {
                            onUpdateStatus(license.id, ProcessStatus.PENDING);
                          }
                        }}
                        className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Resolver
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm("¿Mover a 'Sin Carpeta' para búsqueda física?")) {
                            onUpdateStatus(license.id, ProcessStatus.NO_FOLDER);
                          }
                        }}
                        disabled={license.processStatus === ProcessStatus.NO_FOLDER}
                        className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50"
                      >
                        Búsqueda Física
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  No hay casos pendientes de resolución.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Module16;
