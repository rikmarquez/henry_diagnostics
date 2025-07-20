import api from './api';
import { Vehicle, VehicleSearchParams, ApiResponse } from '../types';

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
};