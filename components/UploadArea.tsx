
import React, { useCallback, useState } from 'react';
import { UploadCloud, Loader2, FileText, AlertCircle, X, CheckCircle2, File as FileIcon } from 'lucide-react';
import { api } from '../services/api';
import { routingService } from '../services/routingService';
import { LicenseData, User, ProcessStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { formatRut } from '../utils/formatters';

interface UploadAreaProps {
  onLicenseProcessed: (license: LicenseData) => void;
  currentUser: User;
}

interface FileQueueItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMsg?: string;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onLicenseProcessed, currentUser }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const [isGlobalProcessing, setIsGlobalProcessing] = useState(false);

  const processQueue = async (queue: FileQueueItem[]) => {
    setIsGlobalProcessing(true);

    for (const item of queue) {
      if (item.status !== 'pending') continue;

      setFileQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i));

      try {
        const formData = new FormData();
        formData.append('file', item.file);

        // Call Backend AI Service
        // Note: currentUser might not have token in props, assume global or handled by api wrapper if state management was better. A
        // Actually api.ts needs token. App.tsx passes currentUser but not token string directly here usually.
        // For now, assuming no auth or handling it gracefully.
        // Wait, typical pattern here: api.upload('/ai/analyze', formData).
        // Let's import { api } from '../services/api';

        // We need to import api first. I will add import in a separate block if I can't do it here. 
        // Logic:
        const extractedData = await api.upload('/ai/analyze', formData);

        // extractedData will match the backend response structure
        const cleanRut = extractedData.rut ? formatRut(extractedData.rut) : '';

        // Routing Logic
        let targetStatus = ProcessStatus.PENDING; // Default for manual upload
        const routedStatus = routingService.resolveStatus(cleanRut);
        if (routedStatus) {
          targetStatus = routedStatus;
        } else if (extractedData.processStatus) {
          // Use AI inferred status if no master list rule
          targetStatus = extractedData.processStatus;
        }

        const newLicense: LicenseData = {
          id: uuidv4(),
          fullName: extractedData.fullName || 'Desconocido',
          rut: cleanRut || 'N/A',
          licenseNumber: extractedData.licenseNumber || 'N/A',
          category: extractedData.category || 'N/A',
          issueDate: extractedData.issueDate || new Date().toISOString(),
          lastControlDate: extractedData.lastControlDate || 'N/A',
          expirationDate: extractedData.expirationDate || new Date().toISOString(),
          issuingAuthority: extractedData.issuingAuthority || 'N/A',
          country: extractedData.country || 'N/A',
          status: extractedData.status || 'VIGENTE',
          processStatus: targetStatus,
          uploadDate: Date.now(),
          uploadedBy: currentUser.username
        } as LicenseData;

        onLicenseProcessed(newLicense);

        setFileQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'success' } : i));

      } catch (err) {
        setFileQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', errorMsg: 'Fallo al analizar' } : i));
      }
    }

    setIsGlobalProcessing(false);
  };

  const handleFiles = (files: FileList | File[]) => {
    const newItems: FileQueueItem[] = Array.from(files).map(file => ({
      id: uuidv4(),
      file,
      status: 'pending'
    }));

    setFileQueue(prev => {
      const updated = [...prev, ...newItems];
      setTimeout(() => processQueue(newItems), 100);
      return updated;
    });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const clearQueue = () => {
    setFileQueue([]);
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`h-64 relative border-3 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer group
            ${isDragging
              ? 'border-blue-500 bg-blue-50 scale-[1.02]'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50 bg-white'
            }`}
        >
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8 text-blue-600" />
          </div>

          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            Carga Manual
          </h3>
          <p className="text-slate-500 text-sm px-8">
            Arrastra imágenes o PDFs sueltos.
          </p>
          <p className="text-xs text-slate-400 mt-2">El sistema aplicará reglas de enrutamiento si existen</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-96 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            Cola de Procesamiento
          </h3>
          {fileQueue.length > 0 && (
            <button onClick={clearQueue} className="text-xs text-red-500 hover:text-red-700 font-medium">
              Limpiar
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {fileQueue.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm text-center">
              <FileIcon className="w-8 h-8 mb-2 opacity-20" />
              <p>No hay archivos en cola.</p>
            </div>
          ) : (
            fileQueue.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="p-2 bg-white rounded-md border border-slate-200">
                  {item.file.type === 'application/pdf' ? (
                    <FileText className="w-5 h-5 text-red-500" />
                  ) : (
                    <FileIcon className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{item.file.name}</p>
                  <p className="text-xs text-slate-400">{(item.file.size / 1024).toFixed(0)} KB</p>
                </div>

                <div className="shrink-0">
                  {item.status === 'pending' && <span className="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-200 rounded">En espera</span>}
                  {item.status === 'processing' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                  {item.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {item.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>
            ))
          )}
        </div>

        {isGlobalProcessing && (
          <div className="mt-4 text-center text-xs text-slate-500 animate-pulse">
            Analizando documento y aplicando reglas...
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadArea;
