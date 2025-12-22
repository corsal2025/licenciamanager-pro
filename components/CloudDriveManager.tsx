import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Folder, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  RefreshCw, 
  Server, 
  User, 
  ArrowRight, 
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { googleDriveService, DriveFolder, DriveFile, DRIVE_FOLDERS } from '../services/googleDriveService';

const FileItem: React.FC<{ file: DriveFile, icon: any, color: string }> = ({ file, icon: Icon, color }) => (
  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm mb-2 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 overflow-hidden">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
        <p className="text-xs text-slate-400">{new Date(file.createdTime || '').toLocaleDateString()}</p>
      </div>
    </div>
  </div>
);

const CloudDriveManager: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true); // Simulating always connected
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  const [folders, setFolders] = useState<{
    pending: DriveFolder | null;
    excel: DriveFolder | null;
    conaset: DriveFolder | null;
  }>({ pending: null, excel: null, conaset: null });

  const fetchDriveData = async () => {
    setIsLoading(true);
    try {
      const data = await googleDriveService.getSystemFolders();
      setFolders(data);
      setLastSync(new Date());
    } catch (error) {
      console.error("Error fetching drive data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDriveData();
    // Simulate auto-sync every 30 seconds
    const interval = setInterval(fetchDriveData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleProcessFile = async (fileId: string, fileName: string) => {
    // Logic to move file to Conaset folder
    await googleDriveService.moveToConaset(fileId, fileName);
    fetchDriveData(); // Refresh
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Status */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
              <Cloud className="w-6 h-6 text-blue-600" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Conexión Google Drive</h2>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span className="text-green-600 font-medium">En Línea</span> • Sincronización Automática Activa
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-xs text-slate-400">Última sincronización</p>
            <p className="text-sm font-medium text-slate-700">
              {lastSync ? lastSync.toLocaleTimeString() : 'Pendiente...'}
            </p>
          </div>
          <button 
            onClick={fetchDriveData}
            disabled={isLoading}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Pending Scans */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col h-[600px]">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">1. Escaneadas Pendientes</h3>
              <p className="text-xs text-slate-500">{DRIVE_FOLDERS.PENDING}</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {folders.pending?.subfolders?.map(folder => (
              <div key={folder.id} className="bg-white/50 rounded-xl p-3 border border-slate-200/50">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{folder.name}</span>
                  <span className="ml-auto text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">{folder.files.length}</span>
                </div>
                <div className="space-y-2">
                  {folder.files.map(file => (
                    <FileItem key={file.id} file={file} icon={FileText} color="bg-orange-500" />
                  ))}
                  {folder.files.length === 0 && (
                    <p className="text-xs text-center text-slate-400 py-2 italic">Carpeta vacía</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Excel Database */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col h-[600px]">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">2. Base de Datos Excel</h3>
              <p className="text-xs text-slate-500">{DRIVE_FOLDERS.EXCEL}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
              <p className="text-xs text-blue-700 mb-2">
                Estos archivos se usan como "Lista Madre" para comparar con los PDFs escaneados.
              </p>
            </div>
            {folders.excel?.files.map(file => (
              <FileItem key={file.id} file={file} icon={FileSpreadsheet} color="bg-green-500" />
            ))}
             {folders.excel?.files.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                  <FileSpreadsheet className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No hay archivos Excel</p>
                </div>
              )}
          </div>
        </div>

        {/* Column 3: Uploaded to Conaset */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col h-[600px]">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">3. Subidas a CONASET</h3>
              <p className="text-xs text-slate-500">{DRIVE_FOLDERS.CONASET}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
             <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-700">
                Archivos procesados y movidos automáticamente.
              </p>
            </div>
            {folders.conaset?.files.map(file => (
              <FileItem key={file.id} file={file} icon={CheckCircle2} color="bg-blue-500" />
            ))}
             {folders.conaset?.files.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                  <ShieldCheck className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Aún no hay archivos procesados</p>
                </div>
              )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CloudDriveManager;
