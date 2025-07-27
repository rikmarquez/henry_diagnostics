import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customerService } from '../services/customers';

// Tipos locales
interface Customer {
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

const phoneSchema = z.string().regex(/^\+52[0-9]{10}$/, 'Formato: +52 seguido de 10 dígitos');

const customerSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  telefono: phoneSchema,
  rfc: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Customer;
  onSuccess?: (customer: Customer) => void;
  onCancel?: () => void;
}

export const CustomerForm = ({ customer, onSuccess, onCancel }: CustomerFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!customer;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ? {
      nombre: customer.nombre,
      telefono: customer.telefono,
      rfc: customer.rfc || '',
    } : {
      telefono: '+52',
    },
  });



  const onSubmit = async (data: CustomerFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Filtrar campos vacíos
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '' && value !== undefined)
      );

      let result;
      if (isEditing) {
        result = await customerService.update(customer.customer_id, cleanData);
      } else {
        result = await customerService.create(cleanData);
      }

      onSuccess?.(result.customer);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el cliente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información básica del cliente */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo *
            </label>
            <input
              {...register('nombre')}
              type="text"
              className="input-field"
              placeholder="Juan Pérez García"
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono / WhatsApp *
            </label>
            <input
              {...register('telefono')}
              type="tel"
              className="input-field"
              placeholder="+5215512345678"
            />
            {errors.telefono && (
              <p className="mt-1 text-sm text-red-600">{errors.telefono.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Formato: +52 seguido de 10 dígitos
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RFC (Opcional)
            </label>
            <input
              {...register('rfc')}
              type="text"
              className="input-field uppercase"
              placeholder="PEGJ801215ABC (opcional)"
              maxLength={13}
            />
            <p className="mt-1 text-xs text-gray-500">
              Solo para facturación empresarial
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary disabled:opacity-50"
          >
            {isLoading 
              ? (isEditing ? 'Actualizando...' : 'Registrando...') 
              : (isEditing ? 'Actualizar Cliente' : 'Registrar Cliente')
            }
          </button>
        </div>
      </form>
    </div>
  );
};