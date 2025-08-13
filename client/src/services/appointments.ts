import { api } from './api';

export interface Appointment {
  opportunity_id: number;
  cita_fecha: string;
  cita_hora: string;
  cita_nombre_contacto: string;
  cita_telefono_contacto: string;
  cita_descripcion_breve: string;
  converted_to_service_id: number | null;
  origen_cita: string;
  existing_service_id?: number;
  service_status?: string;
}

export interface ConvertAppointmentRequest {
  tipo_servicio: string;
  descripcion: string;
  precio: number;
  mechanic_id?: number;
  customer_id?: number;
  vehicle_id?: number;
  new_customer?: {
    nombre: string;
    telefono: string;
    email?: string;
    direccion?: string;
  };
  new_vehicle?: {
    marca: string;
    modelo: string;
    año: number;
    color: string;
    placa_actual: string;
  };
}

export interface ConvertAppointmentResponse {
  success: boolean;
  message: string;
  service: any;
  appointment_id: number;
  created_customer_id?: number;
  created_vehicle_id?: number;
}

const appointmentService = {
  // Obtener citas del día actual
  getTodayAppointments: async () => {
    console.log('📅 Obteniendo citas del día...');
    try {
      const response = await api.get<{
        success: boolean;
        appointments: Appointment[];
        date: string;
      }>('/appointments/today');
      
      console.log(`✅ ${response.data.appointments.length} citas encontradas para hoy`);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo citas del día:', error);
      throw error;
    }
  },

  // Obtener citas por rango de fechas
  getAppointmentsByDateRange: async (startDate: string, endDate: string) => {
    console.log(`📅 Obteniendo citas del ${startDate} al ${endDate}...`);
    try {
      const response = await api.get<{
        success: boolean;
        appointments: Appointment[];
        start_date: string;
        end_date: string;
      }>('/appointments', {
        params: { start_date: startDate, end_date: endDate }
      });
      
      console.log(`✅ ${response.data.appointments.length} citas encontradas en el rango`);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo citas por rango:', error);
      throw error;
    }
  },

  // Convertir cita a servicio
  convertToService: async (appointmentId: number, data: ConvertAppointmentRequest) => {
    console.log(`🎯 Convirtiendo cita ${appointmentId} a servicio...`);
    try {
      const response = await api.post<ConvertAppointmentResponse>(
        `/appointments/${appointmentId}/convert-to-service`,
        data
      );
      
      console.log(`✅ Cita convertida exitosamente. Servicio ID: ${response.data.service?.service_id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error convirtiendo cita a servicio:', error);
      throw error;
    }
  }
};

export default appointmentService;