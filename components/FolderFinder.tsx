
import React, { useState, useMemo } from 'react';
import { LicenseData, ProcessStatus } from '../types';
import { Archive, Building2, Search, MapPin, Calendar, AlertCircle, ArrowRight } from 'lucide-react';

interface FolderFinderProps {
  licenses: LicenseData[];
}

type FolderLocation = 'ARCHIVES' | 'OFFICE' | 'UNKNOWN';

const FolderFinder: React.FC<FolderFinderProps> = ({ licenses }) => {
  const [testDate, setTestDate] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  
  // LÓGICA DE FECHA DE CORTE
  // Regla: Junio 2023 (Mes 6, Año 2023) hacia atrás -> ARCHIVOS
  // Regla: Julio 2023 (Mes 7, Año 2023) en adelante -> OFICINA
  const determineLocation = (month: number, year: number): FolderLocation => {
    if (year < 2023) return 'ARCHIVES';
    if (year > 2023) return 'OFFICE';
    // Año es 2023
    if (month <= 6) return 'ARCHIVES'; // Enero a Junio
    return 'OFFICE'; // Julio a Diciembre
  };

  // Parser de Fechas (Intenta extraer Mes y Año de strings como "ENE 2022", "05-2024")
  const parseDateString = (dateStr: string): { month: number, year: number } | null => {
      if (!dateStr || dateStr === 'N/A') return null;
      
      // 1. Intentar formato YYYY-MM o MM-YYYY con guiones/puntos
      const numericMatch = dateStr.match(/(\d{4})[\/\-\.](\d{1,2})|(\d{1,2})[\/\-\.](\d{4})/);
      if (numericMatch) {
          if (numericMatch[1]) return { year: parseInt(numericMatch[1]), month: parseInt(numericMatch[2]) };
          if (numericMatch[4]) return { year: parseInt(numericMatch[4]), month: parseInt(numericMatch[3]) };
      }

      // 2. Intentar buscar Año de 4 dígitos
      const yearMatch = dateStr.match(/20\d{2}/);
      if (!yearMatch) return null;
      const year = parseInt(yearMatch[0]);

      // 3. Intentar buscar Mes en texto
      const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
      const upperStr = dateStr.toUpperCase();
      const monthIndex = monthNames.findIndex(m => upperStr.includes(m));
      
      if (monthIndex !== -1) {
          return { month: monthIndex + 1, year };
      }

      // Si solo tenemos año, asumimos Enero por defecto o marcamos error (aquí asumimos Enero para no romper, pero idealmente necesita mes)
      return { month: 1, year };
  };

  // Lista de Licencias "SIN CARPETA" con su ubicación sugerida
  const missingFolderList = useMemo(() => {
      return licenses
        .filter(l => l.processStatus === ProcessStatus.NO_FOLDER || l.processStatus === ProcessStatus.PENDING)
        .map(l => {
            const parsed = parseDateString(l.lastControlDate);
            const location = parsed ? determineLocation(parsed.month, parsed.year) : 'UNKNOWN';
            return {
                ...l,
                parsedDate: parsed,
                suggestedLocation: location
            };
        });
  }, [licenses]);

  const testLocation = determineLocation(testDate.month, testDate.year);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            Localizador Físico de Carpetas
          </h2>
          <p className="text-slate-500">Herramienta para determinar ubicación física basada en la fecha de último control.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CALCULADORA IZQUIERDA */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Search className="w-5 h-5 text-slate-500" />
                      Consulta Rápida
                  </h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Año del Control</label>
                          <input 
                            type="number" 
                            value={testDate.year}
                            onChange={(e) => setTestDate(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                            className="w-full p-3 border border-slate-300 rounded-lg font-mono text-lg font-bold"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mes del Control</label>
                          <select
                             value={testDate.month}
                             onChange={(e) => setTestDate(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                             className="w-full p-3 border border-slate-300 rounded-lg font-medium"
                          >
                              <option value={1}>Enero</option>
                              <option value={2}>Febrero</option>
                              <option value={3}>Marzo</option>
                              <option value={4}>Abril</option>
                              <option value={5}>Mayo</option>
                              <option value={6}>Junio</option>
                              <option value={7}>Julio</option>
                              <option value={8}>Agosto</option>
                              <option value={9}>Septiembre</option>
                              <option value={10}>Octubre</option>
                              <option value={11}>Noviembre</option>
                              <option value={12}>Diciembre</option>
                          </select>
                      </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-100">
                      <p className="text-center text-xs text-slate-400 uppercase mb-2 font-bold">La carpeta debe estar en:</p>
                      
                      {testLocation === 'ARCHIVES' ? (
                          <div className="bg-amber-100 border-2 border-amber-300 rounded-xl p-6 text-center">
                              <Archive className="w-12 h-12 text-amber-600 mx-auto mb-2" />
                              <h2 className="text-2xl font-bold text-amber-800">ARCHIVOS</h2>
                              <p className="text-amber-700 text-sm font-medium">Estantería Histórica</p>
                              <p className="text-[10px] text-amber-600 mt-2">(Fecha ≤ Junio 2023)</p>
                          </div>
                      ) : (
                          <div className="bg-blue-100 border-2 border-blue-300 rounded-xl p-6 text-center">
                              <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                              <h2 className="text-2xl font-bold text-blue-800">OFICINA 44</h2>
                              <p className="text-blue-700 text-sm font-medium">Tránsito Actual</p>
                              <p className="text-[10px] text-blue-600 mt-2">(Fecha ≥ Julio 2023)</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          {/* LISTA DERECHA */}
          <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                  <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            Auditoría: Licencias Sin Carpeta
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Listado de licencias marcadas como "SIN CARPETA" o "PENDIENTES" y su ubicación probable.</p>
                      </div>
                      <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">{missingFolderList.length} Casos</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                      {missingFolderList.length === 0 ? (
                          <div className="p-10 text-center text-slate-400">
                              <Building2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                              <p>¡Excelente! No hay licencias marcadas como perdidas o pendientes.</p>
                          </div>
                      ) : (
                          <table className="w-full text-sm text-left">
                              <thead className="bg-slate-50 text-xs text-slate-500 uppercase sticky top-0">
                                  <tr>
                                      <th className="px-6 py-3">RUT / Nombre</th>
                                      <th className="px-6 py-3">Último Control</th>
                                      <th className="px-6 py-3">Ubicación Sugerida</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {missingFolderList.map((item) => (
                                      <tr key={item.id} className="hover:bg-slate-50">
                                          <td className="px-6 py-4">
                                              <div className="font-bold text-slate-700">{item.rut}</div>
                                              <div className="text-xs text-slate-500">{item.fullName}</div>
                                          </td>
                                          <td className="px-6 py-4 font-mono text-slate-600">
                                              {item.lastControlDate}
                                          </td>
                                          <td className="px-6 py-4">
                                              {item.suggestedLocation === 'ARCHIVES' && (
                                                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                                                      <Archive className="w-3 h-3" /> IR A ARCHIVOS
                                                  </span>
                                              )}
                                              {item.suggestedLocation === 'OFFICE' && (
                                                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
                                                      <Building2 className="w-3 h-3" /> OFICINA 44
                                                  </span>
                                              )}
                                              {item.suggestedLocation === 'UNKNOWN' && (
                                                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                                                      ? FECHA NO LEGIBLE
                                                  </span>
                                              )}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      )}
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
};

export default FolderFinder;
