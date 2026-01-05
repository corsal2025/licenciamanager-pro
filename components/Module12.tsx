import React, { useState } from 'react';
import { Box, Send, Mail, CheckCircle, Search, MessageSquare, Phone, User as UserIcon, FileText } from 'lucide-react';
import { LicenseData, ProcessStatus, User } from '../types';
import { reportService } from '../services/reportService';
import NotificationModal from './NotificationModal';
import confetti from 'canvas-confetti';

interface Module12Props {
  licenses: LicenseData[];
  onUpdateStatus: (id: string, status: ProcessStatus) => void;
  currentUser?: User;
}

const Module12: React.FC = () => {
  return (
    <div className="p-8 text-center text-slate-500">
      Cargando Módulo de Entregas...
    </div>
  );
};

export const DeliveryModule: React.FC<Module12Props> = ({ licenses, onUpdateStatus, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // State for Notification Modal
  const [notificationModal, setNotificationModal] = useState<{
    isOpen: boolean;
    recipientName: string;
    recipientPhone: string;
  }>({ isOpen: false, recipientName: '', recipientPhone: '' });

  // Filter: ONLY Licenses ready for pickup
  const readyLicenses = licenses.filter(l =>
    l.processStatus === ProcessStatus.READY_FOR_PICKUP &&
    (l.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.rut.includes(searchTerm))
  );

  const handleWhatsApp = (phone: string | undefined, name: string) => {
    if (!phone) return;
    setNotificationModal({
      isOpen: true,
      recipientName: name,
      recipientPhone: phone
    });
  };

  const handleEmail = (email: string | undefined) => {
    if (!email) return;
    window.location.href = `mailto:${email}?subject=Licencia Lista para Retiro&body=Estimado usuario, su licencia está lista.`;
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Box className="w-6 h-6 text-indigo-600" />
              Centro de Entregas
            </h2>
            <p className="text-slate-500">Gestión de licencias listas y notificaciones a usuarios.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => reportService.generateDeliveryList(readyLicenses)}
              disabled={readyLicenses.length === 0}
              className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" /> Nómina de Entrega
            </button>
            <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold">
              {readyLicenses.length} Pendientes de Retiro
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o RUT..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {readyLicenses.length > 0 ? (
            readyLicenses.map(license => (
              <div key={license.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800">{license.fullName}</h3>
                      <p className="text-sm text-slate-500">{license.rut}</p>
                    </div>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                      Lista
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded">
                      <Phone className="w-4 h-4 text-slate-400" />
                      {license.phone ? (
                        <span>{license.phone}</span>
                      ) : (
                        <span className="text-slate-400 italic">Sin teléfono</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {license.email ? (
                        <span className="truncate">{license.email}</span>
                      ) : (
                        <span className="text-slate-400 italic">Sin correo</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleWhatsApp(license.phone, license.fullName)}
                      disabled={!license.phone}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-colors ${license.phone
                        ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                        : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                        }`}
                      title="Notificar por WhatsApp"
                    >
                      <MessageSquare className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-bold">WSP</span>
                    </button>

                    <button
                      onClick={() => handleEmail(license.email)}
                      disabled={!license.email}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-colors ${license.email
                        ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                        }`}
                      title="Notificar por Email"
                    >
                      <Mail className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-bold">Correo</span>
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`¿Confirmar entrega a ${license.fullName}?`)) {
                          onUpdateStatus(license.id, ProcessStatus.DELIVERED);
                          confetti({
                            particleCount: 150,
                            spread: 70,
                            origin: { y: 0.6 },
                            zIndex: 9999
                          });
                        }
                      }}
                      className="flex flex-col items-center justify-center p-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      title="Marcar como Entregada"
                    >
                      <CheckCircle className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-bold">Entregar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Box className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-600">No hay licencias para entrega</h3>
              <p className="text-slate-400">Las licencias listas aparecerán aquí para notificar a los usuarios.</p>
            </div>
          )}
        </div>
      </div>

      <NotificationModal
        isOpen={notificationModal.isOpen}
        onClose={() => setNotificationModal(prev => ({ ...prev, isOpen: false }))}
        recipientName={notificationModal.recipientName}
        recipientPhone={notificationModal.recipientPhone}
      />
    </>
  );
};

export default Module12;
