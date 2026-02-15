import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationToastProps {
  message: string;
  type: NotificationType;
  isVisible: boolean;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const Icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: AlertCircle
  };

  const Icon = Icons[type];

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transform transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} ${bgColors[type]}`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-black/5 rounded-full">
        <X className="w-4 h-4 opacity-60" />
      </button>
    </div>
  );
};

export default NotificationToast;