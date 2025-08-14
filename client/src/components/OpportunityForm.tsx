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
  vehicle_id: number;
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
  vehicle_id: z.number().positive('Seleccione un vehículo'),
  customer_id: z.number().positive('Seleccione un cliente'),
  tipo_oportunidad: z.string().min(1, 'Tipo de oportunidad requerido'),
  descripcion: z.string().min(1, 'Nota requerida'),
  precio_estimado: z.number().positive('Precio debe ser positivo').optional(),
  fecha_sugerida: z.string().optional(),
  prioridad: z.enum(['alta', 'media', 'baja']),
  kilometraje_referencia: z.number().min(0, 'Kilometraje no puede ser negativo').optional(),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;

interface OpportunityFormProps {
  opportunity?: Opportunity;
  preselectedVehicleId?: number;
  onSuccess?: (opportunity: Opportunity) => void;
  onCancel?: () => void;
}

const TIPOS_OPORTUNIDAD = [
  'afinacion_mayor',
  'cambio_aceite',
  'servicio_frenos',
  'suspension',
  'direccion',
  'alineacion',
];


export const OpportunityForm = ({ opportunity, preselectedVehicleId, onSuccess, onCancel }: OpportunityFormProps) => {
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
      vehicle_id: opportunity.vehicle_id,
      customer_id: opportunity.customer_id,
      tipo_oportunidad: opportunity.tipo_oportunidad,
      descripcion: opportunity.descripcion,
      precio_estimado: opportunity.precio_estimado || undefined,
      fecha_sugerida: opportunity.fecha_sugerida ? opportunity.fecha_sugerida.split('T')[0] : '',
      prioridad: opportunity.prioridad,
      kilometraje_referencia: opportunity.kilometraje_referencia || undefined,
    } : {
      vehicle_id: preselectedVehicleId || undefined,
      prioridad: 'media',
    },
  });

  const selectedVehicleId = watch('vehicle_id');
  const selectedCustomerId = watch('customer_id');

  // Cargar vehículo preseleccionado
  useEffect(() => {
    const loadPreselectedVehicle = async () => {
      if (preselectedVehicleId) {
        try {
          const result = await vehicleService.getById(preselectedVehicleId);
          setVehicle(result.vehicle);
          setVehicleSelected(true);
          if (result.vehicle.customer_id) {
            console.log('🔧 Auto-seleccionando cliente del vehículo:', result.vehicle.customer?.nombre);
            setValue('customer_id', result.vehicle.customer_id);
          }
        } catch (error) {
          console.error('Error cargando vehículo preseleccionado:', error);
        }
      }
    };

    loadPreselectedVehicle();
  }, [preselectedVehicleId, setValue]);

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
      if (selectedVehicleId && selectedVehicleId !== preselectedVehicleId) {
        try {
          const result = await vehicleService.getById(selectedVehicleId);
          setVehicle(result.vehicle);
          if (result.vehicle.customer_id) {
            console.log('🔧 Auto-seleccionando cliente del vehículo:', result.vehicle.customer?.nombre);
            setValue('customer_id', result.vehicle.customer_id);
            setValue('kilometraje_referencia', result.vehicle.kilometraje_actual);
          }
        } catch (error) {
          console.error('Error cargando información del vehículo:', error);
        }
      }
    };

    loadVehicleInfo();
  }, [selectedVehicleId, setValue, preselectedVehicleId]);

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
          
          {!preselectedVehicleId && (
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
                        key={v.vehicle_id}
                        type="button"
                        onClick={() => {
                          console.log('Seleccionando vehículo:', v);
                          setValue('vehicle_id', v.vehicle_id);
                          setVehicleSearch(`${v.marca} ${v.modelo} - ${v.placa_actual}`);
                          setVehicles([]);
                          setVehicleSelected(true);
                          // Auto-seleccionar cliente si existe
                          if (v.customer_id) {
                            console.log('🔧 Auto-seleccionando cliente:', v.customer?.nombre);
                            setValue('customer_id', v.customer_id);
                          }
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="font-medium">{v.marca} {v.modelo} {v.año}</div>
                        <div className="text-sm text-gray-600">
                          {v.placa_actual} • VIN: {v.vin || 'No registrado'} • {v.customer?.nombre}
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

          <input type="hidden" {...register('vehicle_id', { valueAsNumber: true })} />
          {errors.vehicle_id && (
            <p className="mt-1 text-sm text-red-600">{errors.vehicle_id.message}</p>
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
              Nota *
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
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kilometraje sugerido
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

        {/* Cliente - Movido aquí para estar junto al vehículo */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cliente</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente *
            </label>
            
            {/* Mostrar cliente auto-seleccionado */}
            {selectedCustomerId && vehicle?.customer?.nombre && (
              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                ✅ <strong>Auto-seleccionado:</strong> {vehicle.customer.nombre}
              </div>
            )}
            
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