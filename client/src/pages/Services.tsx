import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { serviceService } from '../services/services';
import { useAuth } from '../hooks/useAuth';

import type { Service, ServiceFilters } from '../services/services';

type ViewMode = 'list' | 'detail' | 'edit';

export const Services = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [mechanics, setMechanics] = useState<Array<{
    mechanic_id: number;
    nombre: string;
    apellidos: string;
    alias?: string;
    branch_nombre: string;
    nivel_experiencia: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [historialMode, setHistorialMode] = useState<{
    active: boolean;
    customerId?: number;
    customerName?: string;
  }>({ active: false });

  const canUpdateServices = user?.rol === 'administrador' || user?.rol === 'mecanico';

  const { register, watch, reset, handleSubmit, setValue } = useForm<ServiceFilters>();
  const filters = watch();

  // Funciones helper para filtros rápidos de fecha
  const getDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const applyQuickDateFilter = (desde: Date, hasta: Date) => {
    setValue('fecha_desde', getDateString(desde));
    setValue('fecha_hasta', getDateString(hasta));
    setValue('estado', '');
    setValue('cliente', '');
    setPagination(prev => ({ ...prev, page: 1 }));
    
    setTimeout(() => {
      loadServices();
    }, 100);
  };

  const backToNormalView = () => {
    // Limpiar todos los filtros y regresar a vista normal inteligente
    reset();
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => {
      loadServices();
    }, 100);
  };

  const quickFilters = {
    yesterday: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      applyQuickDateFilter(yesterday, yesterday);
    },
    currentWeek: () => {
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      applyQuickDateFilter(monday, today);
    },
    currentMonth: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      applyQuickDateFilter(firstDay, today);
    },
    last7Days: () => {
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      applyQuickDateFilter(sevenDaysAgo, today);
    },
    last30Days: () => {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      applyQuickDateFilter(thirtyDaysAgo, today);
    }
  };

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, formState: { isSubmitting } } = useForm<Partial<Service>>();

  // Cargar servicios y mecánicos al iniciar
  useEffect(() => {
    loadServices();
    loadMechanics();
  }, []);

  // Función para ejecutar búsqueda manual
  const handleSearch = (data: ServiceFilters) => {
    // Verificar si hay filtros de fecha
    const hasFechaDesde = data.fecha_desde;
    const hasFechaHasta = data.fecha_hasta;
    
    // Si hay filtros de fecha, solo buscar cuando ambas fechas estén completas
    if (hasFechaDesde || hasFechaHasta) {
      if (!hasFechaDesde || !hasFechaHasta) {
        setError('Para buscar por fechas, debes completar ambos campos "Desde" y "Hasta"');
        return;
      }
    }
    
    // Ejecutar búsqueda
    setPagination(prev => ({ ...prev, page: 1 }));
    loadServices();
  };

  const loadServices = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (historialMode.active && historialMode.customerId) {
        // Modo historial: cargar todos los servicios del cliente específico
        result = await serviceService.getServicesByCustomer(historialMode.customerId);
        setServices(result.services || []);
        setPagination({
          page: 1,
          limit: result.services?.length || 0,
          total: result.services?.length || 0,
          totalPages: 1
        });
      } else {
        // Modo normal: usar filtros estándar
        const cleanFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value && value !== '')
        );
        
        result = await serviceService.getServices(cleanFilters, page, pagination.limit);
        setServices(result.services || []);
        setPagination({
          page: result.page || 1,
          limit: result.limit || 20,
          total: result.total || 0,
          totalPages: result.total_pages || 0
        });
      }
    } catch (err: any) {
      console.error('Error cargando servicios:', err);
      setError(err.response?.data?.message || 'Error al cargar servicios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMechanics = async () => {
    try {
      const result = await serviceService.getAvailableMechanics();
      setMechanics(result.mechanics || []);
    } catch (err: any) {
      console.error('Error cargando mecánicos:', err);
      // No mostrar error crítico ya que es opcional
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setViewMode('detail');
  };

  const handleEditService = () => {
    if (selectedService) {
      resetEdit(selectedService);
      setViewMode('edit');
    }
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

  const handleSaveService = async (data: Partial<Service>) => {
    if (!selectedService) return;
    
    try {
      setError(null);
      const response = await serviceService.updateService(selectedService.service_id, {
        tipo_servicio: data.tipo_servicio,
        descripcion: data.descripcion,
        precio: data.precio ? Number(data.precio) : undefined,
        estado: data.estado,
        notas: data.notas,
        kilometraje_servicio: data.kilometraje_servicio ? Number(data.kilometraje_servicio) : undefined,
        refacciones_usadas: data.refacciones_usadas,
        proximo_servicio_km: data.proximo_servicio_km ? Number(data.proximo_servicio_km) : undefined,
        proximo_servicio_fecha: data.proximo_servicio_fecha,
        garantia_meses: data.garantia_meses ? Number(data.garantia_meses) : undefined,
        mechanic_id: data.mechanic_id ? Number(data.mechanic_id) : null,
      });
      
      // 🔧 FIX: Recargar servicio completo con todos los JOINs para mostrar mecánico
      const updatedServiceResponse = await serviceService.getServiceById(selectedService.service_id);
      setSelectedService(updatedServiceResponse.service);
      setViewMode('detail');
      loadServices(pagination.page);
    } catch (err: any) {
      console.error('Error actualizando servicio:', err);
      setError(err.response?.data?.message || 'Error al actualizar servicio');
    }
  };

  const clearFilters = () => {
    reset();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadServices();
  };

  const activateHistorialMode = (customerId: number, customerName: string) => {
    setHistorialMode({
      active: true,
      customerId,
      customerName
    });
    setViewMode('list');
    reset(); // Limpiar filtros existentes
    setTimeout(() => {
      loadServices();
    }, 100);
  };

  const deactivateHistorialMode = () => {
    setHistorialMode({ active: false });
    reset();
    setTimeout(() => {
      loadServices();
    }, 100);
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
      case 'edit':
        return (
          <div className="space-y-6">
            {/* Botón de regreso */}
            <button
              onClick={() => setViewMode('detail')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              ← Regresar a detalle
            </button>

            {/* Formulario de edición */}
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Editar Servicio #{selectedService?.service_id}
              </h2>

              <form onSubmit={handleSubmitEdit(handleSaveService)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Información del servicio */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Información del Servicio</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Servicio *
                      </label>
                      <input
                        {...registerEdit('tipo_servicio')}
                        type="text"
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción *
                      </label>
                      <textarea
                        {...registerEdit('descripcion')}
                        className="input-field"
                        rows={3}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio ($)
                      </label>
                      <input
                        {...registerEdit('precio')}
                        type="number"
                        step="0.01"
                        min="0"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <select {...registerEdit('estado')} className="input-field">
                        <option value="cotizado">Cotizado</option>
                        <option value="autorizado">Autorizado</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="completado">Completado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mecánico Asignado
                      </label>
                      <select {...registerEdit('mechanic_id')} className="input-field">
                        <option value="">Sin asignar</option>
                        {mechanics.map((mechanic) => (
                          <option key={mechanic.mechanic_id} value={mechanic.mechanic_id}>
                            {mechanic.alias ? `"${mechanic.alias}" - ` : ''}{mechanic.nombre} {mechanic.apellidos} 
                            ({mechanic.nivel_experiencia} - {mechanic.branch_nombre})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Detalles adicionales */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Detalles Adicionales</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kilometraje del Servicio
                      </label>
                      <input
                        {...registerEdit('kilometraje_servicio')}
                        type="number"
                        min="0"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Refacciones Usadas
                      </label>
                      <textarea
                        {...registerEdit('refacciones_usadas')}
                        className="input-field"
                        rows={2}
                        placeholder="Lista de refacciones utilizadas..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Próximo Servicio (KM)
                      </label>
                      <input
                        {...registerEdit('proximo_servicio_km')}
                        type="number"
                        min="0"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Próximo Servicio (Fecha)
                      </label>
                      <input
                        {...registerEdit('proximo_servicio_fecha')}
                        type="date"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Garantía (meses)
                      </label>
                      <input
                        {...registerEdit('garantia_meses')}
                        type="number"
                        min="0"
                        max="60"
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    {...registerEdit('notas')}
                    className="input-field"
                    rows={3}
                    placeholder="Notas adicionales sobre el servicio..."
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setViewMode('detail')}
                    className="btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

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
            <div className="card p-4 md:p-6">
              <div className="space-y-4 mb-6">
                {/* Título */}
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    Servicio #{selectedService?.service_id}
                  </h2>
                </div>
                
                {/* Estado y precio - layout stacked en móviles */}
                <div className="flex flex-col gap-4">
                  {/* Estado - más pequeño en móviles */}
                  <div className={`self-start px-3 py-2 md:px-6 md:py-3 rounded-xl text-sm md:text-lg font-bold shadow-lg transform transition-all duration-200 hover:scale-105 ${
                    selectedService?.estado === 'cotizado' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900' :
                    selectedService?.estado === 'autorizado' ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-blue-900' :
                    selectedService?.estado === 'en_proceso' ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-purple-900' :
                    selectedService?.estado === 'completado' ? 'bg-gradient-to-r from-green-400 to-green-500 text-green-900' :
                    selectedService?.estado === 'cancelado' ? 'bg-gradient-to-r from-red-400 to-red-500 text-red-900' :
                    'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900'
                  }`}>
                    <div className="flex items-center space-x-1 md:space-x-2">
                      <span className="text-lg md:text-2xl">
                        {selectedService?.estado === 'cotizado' ? '📋' :
                         selectedService?.estado === 'autorizado' ? '✅' :
                         selectedService?.estado === 'en_proceso' ? '🔧' :
                         selectedService?.estado === 'completado' ? '🎉' :
                         selectedService?.estado === 'cancelado' ? '❌' : '❓'}
                      </span>
                      <span className="uppercase tracking-wide">
                        {getStatusLabel(selectedService?.estado || '')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Precio - responsive */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 px-3 py-2 md:px-4 md:py-3 rounded-lg border-l-4 border-green-500 self-start">
                    <div className="text-xs md:text-sm text-green-700 font-medium">Total Facturado</div>
                    <div className="text-lg md:text-2xl font-bold text-green-800">
                      {selectedService?.precio ? formatCurrency(selectedService.precio) : '$0.00'}
                    </div>
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

                  {/* Botón Ver Historial Completo */}
                  {selectedService?.customer_id && selectedService?.cliente_nombre && (
                    <div className="mt-4">
                      <button
                        onClick={() => activateHistorialMode(selectedService.customer_id, selectedService.cliente_nombre!)}
                        className="w-full px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center space-x-2"
                      >
                        <span>📚</span>
                        <span>Ver Historial Completo de {selectedService.cliente_nombre}</span>
                      </button>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Muestra todos los servicios históricos de este cliente
                      </p>
                    </div>
                  )}
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

              {/* Cambio de estado manual */}
              {canUpdateServices && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Cambiar Estado Manualmente</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Puedes cambiar el estado a cualquier valor, incluso revertir cambios accidentales.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedService?.estado !== 'cotizado' && (
                      <button
                        onClick={() => handleStatusChange(selectedService.service_id, 'cotizado')}
                        className="px-3 py-2 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg transition-colors"
                      >
                        → Cotizado
                      </button>
                    )}
                    {selectedService?.estado !== 'autorizado' && (
                      <button
                        onClick={() => handleStatusChange(selectedService.service_id, 'autorizado')}
                        className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors"
                      >
                        → Autorizado
                      </button>
                    )}
                    {selectedService?.estado !== 'en_proceso' && (
                      <button
                        onClick={() => handleStatusChange(selectedService.service_id, 'en_proceso')}
                        className="px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition-colors"
                      >
                        → En Proceso
                      </button>
                    )}
                    {selectedService?.estado !== 'completado' && (
                      <button
                        onClick={() => handleStatusChange(selectedService.service_id, 'completado')}
                        className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition-colors"
                      >
                        → Completado
                      </button>
                    )}
                    {selectedService?.estado !== 'cancelado' && (
                      <button
                        onClick={() => handleStatusChange(selectedService.service_id, 'cancelado')}
                        className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
                      >
                        → Cancelado
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Estado actual: <strong>{getStatusLabel(selectedService?.estado || '')}</strong>
                  </p>
                </div>
              )}

              {/* Botón editar al final */}
              {canUpdateServices && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleEditService}
                    className="btn-primary flex items-center justify-center space-x-2 w-full"
                  >
                    <span>✏️</span>
                    <span>Editar Servicio</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* Indicador de Modo Historial */}
            {historialMode.active && (
              <div className="card p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📚</span>
                    <div>
                      <h3 className="font-semibold text-blue-900">
                        Historial Completo de {historialMode.customerName}
                      </h3>
                      <p className="text-sm text-blue-700">
                        Mostrando todos los servicios históricos de este cliente (incluye completados y cancelados)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={deactivateHistorialMode}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <span>←</span>
                    <span>Regresar a Vista Normal</span>
                  </button>
                </div>
              </div>
            )}

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

              {/* Filtros Rápidos de Fecha - Solo visible en vista normal */}
              {!historialMode.active && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">🚀 Filtros Rápidos</h3>
                  
                  {/* Botón VISTA NORMAL destacado */}
                  <div className="mb-3">
                    <button
                      onClick={backToNormalView}
                      className="px-6 py-3 text-lg font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-yellow-900 rounded-xl border-2 border-yellow-600 transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center space-x-2 w-full justify-center"
                      disabled={isLoading}
                    >
                      <span className="text-xl">🏠</span>
                      <span>VISTA NORMAL</span>
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      Servicios activos + completados/cancelados de hoy (vista inteligente por defecto)
                    </p>
                  </div>

                  {/* Otros filtros */}
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    <button
                      onClick={quickFilters.yesterday}
                      className="px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-all duration-200 hover:shadow-md"
                      disabled={isLoading}
                    >
                      📅 Ayer
                    </button>
                    <button
                      onClick={quickFilters.currentWeek}
                      className="px-3 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-all duration-200 hover:shadow-md"
                      disabled={isLoading}
                    >
                      📊 Esta Semana
                    </button>
                    <button
                      onClick={quickFilters.currentMonth}
                      className="px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 transition-all duration-200 hover:shadow-md"
                      disabled={isLoading}
                    >
                      📈 Este Mes
                    </button>
                    <button
                      onClick={quickFilters.last7Days}
                      className="px-3 py-2 text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg border border-orange-200 transition-all duration-200 hover:shadow-md"
                      disabled={isLoading}
                    >
                      🔄 Últimos 7 días
                    </button>
                  </div>
                  
                  {/* Línea separada para el último filtro */}
                  <div className="mt-2">
                    <button
                      onClick={quickFilters.last30Days}
                      className="px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-all duration-200 hover:shadow-md"
                      disabled={isLoading}
                    >
                      📆 Últimos 30 días
                    </button>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Los filtros rápidos buscan automáticamente en el rango de fechas seleccionado
                  </div>
                </div>
              )}

              {/* Mensaje cuando los filtros están deshabilitados en modo historial */}
              {showFilters && historialMode.active && (
                <div className="p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <span>ℹ️</span>
                    <span className="text-sm">
                      Los filtros están deshabilitados en el modo historial. Se muestran todos los servicios del cliente seleccionado.
                    </span>
                  </div>
                </div>
              )}

              {/* Filtros */}
              {showFilters && !historialMode.active && (
                <form onSubmit={handleSubmit(handleSearch)} className="p-4 bg-gray-50 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                  </div>

                  {/* Mensaje informativo para filtros de fecha */}
                  {(filters.fecha_desde || filters.fecha_hasta) && !(filters.fecha_desde && filters.fecha_hasta) && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <span className="text-yellow-600">⚠️</span>
                        <span className="text-sm text-yellow-700">
                          Para buscar por fechas, completa ambos campos "Desde" y "Hasta"
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="btn-primary text-sm flex items-center space-x-2"
                      disabled={isLoading}
                    >
                      <span>🔍</span>
                      <span>{isLoading ? 'Buscando...' : 'Buscar'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="btn-secondary text-sm"
                    >
                      Limpiar Filtros
                    </button>
                  </div>
                </form>
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
                  {historialMode.active 
                    ? `${pagination.total} servicios en el historial de ${historialMode.customerName}`
                    : `${pagination.total} servicios encontrados (página ${pagination.page} de ${pagination.totalPages})`
                  }
                </h3>
                
                {/* Lista de servicios */}
                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.service_id} className="card p-4 md:p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200 cursor-pointer transform hover:-translate-y-1" onClick={() => handleServiceSelect(service)}>
                      {/* Layout responsive: stacked en móviles, lado a lado en desktop */}
                      <div className="space-y-3">
                        {/* Primera línea: Título completo */}
                        <div className="w-full">
                          <h3 className="text-lg md:text-xl font-medium text-gray-900 leading-tight">
                            Servicio #{service.service_id} - {service.tipo_servicio}
                          </h3>
                        </div>
                        
                        {/* Segunda línea: Estado y precio lado a lado */}
                        <div className="flex items-center justify-between gap-3">
                          {/* Estado colorido con icono */}
                          <div className={`px-3 py-2 rounded-lg font-semibold text-sm shadow-md ${
                            service.estado === 'cotizado' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900' :
                            service.estado === 'autorizado' ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-blue-900' :
                            service.estado === 'en_proceso' ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-purple-900' :
                            service.estado === 'completado' ? 'bg-gradient-to-r from-green-400 to-green-500 text-green-900' :
                            service.estado === 'cancelado' ? 'bg-gradient-to-r from-red-400 to-red-500 text-red-900' :
                            'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900'
                          }`}>
                            <span className="flex items-center space-x-1">
                              <span>
                                {service.estado === 'cotizado' ? '📋' :
                                 service.estado === 'autorizado' ? '✅' :
                                 service.estado === 'en_proceso' ? '🔧' :
                                 service.estado === 'completado' ? '🎉' :
                                 service.estado === 'cancelado' ? '❌' : '❓'}
                              </span>
                              <span className="uppercase tracking-wide">
                                {getStatusLabel(service.estado)}
                              </span>
                            </span>
                          </div>
                          
                          {/* Precio */}
                          <div className="bg-gradient-to-r from-green-50 to-green-100 px-3 py-2 rounded-lg border border-green-200">
                            <div className="text-xs text-green-700 font-medium mb-1">Total</div>
                            <div className="text-lg font-bold text-green-800">
                              {formatCurrency(service.precio)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Tercera línea: Descripción */}
                        <div className="w-full">
                          <p className="text-sm text-gray-600">{service.descripcion}</p>
                        </div>
                        
                        {/* Cuarta línea: Información del cliente y vehículo */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <span>📅</span>
                            <span className="truncate">{new Date(service.fecha_servicio).toLocaleDateString('es-MX')}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>👤</span>
                            <span className="truncate">{service.cliente_nombre || 'Cliente no disponible'}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>🚗</span>
                            <span className="truncate">{service.vehiculo_marca} {service.vehiculo_modelo}</span>
                          </span>
                        </div>
                        
                        {/* Quinta línea: Mecánico (si existe) */}
                        {service.mecanico_nombre && (
                          <div className="w-full">
                            <span className="inline-flex items-center space-x-1 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
                              <span>🔧</span>
                              <span>Mecánico: {service.mecanico_nombre}</span>
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Notas (si existen) */}
                      {service.notas && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                          <div className="flex items-start space-x-2">
                            <span className="text-blue-500 font-medium text-sm">💬 Notas:</span>
                            <span className="text-sm text-blue-700">{service.notas}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Paginación - Solo en vista normal */}
                {!historialMode.active && pagination.totalPages > 1 && (
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