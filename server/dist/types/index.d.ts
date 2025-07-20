export interface User {
    user_id: number;
    email: string;
    password_hash: string;
    nombre: string;
    rol: 'administrador' | 'mecanico' | 'seguimiento';
    telefono?: string;
    activo: boolean;
    fecha_creacion: Date;
    fecha_actualizacion: Date;
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
    fecha_registro: Date;
    fecha_actualizacion: Date;
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
    fecha_registro: Date;
    fecha_actualizacion: Date;
    notas?: string;
    activo: boolean;
}
export interface Service {
    service_id: number;
    vin: string;
    customer_id: number;
    usuario_mecanico?: number;
    fecha_servicio: Date;
    tipo_servicio: string;
    descripcion: string;
    kilometraje_servicio?: number;
    precio: number;
    estado: 'cotizado' | 'autorizado' | 'en_proceso' | 'completado' | 'cancelado';
    notas?: string;
    proximo_servicio_km?: number;
    proximo_servicio_fecha?: Date;
    garantia_meses: number;
    refacciones_usadas?: string;
    fecha_creacion: Date;
}
export interface Opportunity {
    opportunity_id: number;
    vin: string;
    customer_id: number;
    usuario_creador?: number;
    usuario_asignado?: number;
    tipo_oportunidad: string;
    titulo: string;
    descripcion: string;
    servicio_sugerido?: string;
    precio_estimado?: number;
    fecha_sugerida?: Date;
    fecha_contacto_sugerida?: Date;
    estado: 'pendiente' | 'contactado' | 'agendado' | 'en_proceso' | 'completado' | 'perdido';
    prioridad: 'alta' | 'media' | 'baja';
    origen: 'manual' | 'automatico' | 'historial' | 'kilometraje';
    kilometraje_referencia?: number;
    fecha_creacion: Date;
    fecha_actualizacion: Date;
}
export interface AuthRequest extends Request {
    user?: User;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    nombre: string;
    rol: 'administrador' | 'mecanico' | 'seguimiento';
    telefono?: string;
}
export interface VehicleSearchParams {
    placa?: string;
    vin?: string;
    customer_name?: string;
    marca?: string;
    modelo?: string;
    año?: number;
}
export interface OpportunityFilters {
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    usuario_asignado?: number;
    prioridad?: string;
}
//# sourceMappingURL=index.d.ts.map