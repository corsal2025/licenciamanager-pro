import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import StatsCard from './components/StatsCard';
import UploadArea from './components/UploadArea';
import LicenseTable from './components/LicenseTable';
import LicenseModal from './components/LicenseModal';
import NotificationToast, { NotificationType } from './components/NotificationToast';
import LoginScreen from './components/LoginScreen';
import UserManagement from './components/UserManagement';
import DriveSyncArea from './components/DriveSyncArea';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AuditLogView from './components/AuditLogView';
import SettingsView from './components/SettingsView';
import FolderFinder from './components/FolderFinder';
import Module16, { ResolutionModule } from './components/Module16';
import Module12, { DeliveryModule } from './components/Module12';
import PublicPortal from './components/PublicPortal';

// ... (imports)

// ... inside App component

if (!isAuthChecked) return <div className="flex h-screen items-center justify-center">Cargando...</div>;

// IMPORTANT: Allow Public Portal without Login
if (view === 'public-portal') {
  return <PublicPortal onBack={() => {
    setView('dashboard'); // Logic to reset or go back to login? 
    // If we are logged out, this will trigger the Login Screen via the check below.
    // If we are logged in, it goes to dashboard.
    // Actually, if we are NOT logged in, setView('dashboard') will return to LoginScreen
  }} />;
}

if (!currentUser) {
  return (
    <LoginScreen
      onLoginSuccess={handleLogin}
      onPublicPortalClick={() => setView('public-portal')}
    />
  );
}

const renderContent = () => {
  switch (view) {
    case 'users':
      return currentUser.role === UserRole.ADMIN ? (
        <UserManagement showNotification={showNotification} />
      ) : (
        <div className="p-10 text-center text-slate-500">Acceso denegado.</div>
      );
    case 'drive-sync':
      return <CloudDriveManager />;
    case 'audit':
      return (
        <AuditLogView />
      );
    case 'analytics':
      return <AnalyticsDashboard licenses={licenses} />;
    case 'folder-finder':
      return <FolderFinder licenses={licenses} />;
    case 'module-16':
      return (
        <ResolutionModule
          licenses={licenses}
          currentUser={currentUser}
          onUpdateStatus={(id, status) => handleBulkUpdateStatus([id], status)}
        />
      );
    case 'module-12':
      return (
        <DeliveryModule
          licenses={licenses}
          currentUser={currentUser}
          onUpdateStatus={(id, status) => handleBulkUpdateStatus([id], status)}
        />
      );
    case 'comparison':
      return (
        <ComparisonView
          onUpdateLicenses={(newLicenses) => handleRestoreData(newLicenses, [])}
          currentLicenses={licenses}
        />
      );
    case 'purchases':
      return <PurchasesManagement currentUser={currentUser} />;
    case 'upload':
      return (
        <div className="max-w-6xl mx-auto pt-6 animate-in fade-in duration-300">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Carga Masiva de Documentos</h2>
            <p className="text-slate-500">Sube múltiples PDFs o imágenes. El sistema extraerá y registrará los datos automáticamente sin guardar las imágenes.</p>
          </div>
          <UploadArea onLicenseProcessed={handleLicenseProcessed} currentUser={currentUser} />

          <div className="mt-12 border-t border-slate-200 pt-8">
            <h3 className="text-lg font-bold text-slate-700 mb-4">Últimos Procesados</h3>
            <LicenseTable
              licenses={licenses.slice(0, 3)}
              onEditLicense={handleEditLicense}
              onDeleteLicense={handleDeleteLicense}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              onBulkDelete={handleBulkDelete}
            />
          </div>
        </div>
      );
    case 'list':
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Registro Completo</h2>
            <button
              onClick={() => setView('upload')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2"
            >
              + Carga Masiva
            </button>
          </div>
          <LicenseTable
            licenses={licenses}
            onEditLicense={handleEditLicense}
            onDeleteLicense={handleDeleteLicense}
            onBulkUpdateStatus={handleBulkUpdateStatus}
            onBulkDelete={handleBulkDelete}
          />
        </div>
      );
    case 'dashboard':
    default:
      return (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Dashboard Operativo</h2>
              <p className="text-slate-500 text-sm mt-1">Gestión de licencias y clasificación de agendas.</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-600">Última Actualización</p>
              <p className="text-slate-800 font-bold">{new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard
              title="Total Registrado"
              value={stats.total}
              icon={Users}
              color="blue"
              description="Documentos en base de datos"
            />
            <StatsCard
              title="Subidas a CONASET"
              value={stats.conaset}
              icon={FileCheck}
              color="green"
              description="Sincronizadas correctamente"
            />
            <StatsCard
              title="Sin Carpeta"
              value={stats.noFolder}
              icon={FolderX}
              color="red"
              description="Requieren búsqueda física urgente"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800">Distribución por Clase</h3>
                </div>
                <button onClick={() => setView('analytics')} className="text-xs text-blue-600 font-medium hover:underline">Ver Detalles</button>
              </div>
              <div className="space-y-4">
                {sortedCategories.length > 0 ? sortedCategories.map(([cat, count]: [string, number]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">Clase {cat}</span>
                      <span className="text-slate-500">{count} ({stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full"
                        style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400 text-center py-4">Sin datos suficientes</p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800">Clasificación de Trámites</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex flex-col justify-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setView('list')}>
                  <div className="text-2xl font-bold text-indigo-700">{stats.agendaMensual}</div>
                  <div className="text-[10px] font-bold text-indigo-600 uppercase mt-2">Agenda Mensual</div>
                </div>
                <div className="p-4 bg-teal-50 rounded-lg border border-teal-100 flex flex-col justify-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setView('list')}>
                  <div className="text-2xl font-bold text-teal-700">{stats.agendaPlacilla}</div>
                  <div className="text-[10px] font-bold text-teal-600 uppercase mt-2">Agenda Placilla</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 flex flex-col justify-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setView('list')}>
                  <div className="text-2xl font-bold text-orange-700">{stats.addressChange}</div>
                  <div className="text-[10px] font-bold text-orange-600 uppercase mt-2">Cambio Domicilio</div>
                </div>
                <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-100 flex flex-col justify-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setView('list')}>
                  <div className="text-2xl font-bold text-cyan-700">{stats.uploadedF8}</div>
                  <div className="text-[10px] font-bold text-cyan-600 uppercase mt-2">Subida con F8</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex flex-col justify-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setView('list')}>
                  <div className="text-2xl font-bold text-red-700">{stats.denied}</div>
                  <div className="text-[10px] font-bold text-red-600 uppercase mt-2">Denegadas</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Últimos Registros</h3>
              <button onClick={() => setView('list')} className="text-blue-600 text-sm font-medium hover:underline">Ver listado completo</button>
            </div>
            <LicenseTable
              licenses={licenses.slice(0, 5)}
              onEditLicense={handleEditLicense}
              onDeleteLicense={handleDeleteLicense}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              onBulkDelete={handleBulkDelete}
            />
          </div>
        </div>
      );
  }
};

return (
  <div className="flex min-h-screen bg-slate-50">
    <Sidebar
      currentView={view}
      setView={setView}
      currentUser={currentUser}
      onLogout={handleLogout}
      systemHealth={systemHealth}
      driveLink={driveFolderUrl}
    />
    <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
      <div className="max-w-7xl mx-auto">
        {renderContent()}
      </div>
    </main>

    {selectedLicense && (
      <LicenseModal
        license={selectedLicense}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleUpdateLicense}
      />
    )}

    <NotificationToast
      isVisible={notification.visible}
      message={notification.message}
      type={notification.type}
      onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
    />
  </div>
);
};

export default App;
