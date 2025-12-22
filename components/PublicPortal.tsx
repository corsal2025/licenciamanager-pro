import React, { useState } from 'react';
import { Search, ArrowLeft, CheckCircle, AlertTriangle, Clock, MapPin, XCircle } from 'lucide-react';
import { api } from '../services/api';

interface PublicStatus {
    rut: string;
    fullName: string;
    processStatus: string;
    lastUpdate: string;
}

interface PublicPortalProps {
    onBack: () => void;
}

const PublicPortal: React.FC<PublicPortalProps> = ({ onBack }) => {
    const [rut, setRut] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PublicStatus | null>(null);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rut) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            // Direct fetch to avoid auth header issues if api wrapper enforces it
            // But assuming we can make a public request. 
            // Let's try standard fetch first for safety against auth interceptors entanglements
            const response = await fetch(`http://localhost:8000/public/status/${rut}`);

            if (!response.ok) {
                if (response.status === 404) throw new Error("RUT no encontrado en nuestros registros.");
                throw new Error("Error de conexión");
            }

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error al buscar');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        if (status === 'LISTA PARA ENTREGA') return 'bg-green-100 text-green-700 border-green-200';
        if (status === 'DENEGADA' || status === 'SIN CARPETA') return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-blue-50 text-blue-700 border-blue-200';
    };

    const getStatusIcon = (status: string) => {
        if (status === 'LISTA PARA ENTREGA') return <CheckCircle className="w-12 h-12 text-green-500" />;
        if (status === 'DENEGADA') return <XCircle className="w-12 h-12 text-red-500" />;
        return <Clock className="w-12 h-12 text-blue-500" />;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-black flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8">
                    <button
                        onClick={onBack}
                        className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver al Inicio
                    </button>

                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Consulta Tu Licencia</h2>
                        <p className="text-slate-500 mt-2">Ingresa tu RUT para revisar el estado de tu trámite sin necesidad de clave.</p>
                    </div>

                    <form onSubmit={handleSearch} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">RUT (Con puntos y guión)</label>
                            <input
                                type="text"
                                placeholder="Ej: 12.345.678-9"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                value={rut}
                                onChange={(e) => setRut(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !rut}
                            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : 'Consultar Estado'}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-start gap-3 animate-in slide-in-from-bottom-2">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {result && (
                        <div className="mt-8 pt-8 border-t border-slate-100 animate-in slide-in-from-bottom-4">
                            <div className={`p-6 rounded-xl border ${getStatusColor(result.processStatus)} flex flex-col items-center text-center space-y-4`}>
                                {getStatusIcon(result.processStatus)}

                                <div>
                                    <h3 className="text-lg font-bold">Estado: {result.processStatus}</h3>
                                    <p className="text-sm opacity-80 mt-1">Titular: {result.fullName}</p>
                                </div>

                                <div className="bg-white/50 w-full py-2 rounded-lg text-xs font-mono">
                                    Última Act.: {new Date(parseInt(result.lastUpdate) * 1000).toLocaleDateString()}
                                </div>

                                {result.processStatus === 'LISTA PARA ENTREGA' && (
                                    <div className="flex items-center gap-2 text-xs font-bold bg-white/60 px-3 py-1 rounded-full">
                                        <MapPin className="w-3 h-3" />
                                        Disponible para retiro en Oficina
                                    </div>
                                )}
                                {result.processStatus === 'PENDIENTE' && (
                                    <div className="text-xs italic bg-white/60 px-3 py-1 rounded-full">
                                        Tu trámite sigue en proceso normal.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-100">
                    LicenciaManager Pro • Sistema de Consulta Oficial
                </div>
            </div>
        </div>
    );
};

export default PublicPortal;
