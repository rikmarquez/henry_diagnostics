import { api } from './api';

export interface Service {
  service_id: number;
  vehicle_id: number;
  customer_id: number;
  mechanic_id?: number;
  usuario_mecanico?: number;
  fecha_servicio: string;
  tipo_servicio: string;
  descripcion: string;
  kilometraje_servicio?: number;
  precio: number;
  estado: 'cotizado' | 'autorizado' | 'en_proceso' | 'completado' | 'cancelado';
  notas?: string;
  proximo_servicio_km?: number;
  proximo_servicio_fecha?: string;
  garantia_meses?: number;
  refacciones_usadas?: string;
  fecha_creacion: string;
  
  // Datos relacionados (cuando se incluyen en consultas)
  cliente_nombre?: string;
  cliente_telefono?: string;
  vehiculo_descripcion?: string;
  vehiculo_marca?: string;
  vehiculo_modelo?: string;
  vehiculo_año?: number;
  placa_actual?: string;
  mecanico_nombre?: string;
  sucursal_nombre?: string;
}

export interface ServiceFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  estado?: string;
  cliente?: string;
  vehiculo?: string;
  mechanic_id?: number;
  branch_id?: number;
}

export interface ServiceStats {
  total_servicios: number;
  servicios_mes_actual: number;
  servicios_pendientes: number;
  ingresos_mes: number;
  servicios_por_estado: {
    estado: string;
    count: number;
  }[];
}

class ServiceService {
  // Obtener estadísticas de servicios
  async getStats(): Promise<ServiceStats> {
    const response = await api.get('/services/stats');
    return response.data;
  }
  
  // Obtener contador de servicios del mes actual
  async getCountThisMonth(): Promise<{ count: number }> {
    const response = await api.get('/services/count/month');
    return response.data;
  }
  
  // Listar servicios con filtros
  async getServices(filters: ServiceFilters = {}, page: number = 1, limit: number = 50) {
    const params = new URLSearchParams();
    
    if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.cliente) params.append('cliente', filters.cliente);
    if (filters.vehiculo) params.append('vehiculo', filters.vehiculo);
    if (filters.mechanic_id) params.append('mechanic_id', filters.mechanic_id.toString());
    if (filters.branch_id) params.append('branch_id', filters.branch_id.toString());
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const response = await api.get(`/services?${params.toString()}`);
    return response.data;
  }
  
  // Obtener servicio por ID
  async getServiceById(serviceId: number): Promise<{ service: Service }> {
    const response = await api.get(`/services/${serviceId}`);
    return response.data;
  }
  
  // Actualizar estado de servicio
  async updateServiceStatus(serviceId: number, estado: Service['estado'], notas?: string) {
    const response = await api.put(`/services/${serviceId}/status`, {
      estado,
      notas
    });
    return response.data;
  }

  // Actualizar servicio completo
  async updateService(serviceId: number, updates: {
    tipo_servicio?: string;
    descripcion?: string;
    precio?: number;
    estado?: Service['estado'];
    notas?: string;
    kilometraje_servicio?: number;
    refacciones_usadas?: string;
    proximo_servicio_km?: number;
    proximo_servicio_fecha?: string;
    garantia_meses?: number;
    mechanic_id?: number | null;
  }) {
    const response = await api.put(`/services/${serviceId}`, updates);
    return response.data;
  }
  
  // Completar servicio
  async completeService(serviceId: number, data: {
    kilometraje_servicio?: number;
    refacciones_usadas?: string;
    proximo_servicio_km?: number;
    proximo_servicio_fecha?: string;
    notas?: string;
  }) {
    const response = await api.put(`/services/${serviceId}/complete`, data);
    return response.data;
  }
  
  // Obtener servicios por vehículo
  async getServicesByVehicle(vehicleId: number) {
    const response = await api.get(`/services/vehicle/${vehicleId}`);
    return response.data;
  }
  
  // Obtener servicios por cliente
  async getServicesByCustomer(customerId: number) {
    const response = await api.get(`/services/customer/${customerId}`);
    return response.data;
  }
  
  // Obtener servicios recientes
  async getRecentServices(limit: number = 10) {
    const response = await api.get(`/services/recent?limit=${limit}`);
    return response.data;
  }

  // Obtener mecánicos activos para dropdown
  async getAvailableMechanics(): Promise<{ mechanics: Array<{
    mechanic_id: number;
    nombre: string;
    apellidos: string;
    alias?: string;
    branch_nombre: string;
    nivel_experiencia: string;
  }> }> {
    const response = await api.get('/mechanics?activo=true&limit=100');
    return response.data;
  }
}

export const serviceService = new ServiceService();