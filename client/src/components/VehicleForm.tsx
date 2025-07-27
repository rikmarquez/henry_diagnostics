import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { vehicleService } from '../services/vehicles';
import { customerService } from '../services/customers';
import { BarcodeScanner } from './BarcodeScanner';

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

const vehicleSchema = z.object({
  vin: z.string().optional().or(z.literal('')),
  marca: z.string().min(1, 'Marca requerida'),
  modelo: z.string().min(1, 'Modelo requerido'),
  año: z.number().int().min(1900).max(new Date().getFullYear() + 1, 'Año inválido'),
  placa_actual: z.string().min(1, 'Placa requerida'),
  customer_id: z.number().optional(),
  kilometraje_actual: z.number().min(0, 'Kilometraje no puede ser negativo'),
  color: z.string().optional(),
  numero_motor: z.string().optional(),
  tipo_combustible: z.enum(['gasolina', 'diesel', 'hibrido', 'electrico']),
  transmision: z.enum(['manual', 'automatica']),
  notas: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  vehicle?: Vehicle;
  onSuccess?: (vehicle: Vehicle) => void;
  onCancel?: () => void;
}

const MARCAS_POPULARES = [
  'Nissan', 'Volkswagen', 'Chevrolet', 'Ford', 'Honda', 'Toyota', 
  'Hyundai', 'Kia', 'Mazda', 'Mitsubishi', 'Suzuki', 'Jeep'
];

export const VehicleForm = ({ vehicle, onSuccess, onCancel }: VehicleFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const isEditing = !!vehicle;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle ? {
      vin: vehicle.vin,
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      año: vehicle.año,
      placa_actual: vehicle.placa_actual || '',
      customer_id: vehicle.customer_id || undefined,
      kilometraje_actual: vehicle.kilometraje_actual,
      color: vehicle.color || '',
      numero_motor: vehicle.numero_motor || '',
      tipo_combustible: vehicle.tipo_combustible,
      transmision: vehicle.transmision,
      notas: vehicle.notas || '',
    } : {
      kilometraje_actual: 0,
      tipo_combustible: 'gasolina',
      transmision: 'manual',
    },
  });

  const selectedCustomerId = watch('customer_id');

  // Buscar clientes cuando se escribe en el campo de búsqueda
  useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearch.length >= 2) {
        try {
          const result = await customerService.searchByName(customerSearch);
          setCustomers(result.customers || []);
        } catch (error) {
          console.error('Error buscando clientes:', error);
        }
      } else {
        setCustomers([]);
      }
    };

    const timeoutId = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timeoutId);
  }, [customerSearch]);

  const onSubmit = async (data: VehicleFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Filtrar campos vacíos
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '' && value !== undefined)
      );

      let result;
      if (isEditing) {
        result = await vehicleService.update(vehicle.vin, cleanData);
      } else {
        result = await vehicleService.create(cleanData);
      }

      onSuccess?.(result.vehicle);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el vehículo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanResult = (scannedVin: string) => {
    setValue('vin', scannedVin);
    setShowScanner(false);
  };

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}
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
        {/* Información principal del vehículo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              VIN
            </label>
            <div className="flex space-x-2">
              <input
                {...register('vin')}
                type="text"
                className="input-field uppercase flex-1"
                placeholder="Número de identificación del vehículo (opcional)"
                disabled={isEditing}
              />
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 whitespace-nowrap"
                  title="Escanear código de barras VIN"
                >
                  <span>📷</span>
                  <span className="hidden sm:inline">Escanear VIN</span>
                </button>
              )}
            </div>
            {errors.vin && (
              <p className="mt-1 text-sm text-red-600">{errors.vin.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placas *
            </label>
            <input
              {...register('placa_actual')}
              type="text"
              className="input-field uppercase"
              placeholder="Placas del vehículo"
            />
            {errors.placa_actual && (
              <p className="mt-1 text-sm text-red-600">{errors.placa_actual.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca *
            </label>
            <select {...register('marca')} className="input-field">
              <option value="">Seleccionar marca</option>
              {MARCAS_POPULARES.map(marca => (
                <option key={marca} value={marca}>{marca}</option>
              ))}
              <option value="Otra">Otra</option>
            </select>
            {errors.marca && (
              <p className="mt-1 text-sm text-red-600">{errors.marca.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modelo *
            </label>
            <input
              {...register('modelo')}
              type="text"
              className="input-field"
              placeholder="Tsuru, Jetta, Aveo..."
            />
            {errors.modelo && (
              <p className="mt-1 text-sm text-red-600">{errors.modelo.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año *
            </label>
            <input
              {...register('año', { valueAsNumber: true })}
              type="number"
              className="input-field"
              min="1900"
              max={new Date().getFullYear() + 1}
            />
            {errors.año && (
              <p className="mt-1 text-sm text-red-600">{errors.año.message}</p>
            )}
          </div>
        </div>

        {/* Información técnica */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kilometraje actual
            </label>
            <input
              {...register('kilometraje_actual', { valueAsNumber: true })}
              type="number"
              className="input-field"
              min="0"
              placeholder="150000"
            />
            {errors.kilometraje_actual && (
              <p className="mt-1 text-sm text-red-600">{errors.kilometraje_actual.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de combustible
            </label>
            <select {...register('tipo_combustible')} className="input-field">
              <option value="gasolina">Gasolina</option>
              <option value="diesel">Diesel</option>
              <option value="hibrido">Híbrido</option>
              <option value="electrico">Eléctrico</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transmisión
            </label>
            <select {...register('transmision')} className="input-field">
              <option value="manual">Manual</option>
              <option value="automatica">Automática</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              {...register('color')}
              type="text"
              className="input-field"
              placeholder="Blanco, Azul, Rojo..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de motor
            </label>
            <input
              {...register('numero_motor')}
              type="text"
              className="input-field"
              placeholder="A15123456"
            />
          </div>
        </div>

        {/* Asignación de cliente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Propietario
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="input-field"
              placeholder="Buscar cliente por nombre..."
            />
            
            {customers.length > 0 && (
              <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                {customers.map((customer) => (
                  <button
                    key={customer.customer_id}
                    type="button"
                    onClick={() => {
                      setValue('customer_id', customer.customer_id);
                      setCustomerSearch(customer.nombre);
                      setCustomers([]);
                    }}
                    className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0 ${
                      selectedCustomerId === customer.customer_id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="font-medium">{customer.nombre}</div>
                    <div className="text-sm text-gray-600">{customer.telefono}</div>
                  </button>
                ))}
              </div>
            )}
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
            placeholder="Información adicional sobre el vehículo..."
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
              : (isEditing ? 'Actualizar Vehículo' : 'Registrar Vehículo')
            }
          </button>
        </div>
      </form>

      <BarcodeScanner
        isOpen={showScanner}
        onResult={handleScanResult}
        onClose={() => setShowScanner(false)}
      />
    </div>
  );
};