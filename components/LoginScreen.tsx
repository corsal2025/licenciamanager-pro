
import React, { useState } from 'react';
import { ShieldCheck, User, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { User as UserType, UserRole } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface LoginScreenProps {
  onLoginSuccess: (user: UserType) => void;
  onPublicPortalClick?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onPublicPortalClick }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(`${API_URL}/token`, {
        method: 'POST',
        body: formData,
      });


      if (!response.ok) {
        throw new Error('Credenciales incorrectas');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);

      // In a real app we would decode the token or fetch /users/me
      // For now we construct the user object assuming admin/admin logic matches
      // But let's fetch the user details properly if we can, or simulate for now

      // Fetch user role/details (Simulation based on successful login)
      // Ideally we would have a /users/me endpoint.
      // Let's assume username is the ID for now as per backend logic

      const loggedUser: UserType = {
        id: username,
        username: username,
        password: '', // Don't store
        fullName: username === 'admin' ? 'Administrador' : username,
        role: username === 'admin' ? UserRole.ADMIN : UserRole.USER,
        createdAt: Date.now()
      };

      onLoginSuccess(loggedUser);

    } catch (err) {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
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

        <div className="p-8 flex-1">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Iniciar Sesión</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 block w-full rounded-lg border-slate-300 border focus:ring-blue-500 focus:border-blue-500 p-2.5"
                  placeholder="Ej. admin"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 block w-full rounded-lg border-slate-300 border focus:ring-blue-500 focus:border-blue-500 p-2.5"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
                </>
              ) : (
                'Ingresar al Sistema'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => onPublicPortalClick && onPublicPortalClick()}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              Consultar Estado (Acceso Público)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
