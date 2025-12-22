
import React, { useState, useMemo } from 'react';
import { LicenseData, LicenseStatus, ProcessStatus, UserRole } from '../types';
import { Search, FileCheck, MapPin, AlertOctagon, User, FileSpreadsheet, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Trash2, ArrowUpDown, CheckSquare, CreditCard, XCircle, CalendarDays, Map, FolderX, Ban, UploadCloud, Home, Clock, Sparkles, Building2, Archive, Siren, MessageCircle } from 'lucide-react';
import { exportToCSV } from '../utils/formatters';
import { authService } from '../services/authService';
import AuditTimeline from './AuditTimeline';

interface LicenseTableProps {
  licenses: LicenseData[];
  onEditLicense: (license: LicenseData) => void;
  onDeleteLicense: (id: string) => void;
  onBulkUpdateStatus: (ids: string[], status: ProcessStatus) => void;
  onBulkDelete: (ids: string[]) => void;
}

type SortKey = keyof LicenseData;
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const LicenseTable: React.FC<LicenseTableProps> = ({
  licenses,
  onEditLicense,
  onDeleteLicense,
  onBulkUpdateStatus,
  onBulkDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterRut, setFilterRut] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterProcess, setFilterProcess] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'uploadDate', direction: 'desc' });

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Audit State
  const [auditInfo, setAuditInfo] = useState<{ id: string, name: string } | null>(null);

  // Filter Logic
  const filteredLicenses = useMemo(() => {
    return licenses.filter(license => {
      const matchesSearch = license.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.licenseNumber.includes(searchTerm);

      const matchesName = filterName === '' || license.fullName.toLowerCase().includes(filterName.toLowerCase());

      // RUT Filter Logic: Normalize to remove dots/dashes for flexible search
      const cleanLicenseRut = license.rut.replace(/[^0-9kK]/g, '').toLowerCase();
      const cleanFilterRut = filterRut.replace(/[^0-9kK]/g, '').toLowerCase();
      const matchesRut = filterRut === '' || cleanLicenseRut.includes(cleanFilterRut);

      // Legacy status filter (can be kept or ignored based on new requirement)
      const matchesStatus = filterStatus === 'ALL' || license.status === filterStatus;
      const matchesProcess = filterProcess === 'ALL' || license.processStatus === filterProcess;
      const matchesCategory = filterCategory === 'ALL' || license.category.includes(filterCategory);

      return matchesSearch && matchesName && matchesRut && matchesStatus && matchesProcess && matchesCategory;
    });
  }, [licenses, searchTerm, filterName, filterRut, filterStatus, filterProcess, filterCategory]);

  // Sort Logic
  const sortedLicenses = useMemo(() => {
    return [...filteredLicenses].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredLicenses, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedLicenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = sortedLicenses.slice(startIndex, startIndex + itemsPerPage);

  // Handlers
  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === currentData.length && currentData.length > 0) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set<string>();
      currentData.forEach(l => newSet.add(l.id));
      setSelectedIds(newSet);
    }
  };

  const handleExport = () => {
    const dataToExport = filteredLicenses.map(l => ({
      Nombre: l.fullName,
      RUT: l.rut,
      Licencia: l.licenseNumber,
      Categoria: l.category,
      Ultimo_Control: l.lastControlDate,
      Estado_Tramite: l.processStatus
    }));
    exportToCSV(dataToExport, 'Reporte_Licencias');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterName('');
    setFilterRut('');
    setFilterStatus('ALL');
    setFilterProcess('ALL');
    setFilterCategory('ALL');
  };

  const getProcessBadge = (status: ProcessStatus) => {
    const badgeClass = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm transition-all hover:scale-105 cursor-default whitespace-nowrap";

    switch (status) {
      case ProcessStatus.CONASET:
        return (
          <span className={`${badgeClass} bg-blue-50 text-blue-700 border-blue-200`}>
            <FileCheck className="w-3.5 h-3.5" /> CONASET
          </span>
        );

      // NUEVAS CATEGORÍAS VISUALMENTE DISTINTIVAS
      case ProcessStatus.AGENDA_MENSUAL:
        return (
          <span className={`${badgeClass} bg-violet-50 text-violet-700 border-violet-200`}>
            <CalendarDays className="w-3.5 h-3.5" /> MENSUAL
          </span>
        );
      case ProcessStatus.AGENDA_PLACILLA:
        return (
          <span className={`${badgeClass} bg-teal-50 text-teal-700 border-teal-200`}>
            <Map className="w-3.5 h-3.5" /> PLACILLA
          </span>
        );
      case ProcessStatus.ADDRESS_CHANGE:
        return (
          <span className={`${badgeClass} bg-orange-50 text-orange-700 border-orange-200`}>
            <Home className="w-3.5 h-3.5" /> DOMICILIO
          </span>
        );
      case ProcessStatus.NO_FOLDER:
        return (
          <span className={`${badgeClass} bg-red-50 text-red-700 border-red-200`}>
            <FolderX className="w-3.5 h-3.5" /> SIN CARPETA
          </span>
        );
      case ProcessStatus.DENIED:
        return (
          <span className={`${badgeClass} bg-red-600 text-white border-red-700 shadow-red-200`}>
            <Ban className="w-3.5 h-3.5 text-red-100" /> DENEGADA
          </span>
        );
      case ProcessStatus.UPLOADED_F8:
        return (
          <span className={`${badgeClass} bg-cyan-50 text-cyan-700 border-cyan-200`}>
            <UploadCloud className="w-3.5 h-3.5" /> F8
          </span>
        );
      case ProcessStatus.PENDING:
        return (
          <span className={`${badgeClass} bg-slate-100 text-slate-600 border-slate-200`}>
            <Clock className="w-3.5 h-3.5" /> PENDIENTE
          </span>
        );
      case ProcessStatus.FIRST_LICENSE:
        return (
          <span className={`${badgeClass} bg-emerald-50 text-emerald-700 border-emerald-200`}>
            <Sparkles className="w-3.5 h-3.5" /> PRIMERA
          </span>
        );
      case ProcessStatus.OFFICE_43:
        return (
          <span className={`${badgeClass} bg-indigo-50 text-indigo-700 border-indigo-200`}>
            <Building2 className="w-3.5 h-3.5" /> OF. 43
          </span>
        );
      case ProcessStatus.IN_ARCHIVES:
        return (
          <span className={`${badgeClass} bg-amber-50 text-amber-700 border-amber-200`}>
            <Archive className="w-3.5 h-3.5" /> ARCHIVOS
          </span>
        );
      case ProcessStatus.URGENT:
        return (
          <span className={`${badgeClass} bg-rose-50 text-rose-700 border-rose-200 animate-pulse`}>
            <Siren className="w-3.5 h-3.5" /> URGENTE
          </span>
        );
      default: return null;
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 opacity-20" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  return (
    <div className="space-y-4">

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-800 text-white px-6 py-3 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
          <div className="flex items-center gap-4">
            <span className="font-bold text-sm bg-slate-700 px-3 py-1 rounded-full">{selectedIds.size} seleccionados</span>
            <div className="h-4 w-px bg-slate-600 mx-2"></div>
            <span className="text-sm text-slate-300">Acciones masivas:</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { onBulkUpdateStatus(Array.from(selectedIds), ProcessStatus.CONASET); setSelectedIds(new Set()); }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" /> Marcar CONASET
            </button>
            {isAdmin && (
              <button
                onClick={() => { onBulkDelete(Array.from(selectedIds)); setSelectedIds(new Set()); }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">Base de Datos</h2>

          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">

            {/* General Search */}
            <div className="relative grow sm:grow-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Búsqueda general..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48"
              />
            </div>

            {/* Name Filter */}
            <div className="relative grow sm:grow-0">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por Nombre..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48"
              />
            </div>

            {/* RUT Filter */}
            <div className="relative grow sm:grow-0">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por RUT..."
                value={filterRut}
                onChange={(e) => setFilterRut(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-40 font-mono"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
            >
              <option value="ALL">Todas las Clases</option>
              <option value="B">Clase B</option>
              <option value="C">Clase C</option>
              <option value="A1">Clase A1</option>
              <option value="A2">Clase A2</option>
              <option value="A3">Clase A3</option>
              <option value="A4">Clase A4</option>
              <option value="A5">Clase A5</option>
              <option value="D">Clase D</option>
              <option value="F">Clase F</option>
            </select>

            <select
              value={filterProcess}
              onChange={(e) => setFilterProcess(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer max-w-xs"
            >
              <option value="ALL">Todos los Trámites</option>
              <option value={ProcessStatus.CONASET}>CONASET</option>
              <option value={ProcessStatus.UPLOADED_F8}>Subida con F8</option>
              <option value={ProcessStatus.DENIED}>Denegadas</option>
              <option value={ProcessStatus.AGENDA_MENSUAL}>Agenda Mensual</option>
              <option value={ProcessStatus.AGENDA_PLACILLA}>Agenda Placilla</option>
              <option value={ProcessStatus.ADDRESS_CHANGE}>Cambio Domicilio</option>
              <option value={ProcessStatus.NO_FOLDER}>Sin Carpeta</option>
              <option value={ProcessStatus.URGENT}>Urgentes</option>
            </select>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600">
                    {selectedIds.size > 0 && selectedIds.size === currentData.length ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded mx-auto"></div>}
                  </button>
                </th>
                <th onClick={() => handleSort('fullName')} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none">
                  <div className="flex items-center gap-1">Conductor <SortIcon column="fullName" /></div>
                </th>
                <th onClick={() => handleSort('rut')} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none">
                  <div className="flex items-center gap-1">RUT <SortIcon column="rut" /></div>
                </th>
                <th onClick={() => handleSort('category')} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none">
                  <div className="flex items-center gap-1">Clase <SortIcon column="category" /></div>
                </th>
                <th onClick={() => handleSort('lastControlDate')} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none">
                  <div className="flex items-center gap-1">Último Control <SortIcon column="lastControlDate" /></div>
                </th>
                <th onClick={() => handleSort('processStatus')} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group select-none">
                  <div className="flex items-center gap-1">Ubicación / Estado <SortIcon column="processStatus" /></div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentData.length > 0 ? (
                currentData.map((license) => (
                  <tr
                    key={license.id}
                    className={`hover:bg-slate-50 transition-colors group ${selectedIds.has(license.id) ? 'bg-blue-50/50' : ''}`}
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(license.id)}
                        onChange={() => toggleSelection(license.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => onEditLicense(license)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300 shrink-0">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="font-medium text-slate-900 text-sm">{license.fullName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => onEditLicense(license)}>
                      <div className="text-sm font-mono text-slate-600">{license.rut}</div>
                    </td>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => onEditLicense(license)}>
                      <div className="text-xs text-slate-700 font-bold bg-slate-100 px-2 py-1 rounded inline-block border border-slate-200">
                        {license.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => onEditLicense(license)}>
                      <span className="text-sm font-medium text-slate-700">
                        {license.lastControlDate}
                      </span>
                    </td>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => onEditLicense(license)}>
                      {getProcessBadge(license.processStatus)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {license.phone && (
                          <button
                            onClick={() => {
                              const cleanPhone = license.phone?.replace(/[^0-9]/g, '');
                              const msg = `Estimado/a ${license.fullName}, le informamos que su licencia (RUT: ${license.rut}) se encuentra lista para retiro.`;
                              window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="text-slate-400 hover:text-green-600 p-1 rounded-md hover:bg-green-50 transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onEditLicense(license)}
                          className="text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <FileCheck className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => { if (window.confirm('¿Eliminar este registro?')) onDeleteLicense(license.id); }}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setAuditInfo({ id: license.id, name: license.fullName })}
                          className="text-slate-400 hover:text-indigo-600 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                          title="Ver Historial"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="bg-slate-50 p-4 rounded-full mb-3">
                        <Search className="w-10 h-10 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-700 mb-1">Sin resultados</h3>
                      <p className="text-slate-400 max-w-xs mx-auto">No se encontraron licencias que coincidan con tus criterios de búsqueda.</p>

                      {(searchTerm || filterName || filterRut || filterStatus !== 'ALL' || filterProcess !== 'ALL' || filterCategory !== 'ALL') && (
                        <button
                          onClick={clearFilters}
                          className="mt-5 flex items-center gap-2 text-blue-600 text-sm font-bold hover:text-blue-700 hover:underline transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Limpiar todos los filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="text-xs text-slate-500">
            Mostrando <span className="font-medium">{startIndex + 1}</span> - <span className="font-medium">{Math.min(startIndex + itemsPerPage, sortedLicenses.length)}</span> de <span className="font-medium">{sortedLicenses.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-slate-700 px-2">Pág {currentPage} de {totalPages || 1}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {auditInfo && (
        <AuditTimeline
          entityId={auditInfo.id}
          entityTitle={auditInfo.name}
          isOpen={true}
          onClose={() => setAuditInfo(null)}
        />
      )}
    </div>
  );
};

export default LicenseTable;
