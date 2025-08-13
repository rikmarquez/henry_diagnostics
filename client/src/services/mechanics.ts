import api from './api';

export interface Mechanic {
  mechanic_id: number;
  branch_id: number;
  numero_empleado: string;
  nombre: string;
  apellidos: string;
  alias?: string; // Sobrenombre para identificación rápida (máximo 15 caracteres)
  telefono?: string;
  email?: string;
  fecha_nacimiento?: string;
  fecha_ingreso: string;
  especialidades: string[];
  certificaciones: string[];
  nivel_experiencia: 'junior' | 'intermedio' | 'senior' | 'master';
  salario_base?: number;
  comision_porcentaje: number;
  horario_trabajo?: string;
  activo: boolean;
  notas?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  // Datos de sucursal (JOIN)
  branch_nombre?: string;
}

export interface CreateMechanicRequest {
  branch_id: number;
  nombre: string;
  apellidos: string;
  alias?: string; // Sobrenombre para identificación rápida (máximo 15 caracteres)
  telefono?: string;
  especialidades: string[];
  nivel_experiencia: 'junior' | 'intermedio' | 'senior' | 'master';
  salario_base?: number;
  comision_porcentaje?: number;
  notas?: string;
}

export interface UpdateMechanicRequest {
  branch_id?: number;
  nombre?: string;
  apellidos?: string;
  alias?: string; // Sobrenombre para identificación rápida (máximo 15 caracteres)
  telefono?: string;
  especialidades?: string[];
  nivel_experiencia?: 'junior' | 'intermedio' | 'senior' | 'master';
  salario_base?: number;
  comision_porcentaje?: number;
  activo?: boolean;
  notas?: string;
}

export interface MechanicFilters {
  search?: string;
  branch_id?: number;
  nivel_experiencia?: string;
  especialidad?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}

export interface Branch {
  branch_id: number;
  nombre: string;
  codigo: string;
}

export interface MechanicsResponse {
  mechanics: Mechanic[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MechanicStats {
  total_mechanics: number;
  active_mechanics: number;
  senior_mechanics: number;
  master_mechanics: number;
  avg_salary: number;
}

export const mechanicService = {
  // Obtener lista de mecánicos con filtros
  async getMechanics(filters: MechanicFilters = {}): Promise<MechanicsResponse> {
    console.log('🔍 Obteniendo mecánicos con filtros:', filters);
    
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/mechanics?${params.toString()}`);
    
    console.log('✅ Mecánicos obtenidos:', {
      total: response.data.mechanics?.length || 0,
      pagination: response.data.pagination
    });
    
    return response.data;
  },

  // Obtener mecánico por ID
  async getMechanicById(id: number): Promise<{ mechanic: Mechanic }> {
    console.log('🔍 Obteniendo mecánico por ID:', id);
    
    const response = await api.get(`/mechanics/${id}`);
    
    console.log('✅ Mecánico obtenido:', {
      mechanic_id: response.data.mechanic.mechanic_id,
      nombre: `${response.data.mechanic.nombre} ${response.data.mechanic.apellidos}`
    });
    
    return response.data;
  },

  // Crear nuevo mecánico
  async createMechanic(mechanicData: CreateMechanicRequest): Promise<{ mechanic: Mechanic; message: string }> {
    console.log('➕ Creando nuevo mecánico:', {
      nombre: `${mechanicData.nombre} ${mechanicData.apellidos}`,
      numero_empleado: mechanicData.numero_empleado,
      branch_id: mechanicData.branch_id
    });
    
    const response = await api.post('/mechanics', mechanicData);
    
    console.log('✅ Mecánico creado exitosamente:', {
      mechanic_id: response.data.mechanic.mechanic_id,
      mensaje: response.data.message
    });
    
    return response.data;
  },

  // Actualizar mecánico existente
  async updateMechanic(id: number, updateData: UpdateMechanicRequest): Promise<{ mechanic: Mechanic; message: string }> {
    console.log('✏️ Actualizando mecánico:', {
      mechanic_id: id,
      campos_a_actualizar: Object.keys(updateData)
    });
    
    const response = await api.put(`/mechanics/${id}`, updateData);
    
    console.log('✅ Mecánico actualizado exitosamente:', {
      mechanic_id: id,
      mensaje: response.data.message
    });
    
    return response.data;
  },

  // Eliminar o desactivar mecánico
  async deleteMechanic(id: number): Promise<{ message: string; action: 'deleted' | 'deactivated' }> {
    console.log('🗑️ Eliminando mecánico:', { mechanic_id: id });
    
    const response = await api.delete(`/mechanics/${id}`);
    
    console.log('✅ Operación completada:', {
      mechanic_id: id,
      accion: response.data.action,
      mensaje: response.data.message
    });
    
    return response.data;
  },

  // Obtener lista de sucursales para dropdown
  async getBranches(): Promise<{ branches: Branch[] }> {
    console.log('🏢 Obteniendo lista de sucursales...');
    
    const response = await api.get('/mechanics/branches');
    
    console.log('✅ Sucursales obtenidas:', {
      total: response.data.branches?.length || 0
    });
    
    return response.data;
  },

  // Obtener estadísticas de mecánicos
  async getMechanicsStats(): Promise<{ stats: MechanicStats }> {
    console.log('📊 Obteniendo estadísticas de mecánicos...');
    
    const response = await api.get('/mechanics/stats');
    
    console.log('✅ Estadísticas obtenidas:', response.data.stats);
    
    return response.data;
  },

  // Utilidades para formateo
  formatName: (mechanic: Mechanic): string => {
    const fullName = `${mechanic.nombre} ${mechanic.apellidos}`;
    return mechanic.alias ? `${fullName} "${mechanic.alias}"` : fullName;
  },

  formatNameWithAlias: (mechanic: Mechanic): string => {
    return mechanic.alias ? `"${mechanic.alias}" - ${mechanic.nombre} ${mechanic.apellidos}` : `${mechanic.nombre} ${mechanic.apellidos}`;
  },

  formatExperienceLevel: (level: string): string => {
    const levels = {
      'junior': 'Junior',
      'intermedio': 'Intermedio',
      'senior': 'Senior',
      'master': 'Master'
    };
    return levels[level as keyof typeof levels] || level;
  },

  formatSalary: (amount?: number): string => {
    if (!amount) return 'No especificado';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  },

  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Especialidades disponibles (simplificadas)
  getCommonSpecialties: (): string[] => {
    return [
      'Frenos',
      'Suspensión',
      'Dirección'
    ];
  }
};