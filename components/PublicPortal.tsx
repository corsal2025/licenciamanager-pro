import React, { useState } from 'react';
import { Search, ArrowLeft, CheckCircle, AlertTriangle, Clock, MapPin, XCircle, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { formatRut } from '../utils/formatters';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

    // Booking State
    const [showBooking, setShowBooking] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [slots, setSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);

    const fetchSlots = async (date: string) => {
        setLoadingSlots(true);
        setSlots([]);
        try {
            const data = await api.get(`/appointments/slots?date=${date}`);
            setSlots(data.slots);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleBook = async () => {
        if (!result) return;
        setBookingLoading(true);
        try {
            await api.post('/appointments/book', {
                rut: result.rut, // Use cleaned rut from result
                date: selectedDate,
                time: selectedTime
            });
            setBookingSuccess(true);
        } catch (e: any) {
            setError(e.message || 'Error al reservar');
            setShowBooking(false); // Close to show error
        } finally {
            setBookingLoading(false);
        }
    };

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
            const response = await fetch(`${API_URL}/public/status/${rut}`);

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
                                onChange={(e) => setRut(formatRut(e.target.value))}
                                maxLength={12}
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

                    {/* --- CAR TRACKING LOGIC --- */}
                    {result && !['DENEGADA', 'SIN CARPETA', 'EN_OBSERVACION'].includes(result.processStatus) && (
                        <div className="mt-8 pt-6 border-t border-slate-100 animate-in slide-in-from-bottom-4">
                            <h3 className="text-sm font-bold text-slate-700 mb-6 text-center">Seguimiento de tu Licencia</h3>

                            {/* Road Container */}
                            <div className="relative mb-4 mx-8 h-12">
                                {/* START Circle */}
                                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-10">
                                    <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
                                </div>

                                {/* FINISH Circle */}
                                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 z-10">
                                    <div className="w-4 h-4 bg-indigo-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                                        <span className="text-[6px]">🏁</span>
                                    </div>
                                </div>

                                {/* The Grey Road Line */}
                                <div className="h-2 bg-slate-200 rounded-full w-full absolute top-1/2 transform -translate-y-1/2 left-0 z-0"></div>

                                {/* The Blue Progress Line */}
                                <div
                                    className="h-2 bg-gradient-to-r from-green-500 to-indigo-500 rounded-full absolute top-1/2 transform -translate-y-1/2 left-0 z-0 transition-all duration-1000 ease-out"
                                    style={{
                                        width: result.processStatus === 'ENTREGADA' ? '100%' :
                                            result.processStatus === 'LISTA PARA ENTREGA' ? '85%' :
                                                ['SUBIDA A CONASET', 'AGENDA MENSUAL', 'SUBIDA CON F8', 'EN OFICINA 43'].includes(result.processStatus) ? '50%' : '15%'
                                    }}
                                ></div>

                                {/* The Car Icon */}
                                <div
                                    className="absolute top-1/2 transform -translate-y-1/2 z-20 transition-all duration-1000 ease-out"
                                    style={{
                                        left: result.processStatus === 'ENTREGADA' ? 'calc(100% - 18px)' :
                                            result.processStatus === 'LISTA PARA ENTREGA' ? '80%' :
                                                ['SUBIDA A CONASET', 'AGENDA MENSUAL', 'SUBIDA CON F8', 'EN OFICINA 43'].includes(result.processStatus) ? '45%' : '5%'
                                    }}
                                >
                                    <div className="bg-indigo-600 p-2 rounded-full shadow-lg shadow-indigo-600/40 relative">
                                        {/* Simple Car SVG */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                                            <circle cx="7" cy="17" r="2" />
                                            <circle cx="17" cy="17" r="2" />
                                        </svg>
                                        {/* Motion Lines */}
                                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 space-y-0.5">
                                            <div className="w-2 h-0.5 bg-indigo-300/50 rounded-full"></div>
                                            <div className="w-3 h-0.5 bg-indigo-300/50 rounded-full ml-1"></div>
                                        </div>
                                    </div>

                                    {/* Tooltip Label above car */}
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                        {result.processStatus}
                                    </div>
                                </div>
                            </div>

                            {/* Stages Labels - cleaner version */}
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 px-6">
                                <span className="text-green-600">Inicio</span>
                                <span>En Trámite</span>
                                <span>Por Retirar</span>
                                <span className="text-indigo-600">Entregada</span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-start gap-3 animate-in slide-in-from-bottom-2">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {result && (
                        <>
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

                                    <div className="flex items-center gap-2 text-xs font-bold bg-white/60 px-3 py-1 rounded-full">
                                        <MapPin className="w-3 h-3" />
                                        Disponible para retiro en Oficina
                                    </div>
                                    <button
                                        onClick={() => setShowBooking(true)}
                                        className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                                    >
                                        <Calendar className="w-3 h-3" />
                                        Agendar Retiro
                                    </button>

                                    {result.processStatus === 'PENDIENTE' && (
                                        <div className="text-xs italic bg-white/60 px-3 py-1 rounded-full">
                                            Tu trámite sigue en proceso normal.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Booking Section */}
                            {showBooking && (
                                <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl animate-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-indigo-600" />
                                                Reserva tu Hora de Retiro
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-1">Exclusivo para retirar documentos finalizados.</p>
                                        </div>
                                        <button onClick={() => setShowBooking(false)} className="text-slate-400 hover:text-slate-600">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {!bookingSuccess ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-1">Elige una Fecha</label>
                                                <input
                                                    type="date"
                                                    value={selectedDate}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    onChange={(e) => {
                                                        setSelectedDate(e.target.value);
                                                        fetchSlots(e.target.value);
                                                    }}
                                                    className="w-full text-sm p-2 border border-slate-300 rounded-lg"
                                                />
                                            </div>

                                            {selectedDate && (
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-2">Horarios Disponibles</label>
                                                    {loadingSlots ? (
                                                        <div className="text-center py-2"><span className="animate-spin inline-block w-4 h-4 border-2 border-indigo-500 rounded-full border-t-transparent"></span></div>
                                                    ) : (
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {slots.length > 0 ? slots.map(slot => (
                                                                <button
                                                                    key={slot}
                                                                    onClick={() => setSelectedTime(slot)}
                                                                    className={`text-xs py-2 rounded-lg border transition-all ${selectedTime === slot
                                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'
                                                                        }`}
                                                                >
                                                                    {slot}
                                                                </button>
                                                            )) : (
                                                                <p className="col-span-3 text-xs text-red-500 text-center">No hay horas para este día.</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <button
                                                onClick={handleBook}
                                                disabled={!selectedDate || !selectedTime || bookingLoading}
                                                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-2 rounded-lg transition-colors mt-2"
                                            >
                                                {bookingLoading ? 'Confirmando...' : 'Confirmar Reserva'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 space-y-2">
                                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <CheckCircle className="w-6 h-6 text-green-600" />
                                            </div>
                                            <h5 className="font-bold text-green-800">¡Reserva Exitosa!</h5>
                                            <p className="text-xs text-slate-600">
                                                Te esperamos el <strong>{selectedDate}</strong> a las <strong>{selectedTime}</strong>.
                                            </p>
                                            <p className="text-xs text-slate-400">Guarda un pantallazo de esta confirmación.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
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
