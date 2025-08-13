import React, { useState, useEffect } from 'react';
import appointmentService, { Appointment } from '../services/appointments';
import ConvertAppointmentModal from '../components/ConvertAppointmentModal';

const AppointmentList: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    loadTodayAppointments();
  }, []);

  const loadTodayAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📅 Cargando citas del día...');
      
      const result = await appointmentService.getTodayAppointments();
      setAppointments(result.appointments);
      setCurrentDate(result.date);
      
      console.log(`✅ ${result.appointments.length} citas cargadas`);
    } catch (err) {
      console.error('❌ Error cargando citas:', err);
      setError('Error al cargar las citas del día');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertAppointment = (appointment: Appointment) => {
    console.log('🎯 Seleccionando cita para conversión:', appointment.opportunity_id);
    setSelectedAppointment(appointment);
    setShowConvertModal(true);
  };

  const handleConvertSuccess = () => {
    console.log('🎉 Conversión exitosa, recargando lista...');
    setShowConvertModal(false);
    setSelectedAppointment(null);
    loadTodayAppointments(); // Recargar la lista
  };

  const handleConvertCancel = () => {
    console.log('❌ Conversión cancelada');
    setShowConvertModal(false);
    setSelectedAppointment(null);
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    // Convertir de "14:30:00" a "2:30 PM"
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-CR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando citas del día...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <span className="text-red-400 mr-2">❌</span>
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={loadTodayAppointments}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📅 Citas del Día
        </h1>
        <p className="text-gray-600">
          {currentDate ? formatDate(currentDate) : 'Hoy'} - {appointments.length} citas programadas
        </p>
      </div>

      {/* Lista de Citas */}
      {appointments.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No hay citas programadas para hoy
          </h3>
          <p className="text-gray-500">
            Las citas programadas para hoy aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.opportunity_id}
              className={`border rounded-lg p-6 transition-all hover:shadow-md ${
                appointment.converted_to_service_id
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* Hora y Estado */}
                  <div className="flex items-center mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🕐</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatTime(appointment.cita_hora)}
                      </span>
                    </div>
                    {appointment.converted_to_service_id && (
                      <span className="ml-4 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        ✅ Convertida a Servicio
                      </span>
                    )}
                  </div>

                  {/* Información del Cliente */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="text-lg mr-2">👤</span>
                        <span className="font-medium text-gray-900">
                          {appointment.cita_nombre_contacto}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg mr-2">📞</span>
                        <span className="text-gray-600">
                          {appointment.cita_telefono_contacto}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <span className="text-lg mr-2">🚗</span>
                        <span className="text-gray-700">
                          {appointment.cita_descripcion_breve}
                        </span>
                      </div>
                      {appointment.origen_cita && (
                        <div className="flex items-center mt-2">
                          <span className="text-sm mr-2">📋</span>
                          <span className="text-sm text-gray-500">
                            Origen: {appointment.origen_cita}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botón de Acción */}
                <div className="ml-6">
                  {appointment.converted_to_service_id ? (
                    <div className="text-center">
                      <div className="text-green-600 text-2xl mb-2">✅</div>
                      <p className="text-sm text-green-700">Ya convertida</p>
                      {appointment.existing_service_id && (
                        <p className="text-xs text-gray-500 mt-1">
                          Servicio #{appointment.existing_service_id}
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConvertAppointment(appointment)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 font-medium shadow-lg"
                    >
                      🎯 Convertir a Servicio
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

export default AppointmentList;