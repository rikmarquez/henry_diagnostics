// Henry Diagnostics - Tipos TypeScript

export interface User {
  user_id: number;
  email: string;
  nombre: string;
  rol: 'administrador' | 'mecanico' | 'seguimiento';
  telefono?: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface Customer {
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

export interface Vehicle {
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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface Opportunity {
  opportunity_id: number;
  vin: string;
  customer_id: number;
  tipo_oportunidad: 'mantenimiento' | 'reparacion' | 'venta' | 'seguimiento';
  titulo: string;
  descripcion: string;
  servicio_sugerido?: string;
  precio_estimado?: number;
  fecha_sugerida?: string;
  fecha_contacto_sugerida?: string;
  fecha_recordatorio?: string;
  estado: 'pendiente' | 'contactado' | 'agendado' | 'en_proceso' | 'completado' | 'perdido' | 'completada' | 'cancelada';
  prioridad: 'alta' | 'media' | 'baja';
  usuario_asignado?: number;
  origen: 'manual' | 'automatico' | 'historial' | 'kilometraje';
  kilometraje_referencia?: number;
  notas_seguimiento?: string;
  usuario_creador?: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  activo: boolean;
  // Campos calculados/relacionados
  customer_nombre?: string;
  customer_telefono?: string;
  customer_whatsapp?: string;
  vehicle_marca?: string;
  vehicle_modelo?: string;
  vehicle_año?: number;
  vehicle_placa?: string;
  usuario_asignado_nombre?: string;
  // Objetos relacionados
  vehicle?: Vehicle;
  customer?: Customer;
}

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  errors?: string[];
}