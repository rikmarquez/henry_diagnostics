import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customerService } from '../services/customers';
import { Customer } from '../types';

const phoneSchema = z.string().regex(/^\+52[0-9]{10}$/, 'Formato: +52 seguido de 10 dígitos');
const postalCodeSchema = z.string().regex(/^[0-9]{5}$/, 'Código postal debe tener 5 dígitos');
const rfcSchema = z.string().regex(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'Formato de RFC inválido');

const customerSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  telefono: phoneSchema,
  whatsapp: phoneSchema.optional(),
  email: z.string().email('Email inválido').optional(),
  direccion: z.string().optional(),
  codigo_postal: postalCodeSchema.optional(),
  rfc: rfcSchema.optional(),
  notas: z.string().optional(),
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
      whatsapp: customer.whatsapp || '',
      email: customer.email || '',
      direccion: customer.direccion || '',
      codigo_postal: customer.codigo_postal || '',
      rfc: customer.rfc || '',
      notas: customer.notas || '',
    } : {
      telefono: '+52',
      whatsapp: '+52',
    },
  });

  const telefono = watch('telefono');

  // Auto-completar WhatsApp cuando se escribe el teléfono
  const handleTelefonoChange = (value: string) => {
    setValue('telefono', value);
    if (!watch('whatsapp') || watch('whatsapp') === '+52') {
      setValue('whatsapp', value);
    }
  };

  const onSubmit = async (data: CustomerFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Filtrar campos vacíos
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '' && value !== undefined)
      );

      // Si no se especifica WhatsApp, usar el teléfono
      if (!cleanData.whatsapp && cleanData.telefono) {
        cleanData.whatsapp = cleanData.telefono;
      }

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
        {/* Información personal */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                className="input-field"
                placeholder="juan@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Información de contacto */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono *
              </label>
              <input
                {...register('telefono')}
                type="tel"
                className="input-field"
                placeholder="+5215512345678"
                onChange={(e) => handleTelefonoChange(e.target.value)}
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
                WhatsApp
              </label>
              <input
                {...register('whatsapp')}
                type="tel"
                className="input-field"
                placeholder="+5215512345678"
              />
              {errors.whatsapp && (
                <p className="mt-1 text-sm text-red-600">{errors.whatsapp.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Se auto-completa con el teléfono si no se especifica
              </p>
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ubicación</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <textarea
                {...register('direccion')}
                rows={2}
                className="input-field"
                placeholder="Av. Insurgentes Sur 1234, Col. Del Valle"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Postal
                </label>
                <input
                  {...register('codigo_postal')}
                  type="text"
                  className="input-field"
                  placeholder="03100"
                  maxLength={5}
                />
                {errors.codigo_postal && (
                  <p className="mt-1 text-sm text-red-600">{errors.codigo_postal.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RFC (Empresarial)
                </label>
                <input
                  {...register('rfc')}
                  type="text"
                  className="input-field uppercase"
                  placeholder="PEGJ801215ABC"
                  maxLength={13}
                />
                {errors.rfc && (
                  <p className="mt-1 text-sm text-red-600">{errors.rfc.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas
          </label>
          <textarea
            {...register('notas')}
            rows={3}
            className="input-field"
            placeholder="Información adicional sobre el cliente..."
          />
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