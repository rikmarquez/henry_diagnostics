import api from './api';

// Tipos locales

interface Opportunity {
  opportunity_id: number;
  vehicle_id?: number;
  customer_id?: number;
  usuario_creador?: number;
  usuario_asignado?: number;
  tipo_oportunidad: string;
  titulo: string;
  descripcion: string;
  servicio_sugerido?: string;
  precio_estimado?: number;
  fecha_sugerida?: string;
  fecha_contacto_sugerida?: string;
  estado: 'pendiente' | 'contactado' | 'agendado' | 'en_proceso' | 'completado' | 'perdido';
  prioridad: 'alta' | 'media' | 'baja';
  origen: 'manual' | 'automatico' | 'historial' | 'kilometraje';
  kilometraje_referencia?: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  // Campos de cita preliminar
  cita_fecha?: string;
  cita_hora?: string;
  cita_descripcion_breve?: string;
  cita_telefono_contacto?: string;
  cita_nombre_contacto?: string;
  tiene_cita?: boolean;
}

interface OpportunityFilters {
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  usuario_asignado?: number;
  prioridad?: string;
  tiene_cita?: string;
}

export const opportunityService = {
  // Buscar oportunidades
  search: async (params: OpportunityFilters & { limit?: number; offset?: number }) => {
    const response = await api.get('/opportunities/search', { params });
    return response.data;
  },

  // Crear nueva oportunidad
  create: async (opportunityData: Partial<Opportunity>) => {
    const response = await api.post('/opportunities', opportunityData);
    return response.data;
  },

  // Obtener oportunidad por ID
  getById: async (id: number) => {
    const response = await api.get(`/opportunities/${id}`);
    return response.data;
  },

  // Actualizar oportunidad
  update: async (id: number, updateData: Partial<Opportunity>) => {
    const response = await api.put(`/opportunities/${id}`, updateData);
    return response.data;
  },

  // Obtener oportunidades por vehículo
  getByVehicle: async (vehicleId: number) => {
    const response = await api.get(`/opportunities/vehicle/${vehicleId}`);
    return response.data;
  },

  // Obtener recordatorios del día
  getRemindersToday: async () => {
    const response = await api.get('/opportunities/reminders/today');
    return response.data;
  },

  // Agregar nota de seguimiento
  addNote: async (opportunityId: number, noteData: {
    tipo_contacto?: 'llamada' | 'whatsapp' | 'visita' | 'email' | 'nota_interna';
    resultado?: 'contactado' | 'no_contesta' | 'ocupado' | 'interesado' | 'no_interesado' | 'agendado';
    notas: string;
    seguimiento_requerido?: boolean;
    fecha_seguimiento?: string;
  }) => {
    const response = await api.post(`/opportunities/${opportunityId}/notes`, noteData);
    return response.data;
  },

  // Cambiar estado de oportunidad (función de conveniencia)
  changeStatus: async (id: number, estado: 'pendiente' | 'contactado' | 'agendado' | 'en_proceso' | 'completado' | 'perdido') => {
    const response = await api.put(`/opportunities/${id}`, { estado });
    return response.data;
  },

  // Asignar usuario a oportunidad (función de conveniencia)
  assignUser: async (id: number, usuario_asignado: number) => {
    const response = await api.put(`/opportunities/${id}`, { usuario_asignado });
    return response.data;
  },

  // Obtener oportunidades pendientes (función de conveniencia)
  getPending: async () => {
    const response = await api.get('/opportunities/search', { 
      params: { estado: 'pendiente', limit: 50 } 
    });
    return response.data;
  },

  // Obtener oportunidades por prioridad (función de conveniencia)
  getByPriority: async (prioridad: 'alta' | 'media' | 'baja') => {
    const response = await api.get('/opportunities/search', { 
      params: { prioridad, limit: 50 } 
    });
    return response.data;
  },

  // Obtener citas de hoy (función de conveniencia)
  getAppointmentsToday: async () => {
    const today = new Date().toISOString().split('T')[0];
    console.log('🗓️ getAppointmentsToday: Buscando citas para fecha:', today);
    const response = await api.get('/opportunities/search', { 
      params: { tiene_cita: 'true', fecha_desde: today, fecha_hasta: today, limit: 50 } 
    });
    console.log('📊 getAppointmentsToday: Resultado:', response.data);
    return response.data;
  },
};