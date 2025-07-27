import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { vehicleService } from '../services/vehicles';

// Tipos locales
interface Customer {
  customer_id: number;
  nombre: string;
  telefono: string;
  whatsapp?: string;
  email?: string;
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

const searchSchema = z.object({
  searchType: z.enum(['placa', 'vin', 'cliente']),
  searchValue: z.string().min(1, 'Valor de búsqueda requerido'),
});

type SearchData = z.infer<typeof searchSchema>;

interface VehicleSearchProps {
  onVehicleSelect?: (vehicle: Vehicle) => void;
  onCreateNew?: () => void;
}

export const VehicleSearch = ({ onVehicleSelect, onCreateNew }: VehicleSearchProps) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SearchData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      searchType: 'placa',
    },
  });

  // Check for search results from dashboard
  useEffect(() => {
    const savedResults = localStorage.getItem('vehicleSearchResults');
    const savedQuery = localStorage.getItem('vehicleSearchQuery');
    
    if (savedResults && savedQuery) {
      try {
        const results = JSON.parse(savedResults);
        setVehicles(results);
        setValue('searchType', 'placa');
        setValue('searchValue', savedQuery);
        
        // Clear localStorage after using the data
        localStorage.removeItem('vehicleSearchResults');
        localStorage.removeItem('vehicleSearchQuery');
      } catch (error) {
        console.error('Error parsing saved search results:', error);
      }
    }
  }, [setValue]);

  const searchType = watch('searchType');

  const getPlaceholder = () => {
    switch (searchType) {
      case 'placa':
        return 'ABC-123-A';
      case 'vin':
        return '1N4BL11D85C123456';
      case 'cliente':
        return 'Juan Pérez';
      default:
        return '';
    }
  };

  const onSubmit = async (data: SearchData) => {
    setIsLoading(true);
    setError(null);
    setVehicles([]);

    try {
      let result;
      
      switch (data.searchType) {
        case 'placa':
          result = await vehicleService.searchByPlate(data.searchValue);
          break;
        case 'vin':
          if (data.searchValue.length === 17) {
            // Si es un VIN completo, buscar directamente
            const vehicleResult = await vehicleService.getByVin(data.searchValue);
            result = { vehicles: [vehicleResult.vehicle], total: 1 };
          } else {
            // Si es parcial, usar búsqueda general
            result = await vehicleService.search({ vin: data.searchValue });
          }
          break;
        case 'cliente':
          result = await vehicleService.searchByCustomer(data.searchValue);
          break;
        default:
          throw new Error('Tipo de búsqueda no válido');
      }

      setVehicles(result.vehicles || []);
      
      if (result.vehicles?.length === 0) {
        setError('No se encontraron vehículos que coincidan con la búsqueda');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al buscar vehículos');
    } finally {
      setIsLoading(false);
    }
  };

  const listAllVehicles = async () => {
    setIsLoading(true);
    setError(null);
    setVehicles([]);

    try {
      // Buscar sin filtros para obtener todos los vehículos
      const result = await vehicleService.search({});
      setVehicles(result.vehicles || []);
      
      if (result.vehicles?.length === 0) {
        setError('No hay vehículos registrados en el sistema');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar vehículos');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remover +52 si existe y formatear para WhatsApp
    const cleanPhone = phone.replace(/^\+52/, '');
    return `https://wa.me/52${cleanPhone}`;
  };

  return (
    <div className="space-y-6">
      {/* Formulario de búsqueda */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Búsqueda de Vehículos
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de búsqueda
              </label>
              <select {...register('searchType')} className="input-field">
                <option value="placa">Por Placas</option>
                <option value="vin">Por VIN</option>
                <option value="cliente">Por Cliente</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor a buscar
              </label>
              <div className="flex space-x-2">
                <input
                  {...register('searchValue')}
                  type="text"
                  className="input-field flex-1"
                  placeholder={getPlaceholder()}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary px-6 disabled:opacity-50"
                >
                  {isLoading ? 'Buscando...' : 'Buscar'}
                </button>
                <button
                  type="button"
                  onClick={() => listAllVehicles()}
                  disabled={isLoading}
                  className="btn-secondary px-6 disabled:opacity-50"
                >
                  {isLoading ? 'Cargando...' : 'Listar Todos'}
                </button>
              </div>
              {errors.searchValue && (
                <p className="mt-1 text-sm text-red-600">{errors.searchValue.message}</p>
              )}
            </div>
          </div>
        </form>

        {/* ALWAYS SHOW BUTTON FOR DEBUGGING */}
        <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                console.log('🔘 VehicleSearch button clicked');
                console.log('onCreateNew function:', onCreateNew);
                if (onCreateNew) {
                  onCreateNew();
                } else {
                  console.log('❌ onCreateNew is undefined');
                }
              }}
              className="btn-secondary"
            >
              + Registrar Nuevo Vehículo
            </button>
          </div>
      </div>

      {/* Resultados de búsqueda */}
      {error && (
        <div className="card p-4 bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {vehicles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Resultados ({vehicles.length})
          </h3>
          
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.vin}
              className="card p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onVehicleSelect?.(vehicle)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {vehicle.marca} {vehicle.modelo} {vehicle.año}
                    </h4>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {vehicle.placa_actual || 'Sin placas'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">VIN:</span> {vehicle.vin}
                    </div>
                    <div>
                      <span className="font-medium">Kilometraje:</span> {vehicle.kilometraje_actual?.toLocaleString()} km
                    </div>
                    <div>
                      <span className="font-medium">Propietario:</span> {vehicle.customer?.nombre || 'No asignado'}
                    </div>
                  </div>

                  {vehicle.customer && (
                    <div className="mt-2 flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">
                        📞 {vehicle.customer.telefono}
                      </span>
                      {vehicle.customer.whatsapp && (
                        <a
                          href={formatPhoneForWhatsApp(vehicle.customer.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          💬 WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-500">
                    Último registro: {new Date(vehicle.fecha_actualizacion).toLocaleDateString('es-MX')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};