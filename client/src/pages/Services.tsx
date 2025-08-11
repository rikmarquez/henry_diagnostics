import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { serviceService } from '../services/services';
import { useAuth } from '../hooks/useAuth';

import type { Service, ServiceFilters } from '../services/services';

type ViewMode = 'list' | 'detail';

export const Services = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const canUpdateServices = user?.rol === 'administrador' || user?.rol === 'mecanico';

  const { register, watch, reset } = useForm<ServiceFilters>();
  const filters = watch();

  // Cargar servicios al iniciar
  useEffect(() => {
    loadServices();
  }, []);

  // Recargar cuando cambien los filtros
  useEffect(() => {
    if (Object.values(filters).some(value => value)) {
      setPagination(prev => ({ ...prev, page: 1 }));
      loadServices();
    }
  }, [filters]);

  const loadServices = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value && value !== '')
      );
      
      const result = await serviceService.getServices(cleanFilters, page, pagination.limit);
      setServices(result.services || []);
      setPagination({
        page: result.pagination?.page || 1,
        limit: result.pagination?.limit || 20,
        total: result.pagination?.total || 0,
        totalPages: result.pagination?.totalPages || 0
      });
    } catch (err: any) {
      console.error('Error cargando servicios:', err);
      setError(err.response?.data?.message || 'Error al cargar servicios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setViewMode('detail');
  };

  const handleStatusChange = async (serviceId: number, newStatus: Service['estado']) => {
    try {
      await serviceService.updateServiceStatus(serviceId, newStatus);
      loadServices(pagination.page);
      if (selectedService && selectedService.service_id === serviceId) {
        setSelectedService({ ...selectedService, estado: newStatus });
      }
    } catch (err: any) {
      console.error('Error cambiando estado:', err);
      setError(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const clearFilters = () => {
    reset();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadServices();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'cotizado': return 'bg-yellow-100 text-yellow-800';
      case 'autorizado': return 'bg-blue-100 text-blue-800';
      case 'en_proceso': return 'bg-purple-100 text-purple-800';
      case 'completado': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (estado: string) => {
    switch (estado) {
      case 'cotizado': return 'Cotizado';
      case 'autorizado': return 'Autorizado';
      case 'en_proceso': return 'En Proceso';
      case 'completado': return 'Completado';
      case 'cancelado': return 'Cancelado';
      default: return estado;
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'detail':
        return (
          <div className="space-y-6">
            {/* Botón de regreso */}
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              ← Regresar a servicios
            </button>

            {/* Detalle del servicio */}
            <div className="card p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Servicio #{selectedService?.service_id}
                  </h2>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedService?.estado || '')}`}>
                      {getStatusLabel(selectedService?.estado || '')}
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      {selectedService?.precio ? formatCurrency(selectedService.precio) : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Información del Servicio</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Tipo:</span> {selectedService?.tipo_servicio}</p>
                    <p><span className="font-medium">Descripción:</span> {selectedService?.descripcion}</p>
                    <p><span className="font-medium">Fecha:</span> {selectedService?.fecha_servicio ? new Date(selectedService.fecha_servicio).toLocaleDateString('es-MX') : ''}</p>
                    {selectedService?.kilometraje_servicio && (
                      <p><span className="font-medium">Kilometraje:</span> {selectedService.kilometraje_servicio.toLocaleString()} km</p>
                    )}
                    {selectedService?.refacciones_usadas && (
                      <p><span className="font-medium">Refacciones:</span> {selectedService.refacciones_usadas}</p>
                    )}
                    {selectedService?.notas && (
                      <p><span className="font-medium">Notas:</span> {selectedService.notas}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Cliente y Vehículo</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Cliente:</span> {selectedService?.cliente_nombre || 'N/A'}</p>
                    {selectedService?.cliente_telefono && (
                      <p><span className="font-medium">Teléfono:</span> {selectedService.cliente_telefono}</p>
                    )}
                    <p><span className="font-medium">Vehículo:</span> {selectedService?.vehiculo_marca} {selectedService?.vehiculo_modelo} {selectedService?.vehiculo_año}</p>
                    {selectedService?.placa_actual && (
                      <p><span className="font-medium">Placas:</span> {selectedService.placa_actual}</p>
                    )}
                    {selectedService?.mecanico_nombre && (
                      <p><span className="font-medium">Mecánico:</span> {selectedService.mecanico_nombre}</p>
                    )}
                    {selectedService?.sucursal_nombre && (
                      <p><span className="font-medium">Sucursal:</span> {selectedService.sucursal_nombre}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información de seguimiento */}
              {(selectedService?.proximo_servicio_km || selectedService?.proximo_servicio_fecha) && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Próximo Servicio</h3>
                  <div className="text-sm space-y-1">
                    {selectedService?.proximo_servicio_km && (
                      <p><span className="font-medium">Kilometraje:</span> {selectedService.proximo_servicio_km.toLocaleString()} km</p>
                    )}
                    {selectedService?.proximo_servicio_fecha && (
                      <p><span className="font-medium">Fecha sugerida:</span> {new Date(selectedService.proximo_servicio_fecha).toLocaleDateString('es-MX')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Cambio de estado */}
              {canUpdateServices && selectedService?.estado !== 'completado' && selectedService?.estado !== 'cancelado' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Cambiar Estado</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedService?.estado === 'cotizado' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(selectedService.service_id, 'autorizado')}
                          className="btn-primary text-sm"
                        >
                          Autorizar
                        </button>
                        <button
                          onClick={() => handleStatusChange(selectedService.service_id, 'cancelado')}
                          className="btn-secondary text-sm"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    {selectedService?.estado === 'autorizado' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(selectedService.service_id, 'en_proceso')}
                          className="btn-primary text-sm"
                        >
                          Iniciar Trabajo
                        </button>
                        <button
                          onClick={() => handleStatusChange(selectedService.service_id, 'cancelado')}
                          className="btn-secondary text-sm"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    {selectedService?.estado === 'en_proceso' && (
                      <button
                        onClick={() => handleStatusChange(selectedService.service_id, 'completado')}
                        className="btn-primary text-sm"
                      >
                        Completar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* Filtros y acciones */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Servicios
                </h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn-secondary text-sm"
                >
                  {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                </button>
              </div>

              {/* Filtros */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select {...register('estado')} className="input-field text-sm">
                      <option value="">Todos</option>
                      <option value="cotizado">Cotizado</option>
                      <option value="autorizado">Autorizado</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <input
                      {...register('cliente')}
                      type="text"
                      placeholder="Buscar por nombre..."
                      className="input-field text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                    <input
                      {...register('fecha_desde')}
                      type="date"
                      className="input-field text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                    <input
                      {...register('fecha_hasta')}
                      type="date"
                      className="input-field text-sm"
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-4">
                    <button
                      onClick={clearFilters}
                      className="btn-secondary text-sm"
                    >
                      Limpiar Filtros
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de servicios */}
            {error && (
              <div className="card p-4 bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando servicios...</p>
              </div>
            ) : services.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {pagination.total} servicios encontrados (página {pagination.page} de {pagination.totalPages})
                </h3>
                
                {/* Lista de servicios */}
                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.service_id} className="card p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleServiceSelect(service)}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Servicio #{service.service_id} - {service.tipo_servicio}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">{service.descripcion}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>📅 {new Date(service.fecha_servicio).toLocaleDateString('es-MX')}</span>
                            <span>👤 {service.cliente_nombre || 'Cliente no disponible'}</span>
                            <span>🚗 {service.vehiculo_marca} {service.vehiculo_modelo}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${getStatusColor(service.estado)}`}>
                            {getStatusLabel(service.estado)}
                          </span>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(service.precio)}
                          </p>
                        </div>
                      </div>
                      
                      {service.notas && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          <span className="font-medium">Notas:</span> {service.notas}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Paginación */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center space-x-2 mt-6">
                    <button
                      onClick={() => loadServices(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Anterior
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => loadServices(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-gray-600">No hay servicios que coincidan con los filtros</p>
                {Object.values(filters).some(value => value) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 btn-secondary text-sm"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </div>
    </div>
  );
};