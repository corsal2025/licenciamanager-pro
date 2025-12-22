
import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { User as UserType, UserRole } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserType) => void;
  onPublicPortalClick?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onPublicPortalClick }) => {

  const handleDirectLogin = () => {
    // Crear usuario dummy admin
    const devUser: UserType = {
      id: 'dev-admin',
      username: 'ADMIN',
      password: '',
      fullName: 'Administrador',
      role: UserRole.ADMIN,
      createdAt: Date.now()
    };
    onLoginSuccess(devUser);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-blue-600 p-8 text-center">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">LicenseManager Pro</h1>
          <p className="text-blue-100 text-sm mt-1">Sistema de Gestión Documental</p>
        </div>

        <div className="p-8 flex-1 text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Modo de Trabajo</h2>
          <p className="text-slate-500 text-sm mb-8">
            La autenticación ha sido deshabilitada temporalmente para facilitar el desarrollo y carga de datos.
          </p>

          <button
            onClick={handleDirectLogin}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
          >
            Ingreso Directo (Admin) <ArrowRight className="w-5 h-5" />
          </button>

          <div className="mt-4">
            <button
              onClick={() => onPublicPortalClick && onPublicPortalClick()}
              className="w-full bg-indigo-50 text-indigo-700 py-3 rounded-xl font-bold hover:bg-indigo-100 transition-all border border-indigo-200"
            >
              Consultar Estado (Público)
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">Departamento de Tránsito y Licencias</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
