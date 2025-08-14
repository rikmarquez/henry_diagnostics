import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { opportunityService } from '../services/opportunities';
import type { Opportunity } from '../types/index';

interface ConvertToAppointmentFormProps {
  opportunity: Opportunity;
  onSuccess: () => void;
  onCancel: () => void;
}

interface AppointmentFormData {
  cita_fecha: string;
  cita_hora: string;
  cita_descripcion_breve: string;
  cita_telefono_contacto: string;
  cita_nombre_contacto: string;
  titulo?: string;
  descripcion?: string;
}

export const ConvertToAppointmentForm = ({ 
  opportunity, 
  onSuccess, 
  onCancel 
}: ConvertToAppointmentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    defaultValues: {
      cita_descripcion_breve: `${opportunity.vehicle_marca} ${opportunity.vehicle_modelo} ${opportunity.vehicle_año} - ${opportunity.tipo_oportunidad.replace(/_/g, ' ')}`,
      cita_telefono_contacto: opportunity.customer_telefono || '',
      cita_nombre_contacto: opportunity.customer_nombre || '',
      titulo: `Cita: ${opportunity.titulo}`,
      descripcion: opportunity.descripcion,
    },
  });

  const onSubmit = async (data: AppointmentFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await opportunityService.convertToAppointment(opportunity.opportunity_id, data);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al convertir oportunidad a cita');
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener fecha mínima (mañana)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Convertir a Cita Programada
          </h2>
          <p className="text-gray-600">
            Convierte esta oportunidad en una cita programada para el cliente {opportunity.customer_nombre}
          </p>
        </div>

        {/* Información de la oportunidad */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Oportunidad Actual</h3>
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Cliente:</span> {opportunity.customer_nombre}</p>
            <p><span className="font-medium">Vehículo:</span> {opportunity.vehicle_marca} {opportunity.vehicle_modelo} {opportunity.vehicle_año}</p>
            <p><span className="font-medium">Placas:</span> {opportunity.vehicle_placa}</p>
            <p><span className="font-medium">Servicio:</span> {opportunity.tipo_oportunidad.replace(/_/g, ' ')}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de la Cita *
              </label>
              <input
                type="date"
                min={getMinDate()}
                {...register('cita_fecha', { 
                  required: 'La fecha es requerida' 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.cita_fecha && (
                <p className="text-red-600 text-sm mt-1">{errors.cita_fecha.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de la Cita *
              </label>
              <input
                type="time"
                {...register('cita_hora', { 
                  required: 'La hora es requerida' 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.cita_hora && (
                <p className="text-red-600 text-sm mt-1">{errors.cita_hora.message}</p>
              )}
            </div>
          </div>

          {/* Datos de Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de Contacto *
              </label>
              <input
                type="text"
                {...register('cita_nombre_contacto', { 
                  required: 'El nombre de contacto es requerido' 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.cita_nombre_contacto && (
                <p className="text-red-600 text-sm mt-1">{errors.cita_nombre_contacto.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono de Contacto *
              </label>
              <input
                type="tel"
                {...register('cita_telefono_contacto', { 
                  required: 'El teléfono es requerido' 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.cita_telefono_contacto && (
                <p className="text-red-600 text-sm mt-1">{errors.cita_telefono_contacto.message}</p>
              )}
            </div>
          </div>

          {/* Descripción Breve */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción del Vehículo/Servicio *
            </label>
            <input
              type="text"
              {...register('cita_descripcion_breve', { 
                required: 'La descripción es requerida' 
              })}
              placeholder="Ej: Toyota Corolla 2020 - Cambio de aceite"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.cita_descripcion_breve && (
              <p className="text-red-600 text-sm mt-1">{errors.cita_descripcion_breve.message}</p>
            )}
          </div>

          {/* Título (Opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título de la Cita (Opcional)
            </label>
            <input
              type="text"
              {...register('titulo')}
              placeholder="Título personalizado para la cita"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Descripción Adicional (Opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas Adicionales (Opcional)
            </label>
            <textarea
              rows={3}
              {...register('descripcion')}
              placeholder="Notas adicionales sobre la cita"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Convirtiendo...
                </>
              ) : (
                '📅 Convertir a Cita'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};