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
  converted_to_service_id?: number;
}

interface CancelAppointmentModalProps {
  appointment: Appointment;
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

const CancelAppointmentModal = ({
  appointment,
  isOpen,
  onSuccess,
  onCancel,
}: CancelAppointmentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put(`/opportunities/${appointment.opportunity_id}/cancel`, {
        motivo_cancelacion: motivoCancelacion || 'Cancelada por usuario',
      });

      if (response.status === 200) {
        alert('✅ Cita cancelada exitosamente');
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error cancelando cita:', error);
      const message = error.response?.data?.message || 'Error al cancelar la cita';
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

  // Verificar si la cita ya fue convertida a servicio
  if (appointment.converted_to_service_id) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-red-900">❌ No se puede cancelar</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="text-center py-4">
            <div className="text-6xl mb-4">🚫</div>
            <p className="text-gray-700 mb-4">
              Esta cita ya fue convertida a servicio y no puede ser cancelada.
            </p>
            <p className="text-sm text-gray-600">
              Servicio #{appointment.converted_to_service_id}
            </p>
          </div>

          <button
            onClick={onCancel}
            className="btn-primary w-full"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-red-900">❌ Cancelar Cita</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Información de la cita a cancelar */}
        <div className="bg-red-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-red-900 mb-2">📅 Cita a cancelar:</h3>
          <div className="text-sm text-red-800 space-y-1">
            <p><strong>Fecha:</strong> {formatDate(appointment.cita_fecha)}</p>
            <p><strong>Hora:</strong> {formatTime(appointment.cita_hora)}</p>
            <p><strong>Cliente:</strong> {appointment.cita_nombre_contacto}</p>
            <p><strong>Vehículo:</strong> {appointment.cita_descripcion_breve}</p>
          </div>
        </div>

        {/* Advertencia */}
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4">
          <div className="flex items-center">
            <div className="text-yellow-600 text-lg mr-2">⚠️</div>
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Esta acción no se puede deshacer.</p>
              <p>El horario quedará disponible para nuevas citas.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📝 Motivo de cancelación (opcional)
            </label>
            <textarea
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Ej: Cliente canceló, conflicto de horarios, emergencia..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              No Cancelar
            </button>
            <button
              type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 flex-1"
              disabled={loading}
            >
              {loading ? '⏳ Cancelando...' : '❌ Sí, Cancelar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelAppointmentModal;