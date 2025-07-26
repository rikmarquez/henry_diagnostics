import api from './api';

// Tipos locales
interface Customer {
  customer_id: number;
  nombre: string;
  telefono: string;
  email?: string;
}

interface Vehicle {
  vehicle_id: number;
  vin: string;
  marca: string;
  modelo: string;
  año: number;
  placa_actual?: string;
  customer_id?: number;
  kilometraje_actual: number;
  color?: string;
  numero_motor?: string;
  tipo_combustible: 'gasolina' | 'diesel' | 'hibrido' | 'electrico';
  transmision: 'manual' | 'automatica';
  fecha_registro: string;
  fecha_actualizacion: string;
  notas?: string;
  activo: boolean;
  customer?: Customer;
}

interface VehicleSearchParams {
  placa?: string;
  vin?: string;
  customer_name?: string;
  marca?: string;
  modelo?: string;
  año?: number;
}


export const vehicleService = {
  // Buscar vehículos
  search: async (params: VehicleSearchParams & { limit?: number; offset?: number }) => {
    const response = await api.get('/vehicles/search', { params });
    return response.data;
  },

  // Crear nuevo vehículo
  create: async (vehicleData: Partial<Vehicle>) => {
    const response = await api.post('/vehicles', vehicleData);
    return response.data;
  },

  // Obtener vehículo por VIN
  getByVin: async (vin: string) => {
    const response = await api.get(`/vehicles/${vin}`);
    return response.data;
  },

  // Actualizar vehículo
  update: async (vin: string, updateData: Partial<Vehicle>) => {
    const response = await api.put(`/vehicles/${vin}`, updateData);
    return response.data;
  },

  // Eliminar vehículo (soft delete)
  delete: async (vin: string) => {
    const response = await api.delete(`/vehicles/${vin}`);
    return response.data;
  },

  // Obtener historial completo del vehículo
  getHistory: async (vin: string) => {
    const response = await api.get(`/vehicles/${vin}/history`);
    return response.data;
  },

  // Búsqueda rápida por placas (función de conveniencia)
  searchByPlate: async (placa: string) => {
    const response = await api.get('/vehicles/search', { 
      params: { placa, limit: 10 } 
    });
    return response.data;
  },

  // Búsqueda por nombre de cliente (función de conveniencia)
  searchByCustomer: async (customerName: string) => {
    const response = await api.get('/vehicles/search', { 
      params: { customer_name: customerName, limit: 20 } 
    });
    return response.data;
  },

  // Obtener conteo de vehículos registrados
  getCount: async () => {
    console.log('🚗 VehicleService: Making request to /vehicles/count');
    const response = await api.get('/vehicles/count');
    console.log('🚗 VehicleService: Count response:', response.data);
    return response.data;
  },
};