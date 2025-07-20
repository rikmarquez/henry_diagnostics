import api from './api';

// Tipos locales
interface Customer {
  customer_id: number;
  nombre: string;
  telefono: string;
  whatsapp?: string;
  email?: string;
  direccion?: string;
  codigo_postal?: string;
  rfc?: string;
  notas?: string;
  fecha_registro: string;
  fecha_actualizacion: string;
}


interface CustomerSearchParams {
  nombre?: string;
  telefono?: string;
  email?: string;
  limit?: number;
  offset?: number;
}

export const customerService = {
  // Obtener todos los clientes
  getAll: async (limit = 50) => {
    const response = await api.get('/customers/search', { 
      params: { nombre: '', limit } 
    });
    return response.data;
  },

  // Buscar clientes
  search: async (params: CustomerSearchParams) => {
    const response = await api.get('/customers/search', { params });
    return response.data;
  },

  // Crear nuevo cliente
  create: async (customerData: Partial<Customer>) => {
    const response = await api.post('/customers', customerData);
    return response.data;
  },

  // Obtener cliente por ID
  getById: async (id: number) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Actualizar cliente
  update: async (id: number, updateData: Partial<Customer>) => {
    const response = await api.put(`/customers/${id}`, updateData);
    return response.data;
  },

  // Eliminar cliente
  delete: async (id: number) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  // Obtener vehículos del cliente
  getVehicles: async (id: number) => {
    const response = await api.get(`/customers/${id}/vehicles`);
    return response.data;
  },

  // Búsqueda rápida por nombre (función de conveniencia)
  searchByName: async (nombre: string) => {
    const response = await api.get('/customers/search', { 
      params: { nombre, limit: 10 } 
    });
    return response.data;
  },

  // Búsqueda por teléfono (función de conveniencia)
  searchByPhone: async (telefono: string) => {
    const response = await api.get('/customers/search', { 
      params: { telefono, limit: 5 } 
    });
    return response.data;
  },
};