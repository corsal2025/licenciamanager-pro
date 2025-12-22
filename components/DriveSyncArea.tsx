
import React, { useState, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Search, FileText, UploadCloud, ArrowRight, Database, Loader2, Split, Zap, CloudLightning } from 'lucide-react';
import { LicenseData, ProcessStatus, User, LicenseStatus } from '../types';
import { analyzeLicenseDocument } from '../services/geminiService';
import { routingService } from '../services/routingService';
import { googleDriveService } from '../services/googleDriveService';
import { v4 as uuidv4 } from 'uuid';
import { formatRut } from '../utils/formatters';

interface DriveSyncAreaProps {
    licenses: LicenseData[];
    driveFolderUrl?: string;
    onLicenseUpdate?: (license: LicenseData) => void;
    onLicenseCreate?: (license: LicenseData) => void;
    currentUser: User;
}

interface ProcessedFile {
    id: string;
    fileName: string;
    status: 'pending' | 'analyzing' | 'matched' | 'new' | 'error';
    extractedData?: Partial<LicenseData>;
    matchedLicenseId?: string;
    message?: string;
    assignedStatus?: ProcessStatus;
}

const DriveSyncArea: React.FC<DriveSyncAreaProps> = ({
    licenses,
    driveFolderUrl,
    onLicenseUpdate,
    onLicenseCreate,
    currentUser
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isScanningCloud, setIsScanningCloud] = useState(false);

    // Manejo de archivos manuales (Arrastrar y soltar)
    const handleFiles = async (files: FileList | File[]) => {
        const newFiles: ProcessedFile[] = Array.from(files).map(f => ({
            id: uuidv4(),
            fileName: f.name,
            status: 'pending'
        }));

        setProcessedFiles(prev => [...newFiles, ...prev]);
        await processQueue(Array.from(files), newFiles);
    };

    // Escaneo Automático (Simulado)
    const handleAutoScan = async () => {
        setIsScanningCloud(true);
        try {
            // Usamos el servicio para "traer" archivos de la nube
            const files = await googleDriveService.simulateScan();

            const newFiles: ProcessedFile[] = files.map(f => ({
                id: uuidv4(),
                fileName: `[CLOUD] ${f.name}`,
                status: 'pending'
            }));

            setProcessedFiles(prev => [...newFiles, ...prev]);

            // Procesamos estos archivos simulados
            await processQueue(files, newFiles);

        } catch (error) {
            console.error("Error scanning cloud", error);
            alert("Error al conectar con Google Drive. Verifique su conexión.");
        } finally {
            setIsScanningCloud(false);
        }
    };

    // Helper para generar datos simulados basados en el nombre del archivo
    // Esto evita llamar a la IA con archivos vacíos/falsos que provocarían error
    const getSimulatedData = (fileName: string): Partial<LicenseData> => {
        if (fileName.includes("Juan_Perez")) {
            return { fullName: "Juan Perez Gonzalez", rut: "12.345.678-9", category: "B", lastControlDate: "2023-05" };
        }
        if (fileName.includes("Maria_Gonzalez")) {
            return { fullName: "Maria Gonzalez Tapia", rut: "15.443.221-3", category: "C", lastControlDate: "2024-01" };
        }
        if (fileName.includes("Pedro_Soto")) {
            return { fullName: "Pedro Soto Soto", rut: "9.876.543-K", category: "A2", lastControlDate: "2022-11", processStatus: ProcessStatus.AGENDA_PLACILLA };
        }
        if (fileName.includes("Ana_Rojas")) {
            return { fullName: "Ana Rojas Diaz", rut: "18.998.776-5", category: "B", lastControlDate: "2023-08", processStatus: ProcessStatus.ADDRESS_CHANGE };
        }
        if (fileName.includes("Luis_Torres")) {
            return { fullName: "Luis Torres Manriquez", rut: "10.554.332-1", category: "D", lastControlDate: "2024-02" };
        }
        // Fallback random
        return {
            fullName: "Usuario Simulado Drive",
            rut: `${Math.floor(Math.random() * 10000000)}-${Math.floor(Math.random() * 9)}`,
            category: "B",
            lastControlDate: "2024-03"
        };
    };

    const processQueue = async (rawFiles: File[], queueItems: ProcessedFile[]) => {
        setIsProcessing(true);

        for (let i = 0; i < rawFiles.length; i++) {
            const file = rawFiles[i];
            const item = queueItems[i];

            updateItemStatus(item.id, 'analyzing');

            try {
                let extracted: Partial<LicenseData>;

                // CRITICAL FIX: Detectar si es un archivo simulado por el nombre o el prefijo que pusimos
                const isSimulated = item.fileName.includes('[CLOUD]') ||
                    file.name.startsWith("Scan_") ||
                    file.name.startsWith("Licencia_") ||
                    file.name.startsWith("Pendiente_") ||
                    file.name.startsWith("Cambio_") ||
                    file.name.startsWith("Control_");

                if (isSimulated) {
                    // Simular tiempo de red de la IA
                    await new Promise(r => setTimeout(r, 1500));
                    extracted = getSimulatedData(file.name);
                } else {
                    // Archivo real subido manualmente -> Enviar al Backend (Drive Simulado) Y Analizar
                    // 1. Subir al "Drive" (Backend)
                    await googleDriveService.uploadFile(file, currentUser.username);

                    // 2. Analizar con Gemini (Client-side por ahora, idealmente el backend lo haría)
                    const base64Data = await fileToBase64(file);
                    extracted = await analyzeLicenseDocument(base64Data, file.type);
                }

                const cleanRut = extracted.rut ? formatRut(extracted.rut) : '';

                // 1. DETERMINE STATUS FROM ROUTING SERVICE OR EXTRACTION
                let targetStatus = ProcessStatus.CONASET;
                let routingMessage = "Subido a CONASET (Por defecto)";

                const routedStatus = routingService.resolveStatus(cleanRut);

                if (routedStatus) {
                    targetStatus = routedStatus;
                    routingMessage = `Enrutado a: ${routedStatus}`;
                } else if (extracted.processStatus) {
                    targetStatus = extracted.processStatus;
                    routingMessage = `Detectado por IA: ${targetStatus}`;
                }

                // 2. Check DB
                const existingLicense = licenses.find(l =>
                    (cleanRut && cleanRut.length > 3 && l.rut === cleanRut) ||
                    (extracted.fullName && l.fullName.toLowerCase() === extracted.fullName.toLowerCase())
                );

                if (existingLicense && onLicenseUpdate) {
                    const updatedLicense: LicenseData = {
                        ...existingLicense,
                        processStatus: targetStatus,
                        category: extracted.category || existingLicense.category,
                        lastControlDate: extracted.lastControlDate || existingLicense.lastControlDate
                    };
                    onLicenseUpdate(updatedLicense);

                    updateItemStatus(item.id, 'matched', {
                        extractedData: extracted,
                        assignedStatus: targetStatus,
                        message: `Actualizado. ${routingMessage}`
                    });

                } else {
                    if (onLicenseCreate) {
                        const newLicense: LicenseData = {
                            id: uuidv4(),
                            fullName: extracted.fullName || 'Desconocido',
                            rut: cleanRut || 'N/A',
                            licenseNumber: extracted.licenseNumber || 'N/A',
                            category: extracted.category || 'N/A',
                            issueDate: new Date().toISOString(),
                            lastControlDate: extracted.lastControlDate || 'N/A',
                            expirationDate: new Date().toISOString(),
                            issuingAuthority: 'Dirección de Tránsito',
                            country: 'Chile',
                            status: extracted.status || LicenseStatus.VALID,
                            processStatus: targetStatus,
                            uploadDate: Date.now(),
                            uploadedBy: currentUser.username
                        };
                        onLicenseCreate(newLicense);

                        updateItemStatus(item.id, 'new', {
                            extractedData: extracted,
                            assignedStatus: targetStatus,
                            message: `Nuevo Registro. ${routingMessage}`
                        });
                    }
                }

            } catch (error) {
                console.error("Error processing file:", file.name, error);
                updateItemStatus(item.id, 'error', { message: 'Error al procesar archivo' });
            }
        }
        setIsProcessing(false);
    };

    const updateItemStatus = (id: string, status: ProcessedFile['status'], updates?: Partial<ProcessedFile>) => {
        setProcessedFiles(prev => prev.map(item =>
            item.id === id ? { ...item, status, ...updates } : item
        ));
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Database className="w-6 h-6 text-blue-600" />
                        Sincronización Inteligente
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Conecta tu nube o arrastra carpetas para procesar masivamente.
                    </p>
                </div>
                {driveFolderUrl && (
                    <a
                        href={driveFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
                    >
                        <UploadCloud className="w-4 h-4" /> Abrir Carpeta Drive (Web)
                    </a>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manual Drop Zone */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    className={`h-56 relative border-3 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer group
                ${isDragging
                            ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50 bg-white'
                        }`}
                >
                    <input
                        type="file"
                        accept="application/pdf"
                        multiple
                        onChange={(e) => e.target.files && handleFiles(e.target.files)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Split className={`w-7 h-7 text-blue-600 ${isProcessing ? 'animate-spin' : ''}`} />
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                        Carga Manual (Drag & Drop)
                    </h3>
                    <p className="text-slate-500 text-sm px-4">
                        Arrastra carpetas completas de archivos escaneados aquí.
                    </p>
                </div>

                {/* Auto Cloud Scan */}
                <div className="h-56 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CloudLightning className="w-32 h-32" />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            <h3 className="font-bold text-lg">Automatización Drive</h3>
                        </div>
                        <p className="text-slate-300 text-sm">
                            El sistema se conectará a tu cuenta de Google Drive, buscará archivos PDF nuevos y los procesará automáticamente.
                        </p>
                    </div>

                    <button
                        onClick={handleAutoScan}
                        disabled={isScanningCloud || isProcessing}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/50"
                    >
                        {isScanningCloud ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Conectando a Nube...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-5 h-5" /> Escanear Nube Automáticamente
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Results Area */}
            {processedFiles.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Search className="w-4 h-4" /> Cola de Procesamiento
                        </h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                            {processedFiles.length} archivos
                        </span>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3">Archivo</th>
                                    <th className="px-6 py-3">Estado</th>
                                    <th className="px-6 py-3">Acción Tomada</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {processedFiles.map(file => (
                                    <tr key={file.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {file.fileName.includes('[CLOUD]') ? (
                                                    <CloudLightning className="w-4 h-4 text-blue-500 shrink-0" />
                                                ) : (
                                                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-700 truncate max-w-xs" title={file.fileName}>
                                                        {file.fileName.replace('[CLOUD] ', '')}
                                                    </span>
                                                    {(file.status === 'matched' || file.status === 'new') && (
                                                        <span className="text-xs text-slate-500 font-mono mt-1">{file.extractedData?.rut}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {file.status === 'pending' && <span className="text-slate-400 text-xs">En cola...</span>}
                                            {file.status === 'analyzing' && (
                                                <div className="flex items-center gap-2 text-blue-600 text-xs font-bold">
                                                    <Loader2 className="w-3 h-3 animate-spin" /> Analizando...
                                                </div>
                                            )}
                                            {file.status === 'matched' && <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded border border-green-100">Actualizado</span>}
                                            {file.status === 'new' && <span className="text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded border border-blue-100">Nuevo</span>}
                                            {file.status === 'error' && <span className="text-red-500 text-xs font-bold">Error</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {file.assignedStatus ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                                                    <ArrowRight className="w-3 h-3" /> {file.assignedStatus}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
                                            {file.message && <div className="text-[10px] text-slate-400 mt-1">{file.message}</div>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriveSyncArea;
