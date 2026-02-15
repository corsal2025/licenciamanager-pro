import React, { useState, useEffect } from 'react';
import { notificationService, NotificationTemplate } from '../services/notificationService';
import { MessageSquare, X, Send } from 'lucide-react';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    recipientPhone: string;
    defaultTemplateId?: string;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
    isOpen,
    onClose,
    recipientName,
    recipientPhone,
    defaultTemplateId = 'ready_pickup'
}) => {
    const [selectedTemplate, setSelectedTemplate] = useState<string>(defaultTemplateId);
    const [message, setMessage] = useState('');

    // Update message when template or recipient changes
    useEffect(() => {
        if (isOpen) {
            const initialMsg = notificationService.formatMessage(selectedTemplate, recipientName);
            setMessage(initialMsg);
        }
    }, [selectedTemplate, recipientName, isOpen]);

    const handleSend = () => {
        const url = notificationService.generateWhatsAppUrl(recipientPhone, message);
        window.open(url, '_blank');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-green-600 p-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        <h3 className="font-bold">Enviar WhatsApp</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">

                    {/* Recipient Info */}
                    <div className="bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">
                        <span className="text-slate-500">Para:</span> <span className="font-semibold text-slate-700">{recipientName}</span>
                        <br />
                        <span className="text-slate-500">Teléfono:</span> <span className="font-semibold text-slate-700">{recipientPhone}</span>
                    </div>

                    {/* Template Selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Plantilla</label>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                        >
                            {notificationService.getTemplates().map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Message Editor */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mensaje (Editable)</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg h-32 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSend}
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-600/20"
                    >
                        <Send className="w-4 h-4" /> Enviar Mensaje
                    </button>
                </div>

            </div>
        </div>
    );
};

export default NotificationModal;
