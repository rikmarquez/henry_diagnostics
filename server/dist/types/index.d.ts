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
    vehicle_id: number;
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
    vehicle_id?: number;
    customer_id?: number;
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
    origen_cita?: 'opportunity' | 'llamada_cliente' | 'walk_in' | 'seguimiento' | 'manual';
    kilometraje_referencia?: number;
    fecha_creacion: Date;
    fecha_actualizacion: Date;
    cita_fecha?: Date;
    cita_hora?: string;
    cita_descripcion_breve?: string;
    cita_telefono_contacto?: string;
    cita_nombre_contacto?: string;
    tiene_cita?: boolean;
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
    tiene_cita?: boolean;
}
export interface CreateAppointmentRequest {
    cita_fecha: string;
    cita_hora: string;
    cita_descripcion_breve: string;
    cita_telefono_contacto: string;
    cita_nombre_contacto: string;
    titulo?: string;
    descripcion?: string;
    origen_cita?: 'opportunity' | 'llamada_cliente' | 'walk_in' | 'seguimiento' | 'manual';
}
export interface ReceptionWalkInRequest {
    cliente_existente_id?: number;
    cliente_nuevo?: {
        nombre: string;
        telefono: string;
        whatsapp?: string;
        email?: string;
        direccion?: string;
    };
    vehiculo_existente_id?: number;
    vehiculo_nuevo?: {
        marca: string;
        modelo: string;
        año: number;
        placa_actual: string;
        color?: string;
        kilometraje_actual?: number;
    };
    accion: 'servicio_inmediato' | 'agendar_cita';
    servicio_inmediato?: {
        tipo_servicio: string;
        descripcion: string;
        precio_estimado?: number;
    };
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
export interface UserManagementView extends User {
    ultimo_login?: Date;
    password_temp?: boolean;
    fecha_password_temp?: Date;
    servicios_asignados?: number;
    oportunidades_asignadas?: number;
    ultima_actividad?: Date;
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
export interface ResetPasswordResponse {
    message: string;
    temporary_password: string;
}
export interface UserActivity {
    log_id: number;
    user_id: number;
    action: string;
    details?: any;
    ip_address?: string;
    user_agent?: string;
    performed_by?: number;
    timestamp: Date;
}
export interface UserFilters {
    search?: string;
    rol?: string;
    activo?: boolean;
    page?: number;
    limit?: number;
}
export interface Mechanic {
    mechanic_id: number;
    branch_id: number;
    numero_empleado: string;
    nombre: string;
    apellidos: string;
    alias?: string;
    telefono?: string;
    email?: string;
    fecha_nacimiento?: Date;
    fecha_ingreso: Date;
    especialidades: string[];
    certificaciones: string[];
    nivel_experiencia: 'junior' | 'intermedio' | 'senior' | 'master';
    salario_base?: number;
    comision_porcentaje: number;
    horario_trabajo?: string;
    activo: boolean;
    notas?: string;
    fecha_creacion: Date;
    fecha_actualizacion: Date;
    branch_nombre?: string;
}
export interface CreateMechanicRequest {
    branch_id: number;
    nombre: string;
    apellidos: string;
    alias?: string;
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
    alias?: string;
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
//# sourceMappingURL=index.d.ts.map