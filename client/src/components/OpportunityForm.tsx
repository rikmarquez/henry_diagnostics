import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { opportunityService } from '../services/opportunities';
import { vehicleService } from '../services/vehicles';
import { customerService } from '../services/customers';
import { useAuth } from '../hooks/useAuth';

// Tipos locales
interface User {
  user_id: number;
  email: string;
  nombre: string;
  rol: 'administrador' | 'mecanico' | 'seguimiento';
  telefono?: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

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

interface Vehicle {
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
  fecha_registro: string;
  fecha_actualizacion: string;
  notas?: string;
  activo: boolean;
  customer?: Customer;
}

interface Opportunity {
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
  fecha_sugerida?: string;
  fecha_contacto_sugerida?: string;
  estado: 'pendiente' | 'contactado' | 'agendado' | 'en_proceso' | 'completado' | 'perdido';
  prioridad: 'alta' | 'media' | 'baja';
  origen: 'manual' | 'automatico' | 'historial' | 'kilometraje';
  kilometraje_referencia?: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  vehicle?: Vehicle;
  customer?: Customer;
}

const opportunitySchema = z.object({
  vin: z.string().min(1, 'Seleccione un vehículo'),
  customer_id: z.number().positive('Seleccione un cliente'),
  usuario_asignado: z.number().positive('Seleccione un usuario').optional(),
  tipo_oportunidad: z.string().min(1, 'Tipo de oportunidad requerido'),
  titulo: z.string().min(1, 'Título requerido'),
  descripcion: z.string().min(1, 'Descripción requerida'),
  servicio_sugerido: z.string().optional(),
  precio_estimado: z.number().positive('Precio debe ser positivo').optional(),
  fecha_sugerida: z.string().optional(),
  prioridad: z.enum(['alta', 'media', 'baja']),
  kilometraje_referencia: z.number().min(0, 'Kilometraje no puede ser negativo').optional(),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;

interface OpportunityFormProps {
  opportunity?: Opportunity;
  preselectedVin?: string;
  onSuccess?: (opportunity: Opportunity) => void;
  onCancel?: () => void;
}

const TIPOS_OPORTUNIDAD = [
  'mantenimiento_programado',
  'reparacion_diferida',
  'servicio_estacional',
  'afinacion',
  'cambio_aceite',
  'frenos',
  'suspension',
  'aire_acondicionado',
  'transmision',
  'otro',
];

const SERVICIOS_COMUNES = [
  'Cambio de aceite y filtro',
  'Afinación menor',
  'Afinación mayor',
  'Balanceo y rotación',
  'Cambio de frenos delanteros',
  'Cambio de frenos traseros',
  'Servicio de transmisión',
  'Revisión de suspensión',
  'Servicio de aire acondicionado',
  'Cambio de banda de distribución',
];

export const OpportunityForm = ({ opportunity, preselectedVin, onSuccess, onCancel }: OpportunityFormProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [vehicleSelected, setVehicleSelected] = useState(false);

  const isEditing = !!opportunity;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: opportunity ? {
      vin: opportunity.vin,
      customer_id: opportunity.customer_id,
      usuario_asignado: opportunity.usuario_asignado || undefined,
      tipo_oportunidad: opportunity.tipo_oportunidad,
      titulo: opportunity.titulo,
      descripcion: opportunity.descripcion,
      servicio_sugerido: opportunity.servicio_sugerido || '',
      precio_estimado: opportunity.precio_estimado || undefined,
      fecha_sugerida: opportunity.fecha_sugerida ? opportunity.fecha_sugerida.split('T')[0] : '',
      prioridad: opportunity.prioridad,
      kilometraje_referencia: opportunity.kilometraje_referencia || undefined,
    } : {
      vin: preselectedVin || '',
      prioridad: 'media',
    },
  });

  const selectedVin = watch('vin');

  // Cargar vehículo preseleccionado
  useEffect(() => {
    const loadPreselectedVehicle = async () => {
      if (preselectedVin) {
        try {
          const result = await vehicleService.getByVin(preselectedVin);
          setVehicle(result.vehicle);
          if (result.vehicle.customer_id) {
            setValue('customer_id', result.vehicle.customer_id);
          }
        } catch (error) {
          console.error('Error cargando vehículo preseleccionado:', error);
        }
      }
    };

    loadPreselectedVehicle();
  }, [preselectedVin, setValue]);

  // Buscar vehículos cuando se escribe
  useEffect(() => {
    const searchVehicles = async () => {
      if (vehicleSearch.length >= 2 && !vehicleSelected) {
        try {
          console.log('Buscando vehículos con:', vehicleSearch);
          // Buscar solo por placa y nombre del cliente
          const result = await vehicleService.search({ 
            placa: vehicleSearch,
            customer_name: vehicleSearch 
          });
          console.log('Resultado de búsqueda:', result);
          setVehicles(result.vehicles || []);
        } catch (error) {
          console.error('Error buscando vehículos:', error);
          setVehicles([]);
        }
      } else {
        setVehicles([]);
      }
    };

    const timeoutId = setTimeout(searchVehicles, 300);
    return () => clearTimeout(timeoutId);
  }, [vehicleSearch, vehicleSelected]);

  // Cargar información del vehículo cuando se selecciona
  useEffect(() => {
    const loadVehicleInfo = async () => {
      if (selectedVin && selectedVin.length === 17) {
        try {
          const result = await vehicleService.getByVin(selectedVin);
          setVehicle(result.vehicle);
          if (result.vehicle.customer_id) {
            setValue('customer_id', result.vehicle.customer_id);
            setValue('kilometraje_referencia', result.vehicle.kilometraje_actual);
          }
        } catch (error) {
          console.error('Error cargando información del vehículo:', error);
        }
      }
    };

    if (selectedVin !== preselectedVin) {
      loadVehicleInfo();
    }
  }, [selectedVin, setValue, preselectedVin]);

  // Cargar clientes para dropdown
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const result = await customerService.search({ limit: 100 });
        setCustomers(result.customers || []);
      } catch (error) {
        console.error('Error cargando clientes:', error);
      }
    };

    loadCustomers();
  }, []);

  // Cargar usuarios para asignación
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Para usuarios, necesitaríamos un endpoint específico
        // Por ahora solo incluimos al usuario actual
        if (user) {
          setUsers([user]);
        }
      } catch (error) {
        console.error('Error cargando usuarios:', error);
      }
    };

    loadUsers();
  }, [user]);

  const onSubmit = async (data: OpportunityFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Filtrar campos vacíos
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '' && value !== undefined && value !== null)
      );

      let result;
      if (isEditing) {
        result = await opportunityService.update(opportunity.opportunity_id, cleanData);
      } else {
        result = await opportunityService.create(cleanData);
      }

      onSuccess?.(result.opportunity);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la oportunidad');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/^\+52/, '');
    return `https://wa.me/52${cleanPhone}`;
  };

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Editar Oportunidad' : 'Crear Nueva Oportunidad'}
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

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        {/* Selección de vehículo */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Vehículo</h3>
          
          {!preselectedVin && (
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Buscar vehículo (placas o cliente)
              </label>
              <input
                type="text"
                value={vehicleSearch}
                onChange={(e) => {
                  setVehicleSearch(e.target.value);
                  if (vehicleSelected) {
                    setVehicleSelected(false);
                  }
                }}
                className="input-field"
                placeholder="ABC-123-A o Juan Pérez"
              />
              
              {vehicleSearch.length >= 2 && !vehicleSelected && (
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                  {vehicles.length > 0 ? (
                    vehicles.map((v) => (
                      <button
                        key={v.vin}
                        type="button"
                        onClick={() => {
                          console.log('Seleccionando vehículo:', v);
                          setValue('vin', v.vin);
                          setVehicleSearch(`${v.marca} ${v.modelo} - ${v.placa_actual}`);
                          setVehicles([]);
                          setVehicleSelected(true);
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="font-medium">{v.marca} {v.modelo} {v.año}</div>
                        <div className="text-sm text-gray-600">
                          {v.placa_actual} • VIN: {v.vin} • {v.customer?.nombre}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-500 text-sm">
                      No se encontraron vehículos con "{vehicleSearch}"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {vehicle && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                {vehicle.marca} {vehicle.modelo} {vehicle.año}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p><span className="font-medium">Placas:</span> {vehicle.placa_actual || 'No asignadas'}</p>
                  <p><span className="font-medium">VIN:</span> {vehicle.vin}</p>
                </div>
                <div>
                  <p><span className="font-medium">Kilometraje:</span> {vehicle.kilometraje_actual?.toLocaleString()} km</p>
                  <p><span className="font-medium">Propietario:</span> {vehicle.customer?.nombre || 'No asignado'}</p>
                </div>
              </div>
              
              {vehicle.customer?.whatsapp && (
                <div className="mt-2">
                  <a
                    href={formatPhoneForWhatsApp(vehicle.customer.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    💬 Contactar por WhatsApp
                  </a>
                </div>
              )}
            </div>
          )}

          <input type="hidden" {...register('vin')} />
          {errors.vin && (
            <p className="mt-1 text-sm text-red-600">{errors.vin.message}</p>
          )}
        </div>

        {/* Información de la oportunidad */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información de la Oportunidad</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de oportunidad *
              </label>
              <select {...register('tipo_oportunidad')} className="input-field">
                <option value="">Seleccionar tipo</option>
                {TIPOS_OPORTUNIDAD.map(tipo => (
                  <option key={tipo} value={tipo}>
                    {tipo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
              {errors.tipo_oportunidad && (
                <p className="mt-1 text-sm text-red-600">{errors.tipo_oportunidad.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <select {...register('prioridad')} className="input-field">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              {...register('titulo')}
              type="text"
              className="input-field"
              placeholder="Cambio de aceite programado, reparación de frenos, etc."
            />
            {errors.titulo && (
              <p className="mt-1 text-sm text-red-600">{errors.titulo.message}</p>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <textarea
              {...register('descripcion')}
              rows={3}
              className="input-field"
              placeholder="Descripción detallada del servicio necesario..."
            />
            {errors.descripcion && (
              <p className="mt-1 text-sm text-red-600">{errors.descripcion.message}</p>
            )}
          </div>
        </div>

        {/* Detalles del servicio */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Detalles del Servicio</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Servicio sugerido
              </label>
              <select 
                {...register('servicio_sugerido')}
                className="input-field"
                onChange={(e) => {
                  if (e.target.value && !watch('titulo')) {
                    setValue('titulo', e.target.value);
                  }
                }}
              >
                <option value="">Seleccionar servicio</option>
                {SERVICIOS_COMUNES.map(servicio => (
                  <option key={servicio} value={servicio}>{servicio}</option>
                ))}
                <option value="otro">Otro (especificar en título)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio estimado (MXN)
              </label>
              <input
                {...register('precio_estimado', { valueAsNumber: true })}
                type="number"
                className="input-field"
                placeholder="450.00"
                step="0.01"
                min="0"
              />
              {errors.precio_estimado && (
                <p className="mt-1 text-sm text-red-600">{errors.precio_estimado.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha sugerida para el servicio
              </label>
              <input
                {...register('fecha_sugerida')}
                type="date"
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kilometraje de referencia
              </label>
              <input
                {...register('kilometraje_referencia', { valueAsNumber: true })}
                type="number"
                className="input-field"
                placeholder={vehicle?.kilometraje_actual?.toString() || '0'}
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Asignación */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Asignación</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente *
              </label>
              <select {...register('customer_id', { valueAsNumber: true })} className="input-field">
                <option value="">Seleccionar cliente</option>
                {customers.map(customer => (
                  <option key={customer.customer_id} value={customer.customer_id}>
                    {customer.nombre} - {customer.telefono}
                  </option>
                ))}
              </select>
              {errors.customer_id && (
                <p className="mt-1 text-sm text-red-600">{errors.customer_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asignar a
              </label>
              <select {...register('usuario_asignado', { valueAsNumber: true })} className="input-field">
                <option value="">Sin asignar</option>
                {users.map(u => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.nombre} ({u.rol})
                  </option>
                ))}
              </select>
            </div>
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
              ? (isEditing ? 'Actualizando...' : 'Creando...') 
              : (isEditing ? 'Actualizar Oportunidad' : 'Crear Oportunidad')
            }
          </button>
        </div>
      </form>
    </div>
  );
};