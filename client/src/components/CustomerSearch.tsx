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

const searchSchema = z.object({
  searchType: z.enum(['nombre', 'telefono', 'email']),
  searchValue: z.string().min(1, 'Valor de búsqueda requerido'),
});

type SearchData = z.infer<typeof searchSchema>;

interface CustomerSearchProps {
  onCustomerSelect?: (customer: Customer) => void;
  onCreateNew?: () => void;
}

export const CustomerSearch = ({ onCustomerSelect, onCreateNew }: CustomerSearchProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SearchData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      searchType: 'nombre',
    },
  });

  const searchType = watch('searchType');

  const getPlaceholder = () => {
    switch (searchType) {
      case 'nombre':
        return 'Juan Pérez';
      case 'telefono':
        return '+5215512345678';
      case 'email':
        return 'juan@email.com';
      default:
        return '';
    }
  };

  const onSubmit = async (data: SearchData) => {
    setIsLoading(true);
    setError(null);
    setCustomers([]);

    try {
      let result;
      
      switch (data.searchType) {
        case 'nombre':
          result = await customerService.searchByName(data.searchValue);
          break;
        case 'telefono':
          result = await customerService.searchByPhone(data.searchValue);
          break;
        case 'email':
          result = await customerService.search({ email: data.searchValue });
          break;
        default:
          throw new Error('Tipo de búsqueda no válido');
      }

      setCustomers(result.customers || []);
      
      if (result.customers?.length === 0) {
        setError('No se encontraron clientes que coincidan con la búsqueda');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al buscar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllCustomers = async () => {
    setIsLoading(true);
    setError(null);
    setCustomers([]);

    try {
      const result = await customerService.getAll(100); // Cargar hasta 100 clientes
      setCustomers(result.customers || []);
      
      if (result.customers?.length === 0) {
        setError('No hay clientes registrados en el sistema');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/^\+52/, '');
    return `https://wa.me/52${cleanPhone}`;
  };

  const formatPhone = (phone: string) => {
    // Formatear +5215512345678 como +52 55 1234 5678
    if (phone.length === 13 && phone.startsWith('+52')) {
      return `+52 ${phone.slice(3, 5)} ${phone.slice(5, 9)} ${phone.slice(9)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      {/* Formulario de búsqueda */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Búsqueda de Clientes
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de búsqueda
              </label>
              <select {...register('searchType')} className="input-field">
                <option value="nombre">Por Nombre</option>
                <option value="telefono">Por Teléfono</option>
                <option value="email">Por Email</option>
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
                  onClick={loadAllCustomers}
                  disabled={isLoading}
                  className="btn-secondary px-6 disabled:opacity-50"
                >
                  Ver Todos
                </button>
              </div>
              {errors.searchValue && (
                <p className="mt-1 text-sm text-red-600">{errors.searchValue.message}</p>
              )}
            </div>
          </div>
        </form>

        {onCreateNew && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={onCreateNew}
              className="btn-secondary"
            >
              + Registrar Nuevo Cliente
            </button>
          </div>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {error && (
        <div className="card p-4 bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {customers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Resultados ({customers.length})
          </h3>
          
          {customers.map((customer) => (
            <div
              key={customer.customer_id}
              className="card p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onCustomerSelect?.(customer)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {customer.nombre}
                    </h4>
                    {customer.rfc && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        RFC: {customer.rfc}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span>📞</span>
                        <span>{formatPhone(customer.telefono)}</span>
                      </div>
                      
                      {customer.whatsapp && customer.whatsapp !== customer.telefono && (
                        <div className="flex items-center space-x-2">
                          <span>💬</span>
                          <span>{formatPhone(customer.whatsapp)}</span>
                        </div>
                      )}
                      
                      {customer.email && (
                        <div className="flex items-center space-x-2">
                          <span>✉️</span>
                          <span>{customer.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      {customer.direccion && (
                        <div className="flex items-start space-x-2">
                          <span>📍</span>
                          <span className="line-clamp-2">{customer.direccion}</span>
                        </div>
                      )}
                      
                      {customer.codigo_postal && (
                        <div className="flex items-center space-x-2">
                          <span>📮</span>
                          <span>CP: {customer.codigo_postal}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones rápidas */}
                  <div className="mt-3 flex items-center space-x-4">
                    {customer.whatsapp && (
                      <a
                        href={formatPhoneForWhatsApp(customer.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 font-medium text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        💬 WhatsApp
                      </a>
                    )}
                    
                    <a
                      href={`tel:${customer.telefono}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      📞 Llamar
                    </a>
                    
                    {customer.email && (
                      <a
                        href={`mailto:${customer.email}`}
                        className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ✉️ Email
                      </a>
                    )}
                  </div>

                  {customer.notas && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 italic">"{customer.notas}"</p>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-500">
                    Registrado: {new Date(customer.fecha_registro).toLocaleDateString('es-MX')}
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