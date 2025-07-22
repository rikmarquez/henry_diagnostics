import { api } from './api';

export interface User {
  user_id: number;
  email: string;
  nombre: string;
  rol: 'administrador' | 'mecanico' | 'seguimiento';
  telefono?: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  ultimo_login?: string;
  password_temp?: boolean;
  fecha_password_temp?: string;
  servicios_asignados?: number;
  oportunidades_asignadas?: number;
  ultima_actividad?: string;
}

export interface CreateUserRequest {
  email: string;
  nombre: string;
  rol: 'administrador' | 'mecanico' | 'seguimiento';
  telefono?: string;
}

export interface UpdateUserRequest {
  nombre?: string;
  email?: string;
  rol?: 'administrador' | 'mecanico' | 'seguimiento';
  telefono?: string;
  activo?: boolean;
}

export interface UserFilters {
  search?: string;
  rol?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}

export interface UserStats {
  total_usuarios: number;
  usuarios_activos: number;
  usuarios_inactivos: number;
  administradores: number;
  mecanicos: number;
  seguimiento: number;
  passwords_temporales: number;
  activos_mes: number;
}

export interface UserActivity {
  log_id: number;
  user_id: number;
  accion: string;
  detalles?: any;
  ip_address?: string;
  user_agent?: string;
  realizado_por?: number;
  fecha: string;
  performed_by_name?: string;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ActivitiesResponse {
  activities: UserActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Obtener estadísticas de usuarios
export const getUserStats = async (): Promise<UserStats> => {
  try {
    const response = await api.get('/users/stats');
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas de usuarios:', error);
    throw error;
  }
};

// Obtener lista de usuarios con filtros
export const getUsers = async (filters?: UserFilters): Promise<UsersResponse> => {
  try {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.rol) params.append('rol', filters.rol);
    if (filters?.activo !== undefined) params.append('activo', filters.activo.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/users?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

// Obtener usuario por ID
export const getUserById = async (id: number): Promise<{ user: User }> => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    throw error;
  }
};

// Crear nuevo usuario
export const createUser = async (userData: CreateUserRequest): Promise<{ user: User; temporary_password: string }> => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
};

// Actualizar usuario
export const updateUser = async (id: number, userData: UpdateUserRequest): Promise<{ user: User }> => {
  try {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};

// Restablecer contraseña de usuario
export const resetUserPassword = async (id: number): Promise<{ temporary_password: string }> => {
  try {
    const response = await api.post(`/users/${id}/reset-password`);
    return response.data;
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    throw error;
  }
};

// Obtener actividades de usuario
export const getUserActivity = async (id: number, page = 1, limit = 20): Promise<ActivitiesResponse> => {
  try {
    const response = await api.get(`/users/${id}/activity?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener actividades del usuario:', error);
    throw error;
  }
};