import { api } from './api';

// Interfaces para recepción (copiadas del backend)
export interface ReceptionWalkInRequest {
  // Datos del cliente (opcional si ya existe)
  cliente_existente_id?: number;
  cliente_nuevo?: {
    nombre: string;
    telefono: string;
    whatsapp?: string;
    email?: string;
    direccion?: string;
  };
  
  // Datos del vehículo (opcional si ya existe)  
  vehiculo_existente_id?: number;
  vehiculo_nuevo?: {
    marca: string;
    modelo: string;
    año: number;
    placa_actual: string;
    color?: string;
    kilometraje_actual?: number;
  };

  // Qué quiere hacer el cliente
  accion: 'servicio_inmediato' | 'agendar_cita';
  
  // Si es servicio inmediato
  servicio_inmediato?: {
    tipo_servicio: string;
    descripcion: string;
    precio_estimado?: number;
  };
  
  // Si es agendar cita
  cita?: {
    fecha: string;
    hora: string;
    descripcion_breve: string;
  };
}

export interface ConvertOpportunityToCitaRequest {
  opportunity_id: number;
  cita_fecha: string;
  cita_hora: string;
  notas?: string;
}

export interface ReceptionarCitaRequest {
  tipo_servicio?: string;
  descripcion?: string;
  precio_estimado?: number;
  usuario_mecanico?: number;
}

export interface CitaRecepcion {
  opportunity_id: number;
  cita_fecha: string;
  cita_hora: string;
  cita_nombre_contacto: string;
  cita_telefono_contacto: string;
  cita_descripcion_breve: string;
  origen_cita: 'opportunity' | 'llamada_cliente' | 'walk_in' | 'seguimiento' | 'manual';
  estado: string;
  vehicle_id?: number;
  customer_id?: number;
  cliente_completo?: string;
  marca?: string;
  modelo?: string;
  placa_actual?: string;
  tipo_cita: 'cita_rapida' | 'cita_completa';
}

class ReceptionService {
  /**
   * Obtener citas del día para recepción
   */
  async getCitasDelDia(fecha?: string): Promise<{ fecha: string; citas: CitaRecepcion[] }> {
    const params = fecha ? `?fecha=${fecha}` : '';
    const response = await api.get(`/reception/citas${params}`);
    return response.data;
  }

  /**
   * Procesar cliente walk-in
   */
  async processWalkInClient(data: ReceptionWalkInRequest) {
    const response = await api.post('/reception/walk-in', data);
    return response.data;
  }

  /**
   * Convertir opportunity existente en cita
   */
  async convertOpportunityToCita(data: ConvertOpportunityToCitaRequest) {
    const response = await api.post('/reception/convert-opportunity', data);
    return response.data;
  }

  /**
   * Recepcionar cita (crear servicio cuando llega el cliente)
   */
  async receptionarCita(opportunityId: number, data: ReceptionarCitaRequest) {
    const response = await api.post(`/reception/recepcionar/${opportunityId}`, data);
    return response.data;
  }

  /**
   * Buscar cliente por teléfono o nombre
   */
  async buscarCliente(query: string) {
    const response = await api.get(`/customers/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  /**
   * Obtener vehículos de un cliente
   */
  async getVehiculosCliente(customerId: number) {
    const response = await api.get(`/customers/${customerId}/vehicles`);
    return response.data;
  }

  /**
   * Buscar vehículo por placas
   */
  async buscarVehiculo(placas: string) {
    const response = await api.get(`/vehicles/search?placa=${encodeURIComponent(placas)}`);
    return response.data;
  }
}

export const receptionService = new ReceptionService();