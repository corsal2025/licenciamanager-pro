
import React from 'react';
import { LayoutDashboard, Upload, List, LogOut, ShieldCheck, Users, BarChart3, RefreshCw, ShieldAlert, Settings, Save, AlertOctagon, CloudOff, Map, FileSearch, Package, FileSpreadsheet, Box, ShoppingCart as ShoppingCartIcon } from 'lucide-react';

import { ViewMode, User, UserRole, SystemHealth } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
  currentUser: User;
  onLogout: () => void;
  systemHealth?: SystemHealth;
  driveLink?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, currentUser, onLogout, systemHealth, driveLink }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAdmin: false },
    { id: 'upload', label: 'Subir Licencia', icon: Upload, requiresAdmin: false },
    { id: 'drive-sync', label: 'Sincronización Drive', icon: RefreshCw, requiresAdmin: false },
    { id: 'folder-finder', label: 'Localizador Carpetas', icon: FileSearch, requiresAdmin: false },
    { id: 'comparison', label: 'Cruce Excel/Drive', icon: FileSpreadsheet, requiresAdmin: false },
    { id: 'list', label: 'Registro', icon: List, requiresAdmin: false },

    { id: 'analytics', label: 'Estadísticas', icon: BarChart3, requiresAdmin: false },
    { id: 'module-16', label: 'Módulo 16', icon: Package, requiresAdmin: false },
    { id: 'module-12', label: 'Módulo 12', icon: Box, requiresAdmin: false },
    { id: 'purchases', label: 'Compras y Pedidos', icon: ShoppingCartIcon, requiresAdmin: false },

    // Admin Section
    { id: 'users', label: 'Usuarios', icon: Users, requiresAdmin: true },
    { id: 'audit', label: 'Auditoría', icon: ShieldAlert, requiresAdmin: true },
    { id: 'settings', label: 'Configuración', icon: Settings, requiresAdmin: true },
  ];

  const savedDriveLink = driveLink || localStorage.getItem('drive_folder_url');

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 shadow-2xl z-50 transition-all duration-300">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tight">License<span className="text-blue-400">Pro</span></h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Manager System</p>
        </div>
      </div>

      <div className="px-6 py-6 border-b border-slate-800/50 bg-slate-800/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center ring-2 ring-slate-700 shadow-inner">
            <span className="font-bold text-sm">{currentUser.fullName.charAt(0)}</span>
          </div>
          <div className="overflow-hidden">
            <p className="font-medium truncate text-sm text-slate-200">{currentUser.fullName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs text-slate-400 font-medium">{currentUser.role}</p>
            </div>
          </div>
        </div>

      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {/* Access to Drive Cloud Button */}
        {savedDriveLink && (
          <a
            href={savedDriveLink}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-4 bg-gradient-to-r from-slate-800 to-slate-700 text-blue-300 hover:from-slate-700 hover:to-slate-600 hover:text-white transition-all border border-slate-600/50 shadow-lg group"
          >
            <Map className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm">Nube Drive 5TB</span>
          </a>
        )}

        {menuItems.map((item) => {
          if (item.requiresAdmin && currentUser.role !== UserRole.ADMIN) return null;

          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewMode)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 font-medium'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-xl"></div>
              )}
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-sm relative z-10">{item.label}</span>

              {isActive && (
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-blue-500/20 to-transparent pointer-events-none"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Health Monitor Widget */}
      {systemHealth && (
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-800/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado del Sistema</p>
            {systemHealth.isSaving && <span className="text-[10px] text-blue-400 animate-pulse">Guardando...</span>}
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
            <CloudOff className="w-3 h-3" />
            <span>Modo Local (Sin Nube)</span>
          </div>

          {/* Backup Alert */}
          {systemHealth.needsBackup ? (
            <div
              onClick={() => setView('settings')}
              className="bg-red-500/10 border border-red-500/50 rounded p-2 cursor-pointer hover:bg-red-500/20 transition-colors group"
            >
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs mb-1">
                <AlertOctagon className="w-3 h-3" />
                ¡Respaldo Requerido!
              </div>
              <p className="text-[10px] text-red-300 group-hover:underline">
                Datos en riesgo. Click para guardar.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
              <Save className="w-3 h-3" />
              <span>Datos Protegidos</span>
            </div>
          )}
        </div>
      )}

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 text-red-400 hover:text-red-300 w-full px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors mt-1"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
