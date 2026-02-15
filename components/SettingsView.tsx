
import React, { useRef, useState, useEffect } from 'react';
import { Download, UploadCloud, Database, AlertTriangle, Save, FileSpreadsheet, Trash2, CheckCircle2, Key } from 'lucide-react';
import { LicenseData, User, AuditAction, ProcessStatus } from '../types';
import { authService } from '../services/authService';
import { auditService } from '../services/auditService';
import { routingService } from '../services/routingService';
import { googleDriveService } from '../services/googleDriveService';

interface SettingsViewProps {
  licenses: LicenseData[];
  onRestore: (licenses: LicenseData[], users: User[]) => void;
  currentUser: User;
  onBackupComplete?: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ licenses, onRestore, currentUser, onBackupComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [driveUrl, setDriveUrl] = useState('');
  const [routingStats, setRoutingStats] = useState<Record<string, number>>({});
  
  // API Config State
  const [apiConfig, setApiConfig] = useState({ clientId: '', apiKey: '' });

  useEffect(() => {
    const savedUrl = localStorage.getItem('drive_folder_url');
    if (savedUrl) setDriveUrl(savedUrl);
    loadRoutingStats();
    
    const savedApiConfig = googleDriveService.getConfig();
    if (savedApiConfig) setApiConfig(savedApiConfig);
  }, []);

  const loadRoutingStats = () => {
      setRoutingStats(routingService.getStats());
  };

  const handleSaveDriveUrl = () => {
    localStorage.setItem('drive_folder_url', driveUrl);
    alert('Enlace de Google Drive guardado correctamente.');
    window.location.reload(); 
  };

  const handleSaveApiConfig = () => {
    googleDriveService.saveConfig(apiConfig);
    alert('Credenciales de Google API guardadas. El sistema intentará usarlas en la próxima conexión.');
  };

  const handleBackup = () => {
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      exportedBy: currentUser.username,
      data: {
        licenses: licenses,
        users: authService.getAllUsers(),
        auditLogs: auditService.getLogs()
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BACKUP_LICENSEMANAGER_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    auditService.log(currentUser, AuditAction.SYSTEM_BACKUP, `Descarga de respaldo: ${licenses.length} licencias`);
    
    if (onBackupComplete) {
        onBackupComplete();
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('ADVERTENCIA CRÍTICA:\n\nEsta acción SOBRESCRIBIRÁ todos los datos actuales (licencias y usuarios) con los datos del archivo de respaldo.\n\n¿Está seguro de continuar?')) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        if (!json.data || !json.data.licenses || !json.data.users) {
          throw new Error('Formato de archivo inválido');
        }

        const newLicenses = json.data.licenses;
        const newUsers = json.data.users;

        localStorage.setItem('license_manager_users', JSON.stringify(newUsers));
        onRestore(newLicenses, newUsers);
        auditService.log(currentUser, AuditAction.SYSTEM_RESTORE, `Restauración desde archivo: ${file.name}`);
        alert('Sistema restaurado correctamente.');

      } catch (error) {
        console.error(error);
        alert('Error al restaurar el archivo. Asegúrate de que sea un backup válido generado por este sistema.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportList = async (e: React.ChangeEvent<HTMLInputElement>, status: ProcessStatus) => {
      const file = e.target.files?.[0];
      if(!file) return;

      try {
          const count = await routingService.importList(file, status);
          auditService.log(currentUser, AuditAction.BULK_ACTION, `Importada Lista Madre para ${status}: ${count} RUTs`);
          alert(`Se importaron exitosamente ${count} RUTs para la lista: ${status}`);
          loadRoutingStats();
      } catch (error) {
          alert('Error al leer el archivo CSV/TXT');
      }
      e.target.value = '';
  };

  const handleClearRouting = () => {
      if(window.confirm('¿Borrar todas las listas madre de enrutamiento?')) {
          routingService.clearAll();
          loadRoutingStats();
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-10">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-6 h-6 text-slate-700" />
          Configuración del Sistema
        </h2>
        <p className="text-slate-500">Gestión de almacenamiento, nube y listas de enrutamiento.</p>
      </div>

      {/* 1. Google Drive Integration */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" /> 
              Integración Google Drive
          </h3>
          
          <div className="space-y-6">
              {/* Basic Link */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Enlace a Carpeta (Acceso Rápido)</label>
                <div className="flex gap-3">
                    <input 
                        type="text" 
                        value={driveUrl}
                        onChange={(e) => setDriveUrl(e.target.value)}
                        placeholder="https://drive.google.com/drive/folders/..."
                        className="flex-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button 
                        onClick={handleSaveDriveUrl}
                        className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                    >
                        Guardar Link
                    </button>
                </div>
              </div>

              {/* Advanced API */}
              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <Key className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-sm text-slate-700">Credenciales API (Avanzado)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Client ID</label>
                        <input 
                            type="text" 
                            value={apiConfig.clientId}
                            onChange={(e) => setApiConfig({...apiConfig, clientId: e.target.value})}
                            className="w-full p-2 border border-slate-300 rounded text-sm font-mono"
                            placeholder="xxxxxxxx.apps.googleusercontent.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">API Key</label>
                        <input 
                            type="password" 
                            value={apiConfig.apiKey}
                            onChange={(e) => setApiConfig({...apiConfig, apiKey: e.target.value})}
                            className="w-full p-2 border border-slate-300 rounded text-sm font-mono"
                            placeholder="AIzaSy..."
                        />
                    </div>
                </div>
                <button 
                    onClick={handleSaveApiConfig}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-700 transition-colors text-sm flex items-center gap-2"
                >
                    <Save className="w-4 h-4" /> Guardar Credenciales API
                </button>
              </div>
          </div>
      </div>

      {/* 2. Master Lists Routing */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> 
                    Listas Maestras de Enrutamiento
                </h3>
                <p className="text-sm text-slate-500">Sube archivos CSV/TXT con RUTs para enrutar automáticamente.</p>
            </div>
            <button onClick={handleClearRouting} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Limpiar Reglas
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Agenda Mensual */}
              <div className="p-4 border border-indigo-100 bg-indigo-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-indigo-800 text-sm">Agenda Mensual</span>
                      <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-indigo-600 border border-indigo-200">
                          {routingStats[ProcessStatus.AGENDA_MENSUAL] || 0} RUTs
                      </span>
                  </div>
                  <label className="block w-full text-center py-2 bg-white border border-indigo-200 text-indigo-600 rounded cursor-pointer hover:bg-indigo-100 text-xs font-bold transition-colors">
                      + Cargar Lista (CSV)
                      <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => handleImportList(e, ProcessStatus.AGENDA_MENSUAL)} />
                  </label>
              </div>

              {/* Agenda Placilla */}
              <div className="p-4 border border-teal-100 bg-teal-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-teal-800 text-sm">Agenda Placilla</span>
                      <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-teal-600 border border-teal-200">
                          {routingStats[ProcessStatus.AGENDA_PLACILLA] || 0} RUTs
                      </span>
                  </div>
                  <label className="block w-full text-center py-2 bg-white border border-teal-200 text-teal-600 rounded cursor-pointer hover:bg-teal-100 text-xs font-bold transition-colors">
                      + Cargar Lista (CSV)
                      <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => handleImportList(e, ProcessStatus.AGENDA_PLACILLA)} />
                  </label>
              </div>

              {/* Cambio Domicilio */}
              <div className="p-4 border border-orange-100 bg-orange-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-orange-800 text-sm">Cambio Domicilio</span>
                      <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-orange-600 border border-orange-200">
                          {routingStats[ProcessStatus.ADDRESS_CHANGE] || 0} RUTs
                      </span>
                  </div>
                  <label className="block w-full text-center py-2 bg-white border border-orange-200 text-orange-600 rounded cursor-pointer hover:bg-orange-100 text-xs font-bold transition-colors">
                      + Cargar Lista (CSV)
                      <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => handleImportList(e, ProcessStatus.ADDRESS_CHANGE)} />
                  </label>
              </div>

              {/* Sin Carpeta */}
              <div className="p-4 border border-red-100 bg-red-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-red-800 text-sm">Sin Carpeta / Perdidas</span>
                      <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-red-600 border border-red-200">
                          {routingStats[ProcessStatus.NO_FOLDER] || 0} RUTs
                      </span>
                  </div>
                  <label className="block w-full text-center py-2 bg-white border border-red-200 text-red-600 rounded cursor-pointer hover:bg-red-100 text-xs font-bold transition-colors">
                      + Cargar Lista (CSV)
                      <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => handleImportList(e, ProcessStatus.NO_FOLDER)} />
                  </label>
              </div>
          </div>
      </div>

      {/* 3. System Backup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Download className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Copia de Seguridad</h3>
            <p className="text-slate-500 text-sm mb-6">
                Descarga un archivo JSON con toda la base de datos.
            </p>
            <button 
                onClick={handleBackup}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                <Save className="w-4 h-4" />
                Descargar Backup
            </button>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">
                Zona de Peligro
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <UploadCloud className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Restaurar Sistema</h3>
            <p className="text-slate-500 text-sm mb-6">
                Sobrescribe la base de datos con un archivo previo.
            </p>
            <label className="w-full py-3 bg-white border-2 border-slate-200 hover:border-orange-400 text-slate-600 hover:text-orange-600 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <UploadCloud className="w-4 h-4" />
                Seleccionar Archivo
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleRestore}
                    accept=".json"
                    className="hidden" 
                />
            </label>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
