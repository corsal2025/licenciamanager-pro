import { User, UserRole } from '../types';
import { api } from './api';

const AUTH_KEY = 'licenciamanager_auth';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const authService = {
  login: async (username: string, password: string): Promise<User> => {
    // 1. Get Token
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    // We use direct fetch here because it's a form-data request, not JSON
    const response = await fetch(`${API_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Credenciales inválidas');
    }

    const tokenData = await response.json();
    const token = tokenData.access_token;

    // 2. Initial User Data
    // For now we construct the user. Ideally backend should provide /users/me
    const user: User = {
      id: username,
      username: username,
      password: '',
      fullName: username,
      role: UserRole.OPERATOR, // Default for now
      createdAt: Date.now()
    };

    // Store session
    localStorage.setItem(AUTH_KEY, JSON.stringify({ user, token }));
    return user;
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data).user : null;
  },

  getToken: (): string | null => {
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data).token : null;
  },

  // Legacy methods kept for compatibility but throwing errors or no-op
  // API Methods
  createUser: async (user: any): Promise<User> => {
    // Adapter for backend expectation
    const payload = {
      username: user.username,
      full_name: user.fullName,
      password: user.password,
      role: user.role
    };
    const response = await api.post('/users/', payload, authService.getToken()!);
    return response;
  },

  getAllUsers: async (): Promise<User[]> => {
    const token = authService.getToken();
    if (!token) return [];

    try {
      const users = await api.get('/users/', token);
      console.log("Users fetched from API:", users);
      return users.map((u: any) => {
        // Normalize Role from Backend (ADMINISTRADOR -> ADMIN)
        let role = UserRole.OPERATOR;
        if (u.role === 'ADMINISTRADOR' || u.role === 'ADMIN') role = UserRole.ADMIN;
        if (u.role === 'OPERADOR' || u.role === 'OPERATOR') role = UserRole.OPERATOR;

        return {
          id: u.username,
          username: u.username,
          // Robust mapping: try multiple possibilities
          fullName: u.full_name || u.fullName || u.username || "Sin Nombre",
          role: role,
          createdAt: Date.now()
        };
      });
    } catch (e) {
      console.error("Failed to fetch users", e);
      return [];
    }
  },

  deleteUser: async (username: string): Promise<void> => {
    const token = authService.getToken();
    if (!token) throw new Error("No autenticado");
    await api.delete(`/users/${username}`, token);
  },

  updateUser: async (id: string, data: any): Promise<void> => {
    const token = authService.getToken();
    if (!token) throw new Error("No autenticado");

    // Construct payload matching UserUpdate schema
    const payload: any = {};
    if (data.fullName) payload.full_name = data.fullName;
    if (data.password) payload.password = data.password;
    if (data.role) payload.role = data.role;

    await api.put(`/users/${id}`, payload, token);
  }
};
