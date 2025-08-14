import { useState } from 'react';
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
}

interface RescheduleAppointmentModalProps {
  appointment: Appointment;
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

const RescheduleAppointmentModal = ({
  appointment,
  isOpen,
  onSuccess,
  onCancel,
}: RescheduleAppointmentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cita_fecha: appointment.cita_fecha,
    cita_hora: appointment.cita_hora,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put(`/opportunities/${appointment.opportunity_id}/reschedule`, {
        cita_fecha: formData.cita_fecha,
        cita_hora: formData.cita_hora,
      });

      if (response.status === 200) {
        alert('✅ Cita reagendada exitosamente');
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error reagendando cita:', error);
      const message = error.response?.data?.message || 'Error al reagendar la cita';
      alert(`❌ ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">🔄 Reagendar Cita</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Información actual de la cita */}
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-blue-900 mb-2">📅 Cita actual:</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Fecha:</strong> {formatDate(appointment.cita_fecha)}</p>
            <p><strong>Hora:</strong> {formatTime(appointment.cita_hora)}</p>
            <p><strong>Cliente:</strong> {appointment.cita_nombre_contacto}</p>
            <p><strong>Vehículo:</strong> {appointment.cita_descripcion_breve}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📅 Nueva Fecha *
            </label>
            <input
              type="date"
              value={formData.cita_fecha}
              onChange={(e) => setFormData({ ...formData, cita_fecha: e.target.value })}
              className="input-field"
              required
              min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🕐 Nueva Hora *
            </label>
            <input
              type="time"
              value={formData.cita_hora}
              onChange={(e) => setFormData({ ...formData, cita_hora: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? '⏳ Reagendando...' : '🔄 Reagendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleAppointmentModal;