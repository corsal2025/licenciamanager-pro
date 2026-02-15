
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';
import { Users, UserPlus, Trash2, Shield, Lock, KeyRound, Type, Save, X, Eye, EyeOff, Pencil, RefreshCw } from 'lucide-react';

interface UserManagementProps {
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

interface EditUserFormState {
  username: string;
  fullName: string;
  password: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ showNotification }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Estado creación
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    fullName: '',
    role: UserRole.OPERATOR
  });
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Estado edición
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditUserFormState>({
    username: '',
    fullName: '',
    password: ''
  });
  const [showEditPassword, setShowEditPassword] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await authService.getAllUsers();
      setUsers(data);
    } catch (e: any) {
      setFetchError(e.message || "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper para validar contraseña alfanumérica
  const isAlphanumeric = (str: string) => {
    const hasLetter = /[a-zA-Z]/.test(str);
    const hasNumber = /[0-9]/.test(str);
    return hasLetter && hasNumber;
  };

  // Manejar cambio de nombre para autogenerar usuario (CREACIÓN)
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const parts = val.trim().split(/\s+/);
    let suggestedUsername = newUser.username;

    if (parts.length >= 2 && val.length > newUser.fullName.length) {
      const firstName = parts[0];
      const lastName = parts[parts.length - 1];
      suggestedUsername = `${firstName}.${lastName} `.replace(/[^a-zA-Z0-9.]/g, '').toUpperCase();
    }

    setNewUser(prev => ({
      ...prev,
      fullName: val,
      username: suggestedUsername
    }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.username.includes('.')) {
      showNotification('El usuario debe seguir el formato NOMBRE.APELLIDO', 'error');
      return;
    }

    if (newUser.password.length < 4) {
      showNotification('La contraseña debe tener al menos 4 caracteres', 'error');
      return;
    }

    if (!isAlphanumeric(newUser.password)) {
      showNotification('La contraseña debe ser alfanumérica (contener letras y números)', 'error');
      return;
    }

    try {
      await authService.createUser(newUser);
      setNewUser({ username: '', password: '', fullName: '', role: UserRole.OPERATOR });
      await loadUsers();
      showNotification('Usuario creado correctamente', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error al crear usuario', 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await authService.deleteUser(id);
        await loadUsers();
        showNotification('Usuario eliminado', 'success');
      } catch (err: any) {
        showNotification(err.message, 'error');
      }
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      fullName: user.fullName,
      password: '' // Vacío por defecto
    });
    setShowEditPassword(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Validaciones
    if (!editForm.username.includes('.')) {
      showNotification('El usuario debe seguir el formato NOMBRE.APELLIDO', 'error');
      return;
    }

    const updatePayload: any = {
      username: editForm.username,
      fullName: editForm.fullName
    };

    // Solo validar password si se escribió algo
    if (editForm.password) {
      if (editForm.password.length < 4) {
        showNotification('La contraseña debe tener al menos 4 caracteres', 'error');
        return;
      }
      if (!isAlphanumeric(editForm.password)) {
        showNotification('La contraseña debe ser alfanumérica', 'error');
        return;
      }
      updatePayload.password = editForm.password;
    }

    try {
      authService.updateUser(editingUser.id, updatePayload);
      showNotification('Datos de usuario actualizados correctamente', 'success');
      setEditingUser(null);
      loadUsers(); // Recargar lista para reflejar cambios
    } catch (error: any) {
      showNotification(error.message || 'Error al actualizar', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto relative">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h2>
        <p className="text-slate-500">Control de acceso y credenciales del personal.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Create User Form */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Nuevo Usuario
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={handleFullNameChange}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ej: Juan Andrés Pérez"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <Type className="w-3 h-3" /> Usuario (NOMBRE.APELLIDO)
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value.toUpperCase() })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 font-mono uppercase"
                  placeholder="JUAN.PEREZ"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full p-2 pr-10 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    placeholder="Alfanumérica"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Rol de Acceso</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value={UserRole.OPERATOR}>Operador (Limitado)</option>
                  <option value={UserRole.ADMIN}>Administrador (Total)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
              >
                Crear Usuario
              </button>
            </form>
          </div>
        </div>

        {/* User List */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Usuarios Registrados
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadUsers}
                  className="p-1 px-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded flex items-center gap-1 transition-colors"
                  title="Recargar lista"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{users.length} usuarios</span>
              </div>
            </div>

            {/* Debug/Error Message */}
            {fetchError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs border-b border-red-100">
                Error cargando usuarios: {fetchError}
              </div>
            )}

            {/* TEMP DEBUG */}
            <div className="p-2 bg-slate-100 text-[10px] font-mono border-b">
              DEBUG DATA: {JSON.stringify(users)}
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {isLoading && users.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Cargando lista de usuarios...
                </div>
              )}

              {!isLoading && users.length === 0 && !fetchError && (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No se encontraron usuarios registrados.
                </div>
              )}

              {users.map((user) => (
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      {user.role === UserRole.ADMIN ? <Shield className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">
                        {user.fullName || <span className="text-slate-400 italic">(Sin Nombre)</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-1 rounded font-mono">@{user.username}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar Usuario"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Solo permitir eliminar si NO es el usuario logueado (ya validado en servicio, pero visual aquí) */}
                    {authService.getCurrentUser()?.id !== user.id && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar Usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Edición de Usuario */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                Editar Usuario
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                Editando a: <strong>{editingUser.fullName}</strong>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Usuario (NOMBRE.APELLIDO)</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toUpperCase() })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono uppercase bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nueva Contraseña (Opcional)</label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? "text" : "password"}
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      className="w-full p-2 pr-10 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      placeholder="Dejar vacío para mantener actual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Si cambias la clave, debe ser alfanumérica.</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-2.5 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;