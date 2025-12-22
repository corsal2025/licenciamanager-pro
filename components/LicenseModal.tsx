
import React, { useState, useEffect } from 'react';
import { X, Save, User, CreditCard, Globe, Calendar, FileText, MapPin, FolderX, AlertCircle } from 'lucide-react';
import { LicenseData, LicenseStatus, ProcessStatus } from '../types';

interface LicenseModalProps {
  license: LicenseData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLicense: LicenseData) => void;
}

const LicenseModal: React.FC<LicenseModalProps> = ({ license, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<LicenseData>(license);

  useEffect(() => {
    setFormData(license);
  }, [license]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] relative animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Detalle de Registro
            </h2>
            <p className="text-sm text-slate-500">Edición de datos del conductor.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form id="license-form" onSubmit={handleSubmit} className="space-y-6">

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <User className="w-3 h-3" /> Nombre Completo
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <CreditCard className="w-3 h-3" /> RUT / ID
                </label>
                <input
                  type="text"
                  name="rut"
                  value={formData.rut}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Categoría</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ej: B, C, A2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-blue-700 uppercase flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Último Control
                </label>
                <input
                  type="text"
                  name="lastControlDate"
                  value={formData.lastControlDate}
                  onChange={handleChange}
                  placeholder="Ej: MARZO 2023"
                  className="w-full p-2.5 border border-blue-200 rounded-lg bg-blue-50/30 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Ubicación / Estado del Trámite</label>
              <select
                name="processStatus"
                value={formData.processStatus}
                onChange={handleChange}
                className="w-full p-3 bg-white border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-medium"
              >
                <option value={ProcessStatus.CONASET}>✅ Subida a CONASET</option>
                <option value="disabled" disabled>--- Clasificación ---</option>
                <option value={ProcessStatus.AGENDA_MENSUAL}>📅 Agenda Mensual</option>
                <option value={ProcessStatus.AGENDA_PLACILLA}>📍 Agenda Placilla</option>
                <option value={ProcessStatus.ADDRESS_CHANGE}>🏠 Cambio de Domicilio</option>
                <option value={ProcessStatus.UPLOADED_F8}>☁️ Subida con F8</option>
                <option value={ProcessStatus.DENIED}>⛔ Denegada</option>
                <option value="disabled" disabled>--- Alertas ---</option>
                <option value={ProcessStatus.NO_FOLDER}>❌ Sin Carpeta</option>
                <option value={ProcessStatus.URGENT}>⚠️ Urgente por Pedir</option>
                <option value="disabled" disabled>--- Otros ---</option>
                <option value={ProcessStatus.PENDING}>⏳ Pendiente (Genérico)</option>
                <option value={ProcessStatus.FIRST_LICENSE}>🚗 Primera Licencia</option>
                <option value={ProcessStatus.OFFICE_43}>🏢 En Oficina 43</option>
                <option value={ProcessStatus.IN_ARCHIVES}>🗄️ En Archivos</option>
              </select>
            </div>

            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-blue-700 uppercase flex items-center gap-2">
                <Globe className="w-3 h-3" /> Datos de Contacto (Para Notificaciones)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">Correo Electrónico</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    placeholder="nombre@ejemplo.com"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">Teléfono / Celular</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    placeholder="+56 9 1234 5678"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer Buttons */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            form="license-form"
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar Registro
          </button>
        </div>

      </div>
    </div>
  );
};

export default LicenseModal;
