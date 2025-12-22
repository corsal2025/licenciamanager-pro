import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, RefreshCw, FileText } from 'lucide-react';
import { excelService } from '../services/excelService';
import { LicenseData, ProcessStatus } from '../types';
import { googleDriveService } from '../services/googleDriveService';
import { analyzeLicenseDocument } from '../services/geminiService';

interface ComparisonViewProps {
  onUpdateLicenses: (licenses: LicenseData[]) => void;
  currentLicenses: LicenseData[];
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ onUpdateLicenses, currentLicenses }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [masterList, setMasterList] = useState<LicenseData[]>([]);
  const [driveFiles, setDriveFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [matches, setMatches] = useState<{rut: string, file: string, status: string}[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      addLog(`Leyendo archivo Excel: ${file.name}...`);
      const data = await excelService.parseExcelFile(file);
      setMasterList(data);
      addLog(`✅ Excel procesado. ${data.length} registros encontrados.`);
      setStep(2);
    } catch (error) {
      addLog(`❌ Error al leer Excel: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectDrive = async () => {
    setIsProcessing(true);
    addLog("Conectando con Google Drive...");
    try {
      // En una implementación real, aquí iría el flujo OAuth
      // Por ahora usamos la simulación mejorada
      const files = await googleDriveService.simulateScan();
      setDriveFiles(files);
      addLog(`✅ Conexión exitosa. ${files.length} archivos PDF encontrados en la carpeta.`);
      setStep(3);
    } catch (error) {
      addLog("❌ Error conectando a Drive");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartComparison = async () => {
    setIsProcessing(true);
    addLog("🚀 Iniciando cruce de información...");
    
    const newMatches = [];
    const updatedLicenses = [...currentLicenses];

    for (const file of driveFiles) {
      addLog(`Analizando archivo: ${file.name}...`);
      
      // 1. Convertir a Base64 para Gemini
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;
      const base64Content = base64Data.split(',')[1];

      // 2. Analizar con Gemini
      try {
        const analysis = await analyzeLicenseDocument(base64Content, file.type);
        
        if (analysis.rut) {
            addLog(`   🔍 RUT detectado: ${analysis.rut}`);
            
            // 3. Buscar en Lista Madre (Excel)
            const match = masterList.find(l => l.rut.replace(/\./g, '').includes(analysis.rut?.replace(/\./g, '') || 'XYZ'));
            
            if (match) {
                addLog(`   ✅ COINCIDENCIA: ${match.fullName} (Estado: ${match.processStatus})`);
                newMatches.push({ rut: analysis.rut, file: file.name, status: 'MATCH' });
                
                // Actualizar estado si es necesario o agregar si no existe en el sistema actual
                // Aquí podrías fusionar la info del Excel con la del PDF
            } else {
                addLog(`   ⚠️ No está en la lista Excel.`);
                newMatches.push({ rut: analysis.rut, file: file.name, status: 'NO_MATCH' });
            }
        } else {
            addLog(`   ❓ No se pudo leer el RUT en ${file.name}`);
        }

      } catch (err) {
        addLog(`   ❌ Error analizando PDF: ${err}`);
      }
    }

    setMatches(newMatches);
    setIsProcessing(false);
    addLog("🏁 Proceso finalizado.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Cruce de Información (Drive vs Excel)</h2>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">1</div>
            <span>Cargar Excel</span>
        </div>
        <ArrowRight className="text-slate-300" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">2</div>
            <span>Conectar Drive</span>
        </div>
        <ArrowRight className="text-slate-300" />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">3</div>
            <span>Procesar</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Actions */}
        <div className="space-y-6">
            
            {/* Step 1: Excel */}
            <div className={`bg-white p-6 rounded-xl border ${step === 1 ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                    <FileSpreadsheet className="w-6 h-6 text-green-600" />
                    <h3 className="font-bold text-lg">1. Lista Madre (Excel)</h3>
                </div>
                <p className="text-sm text-slate-500 mb-4">Sube el archivo Excel con la nómina de licencias en trámite.</p>
                
                {masterList.length > 0 ? (
                    <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">{masterList.length} registros cargados</span>
                    </div>
                ) : (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                        />
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-600">Clic para subir Excel</p>
                    </div>
                )}
            </div>

            {/* Step 2: Drive */}
            <div className={`bg-white p-6 rounded-xl border ${step === 2 ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'} ${step < 2 ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-3 mb-4">
                    <RefreshCw className="w-6 h-6 text-blue-600" />
                    <h3 className="font-bold text-lg">2. Escaneos (Google Drive)</h3>
                </div>
                <p className="text-sm text-slate-500 mb-4">Conecta con la carpeta de Drive donde están los PDFs escaneados.</p>
                
                {driveFiles.length > 0 ? (
                    <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">{driveFiles.length} archivos encontrados</span>
                    </div>
                ) : (
                    <button 
                        onClick={handleConnectDrive}
                        disabled={isProcessing}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {isProcessing ? 'Conectando...' : 'Conectar Google Drive'}
                    </button>
                )}
            </div>

            {/* Step 3: Process */}
            <div className={`bg-white p-6 rounded-xl border ${step === 3 ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'} ${step < 3 ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-purple-600" />
                    <h3 className="font-bold text-lg">3. Comparación Inteligente</h3>
                </div>
                <p className="text-sm text-slate-500 mb-4">La IA leerá cada PDF y buscará su RUT en la lista Excel.</p>
                
                <button 
                    onClick={handleStartComparison}
                    disabled={isProcessing}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                >
                    {isProcessing ? 'Analizando...' : 'Iniciar Análisis IA'}
                </button>
            </div>

        </div>

        {/* Right Panel: Logs & Results */}
        <div className="bg-slate-900 text-slate-300 p-6 rounded-xl font-mono text-sm h-[600px] overflow-y-auto shadow-2xl">
            <h3 className="text-white font-bold mb-4 border-b border-slate-700 pb-2">Registro de Actividad</h3>
            <div className="space-y-2">
                {logs.length === 0 && <p className="text-slate-600 italic">Esperando inicio del proceso...</p>}
                {logs.map((log, i) => (
                    <div key={i} className="break-words">
                        {log}
                    </div>
                ))}
                <div id="log-end"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;
