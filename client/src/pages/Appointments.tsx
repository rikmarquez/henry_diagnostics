import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { opportunityService } from '../services/opportunities';
import appointmentService from '../services/appointments';
import ConvertAppointmentModal from '../components/ConvertAppointmentModal';
import api from '../services/api';

interface Appointment {
  opportunity_id: number;
  cita_fecha: string;
  cita_hora: string;
  cita_descripcion_breve: string;
  cita_telefono_contacto: string;
  cita_nombre_contacto: string;
  titulo: string;
  estado: string;
  fecha_creacion: string;
  converted_to_service_id?: number;
  origen_cita?: string;
  tiene_cita?: boolean;
}

interface CreateAppointmentRequest {
  cita_fecha: string;
  cita_hora: string;
  cita_descripcion_breve: string;
  cita_telefono_contacto: string;
  cita_nombre_contacto: string;
  titulo?: string;
  descripcion?: string;
}

type DateFilter = 'today' | 'week' | 'month' | 'all';

export const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [formData, setFormData] = useState<CreateAppointmentRequest>({
    cita_fecha: '',
    cita_hora: '',
    cita_descripcion_breve: '',
    cita_telefono_contacto: '',
    cita_nombre_contacto: '',
    titulo: '',
    descripcion: ''
  });

  const loadAppointments = async () => {
    try {
      console.log('📅 Appointments: Cargando todas las citas...');
      const data = await opportunityService.search({ tiene_cita: 'true' });
      console.log('📊 Appointments: Citas recibidas:', data.opportunities?.length || 0);
      console.log('📋 Appointments: Datos completos:', JSON.stringify(data.opportunities, null, 2));
      setAppointments(data.opportunities || []);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar citas por fecha
  const filterAppointments = () => {
    if (appointments.length === 0) return;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD formato
    
    console.log('🔍 FilterAppointments:', {
      dateFilter,
      todayStr,
      totalAppointments: appointments.length,
      appointmentDates: appointments.map(a => ({ id: a.opportunity_id, fecha: a.cita_fecha, tiene_cita: a.tiene_cita }))
    });
    
    let filtered = appointments;
    
    switch (dateFilter) {
      case 'today':
        filtered = appointments.filter(appointment => 
          appointment.cita_fecha === todayStr
        );
        console.log('📅 Today filter result:', filtered.length, 'citas para', todayStr);
        break;
      
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Domingo
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sábado
        
        const startWeekStr = startOfWeek.toISOString().split('T')[0];
        const endWeekStr = endOfWeek.toISOString().split('T')[0];
        
        filtered = appointments.filter(appointment => 
          appointment.cita_fecha >= startWeekStr && appointment.cita_fecha <= endWeekStr
        );
        break;
      
      case 'month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const startMonthStr = startOfMonth.toISOString().split('T')[0];
        const endMonthStr = endOfMonth.toISOString().split('T')[0];
        
        filtered = appointments.filter(appointment => 
          appointment.cita_fecha >= startMonthStr && appointment.cita_fecha <= endMonthStr
        );
        break;
      
      case 'all':
      default:
        // Mostrar todas las citas futuras
        filtered = appointments.filter(appointment => 
          appointment.cita_fecha >= todayStr
        );
        break;
    }
    
    // Ordenar por fecha y hora
    filtered.sort((a, b) => {
      const dateA = new Date(a.cita_fecha + 'T' + a.cita_hora);
      const dateB = new Date(b.cita_fecha + 'T' + b.cita_hora);
      return dateA.getTime() - dateB.getTime();
    });
    
    setFilteredAppointments(filtered);
  };

  useEffect(() => {
    filterAppointments();
  }, [appointments, dateFilter]);

  // Funciones para conversión de citas
  const handleConvertAppointment = (appointment: Appointment) => {
    console.log('🎯 Seleccionando cita para conversión:', appointment.opportunity_id);
    setSelectedAppointment(appointment);
    setShowConvertModal(true);
  };

  const handleConvertSuccess = () => {
    console.log('🎉 Conversión exitosa, recargando lista...');
    setShowConvertModal(false);
    setSelectedAppointment(null);
    loadAppointments(); // Recargar la lista
  };

  const handleConvertCancel = () => {
    console.log('❌ Conversión cancelada');
    setShowConvertModal(false);
    setSelectedAppointment(null);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const appointmentData = {
        ...formData,
        titulo: formData.titulo || `Cita - ${formData.cita_descripcion_breve}`,
        descripcion: formData.descripcion || `Cita agendada para ${formData.cita_nombre_contacto} - ${formData.cita_descripcion_breve}`,
        tipo_oportunidad: 'cita_agendada',
        estado: 'agendado',
        prioridad: 'media',
        origen: 'manual',
        tiene_cita: true
      };

      const response = await api.post('/opportunities/appointments', appointmentData);
      
      if (response.status === 201) {
        // Cita creada exitosamente
        setShowCreateForm(false);
        setFormData({
          cita_fecha: '',
          cita_hora: '',
          cita_descripcion_breve: '',
          cita_telefono_contacto: '',
          cita_nombre_contacto: '',
          titulo: '',
          descripcion: ''
        });
        loadAppointments(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error al crear cita:', error);
      alert('Error al crear la cita. Por favor, intenta de nuevo.');
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return 'bg-blue-100 text-blue-800';
      case 'en_proceso': return 'bg-yellow-100 text-yellow-800';
      case 'completado': return 'bg-green-100 text-green-800';
      case 'perdido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📅 Citas</h1>
          <p className="text-gray-600">
            Gestión completa de citas agendadas - {filteredAppointments.length} citas
            {dateFilter === 'today' && ' (hoy)'}
            {dateFilter === 'week' && ' (esta semana)'}
            {dateFilter === 'month' && ' (este mes)'}
            {dateFilter === 'all' && ' (futuras)'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            📅 Nueva Cita
          </button>
        </div>
      </div>

      {/* Filtros de fecha */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Período:</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                dateFilter === 'today'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📅 Hoy
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                dateFilter === 'week'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📆 Semana
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                dateFilter === 'month'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              🗓️ Mes
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                dateFilter === 'all'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📋 Todas
            </button>
          </div>
        </div>
      </div>

      {/* Formulario de crear cita */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Agendar Cita Rápida</h2>
            
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.cita_fecha}
                    onChange={(e) => setFormData({ ...formData, cita_fecha: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora *
                  </label>
                  <input
                    type="time"
                    value={formData.cita_hora}
                    onChange={(e) => setFormData({ ...formData, cita_hora: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción del vehículo *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Honda HRV 2022"
                  value={formData.cita_descripcion_breve}
                  onChange={(e) => setFormData({ ...formData, cita_descripcion_breve: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del contacto *
                </label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={formData.cita_nombre_contacto}
                  onChange={(e) => setFormData({ ...formData, cita_nombre_contacto: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  placeholder="55-1234-5678"
                  value={formData.cita_telefono_contacto}
                  onChange={(e) => setFormData({ ...formData, cita_telefono_contacto: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Agendar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de citas */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {appointments.length === 0 
                ? "No hay citas agendadas" 
                : filteredAppointments.length === 0 
                  ? "No hay citas en el período seleccionado"
                  : "No hay citas futuras"
              }
            </h3>
            <p className="text-gray-500 mb-4">
              {appointments.length === 0 
                ? "Comienza agendando tu primera cita"
                : filteredAppointments.length === 0 
                  ? "Intenta cambiar el filtro de período"
                  : "Las citas aparecerán aquí"
              }
            </p>
            {appointments.length === 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                Agendar Primera Cita
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cita
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.opportunity_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(appointment.cita_fecha)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(appointment.cita_hora)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.cita_nombre_contacto}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.cita_telefono_contacto}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.cita_descripcion_breve}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.estado)}`}>
                          {appointment.estado}
                        </span>
                        {appointment.converted_to_service_id && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✅ Convertida
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        {appointment.converted_to_service_id ? (
                          <div className="text-center">
                            <div className="text-green-600 text-lg">✅</div>
                            <p className="text-xs text-green-700">Ya convertida</p>
                            <p className="text-xs text-gray-500">Servicio #{appointment.converted_to_service_id}</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConvertAppointment(appointment)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded text-xs hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                          >
                            🎯 Convertir a Servicio
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Conversión */}
      {selectedAppointment && (
        <ConvertAppointmentModal
          appointment={selectedAppointment}
          isOpen={showConvertModal}
          onSuccess={handleConvertSuccess}
          onCancel={handleConvertCancel}
        />
      )}
    </div>
  );
};