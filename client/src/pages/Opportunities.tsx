import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { opportunityService } from '../services/opportunities';
import { OpportunityCard } from '../components/OpportunityCard';
import { OpportunityForm } from '../components/OpportunityForm';
import { useAuth } from '../hooks/useAuth';

import type { Opportunity } from '../types/index';

type ViewMode = 'search' | 'create' | 'edit' | 'detail';

interface SearchFilters {
  estado?: string;
  prioridad?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  usuario_asignado?: string;
}

export const Opportunities = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [reminders, setReminders] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const canCreateOpportunities = user?.rol === 'administrador' || user?.rol === 'mecanico';
  const canUpdateOpportunities = user?.rol === 'administrador' || user?.rol === 'seguimiento';

  const { register, watch, reset } = useForm<SearchFilters>();
  const filters = watch();

  // Cargar oportunidades y recordatorios al iniciar
  useEffect(() => {
    loadOpportunities();
    loadRemindersToday();
  }, []);

  // Recargar cuando cambien los filtros
  useEffect(() => {
    if (Object.values(filters).some(value => value)) {
      loadOpportunities();
    }
  }, [filters]);

  const loadOpportunities = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value && value !== '')
      );
      
      const result = await opportunityService.search(cleanFilters);
      console.log('DEBUG - Datos recibidos del backend:', result);
      console.log('DEBUG - Primera oportunidad:', result.opportunities?.[0]);
      setOpportunities(result.opportunities || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar oportunidades');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRemindersToday = async () => {
    try {
      const result = await opportunityService.getRemindersToday();
      setReminders(result.reminders || []);
    } catch (err) {
      console.error('Error cargando recordatorios:', err);
    }
  };

  const handleOpportunitySelect = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setViewMode('detail');
  };

  const handleCreateNew = () => {
    setSelectedOpportunity(null);
    setViewMode('create');
  };

  const handleEdit = () => {
    if (selectedOpportunity) {
      setViewMode('edit');
    }
  };

  const handleSuccess = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setViewMode('detail');
    loadOpportunities();
    loadRemindersToday();
  };

  const handleCancel = () => {
    setViewMode('search');
    setSelectedOpportunity(null);
  };

  const handleStatusChange = async (opportunityId: number, newStatus: string) => {
    try {
      await opportunityService.changeStatus(opportunityId, newStatus as any);
      loadOpportunities();
      loadRemindersToday();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const clearFilters = () => {
    reset();
    loadOpportunities();
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/^\+52/, '');
    return `https://wa.me/52${cleanPhone}`;
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <OpportunityForm
            onSuccess={handleSuccess as any}
            onCancel={handleCancel}
          />
        );

      case 'edit':
        return (
          <OpportunityForm
            opportunity={selectedOpportunity as any}
            onSuccess={handleSuccess as any}
            onCancel={handleCancel}
          />
        );

      case 'detail':
        return (
          <div className="space-y-6">
            {/* Botón de regreso */}
            <button
              onClick={() => setViewMode('search')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              ← Regresar a oportunidades
            </button>

            {/* Detalle de la oportunidad */}
            <div className="card p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedOpportunity?.titulo}
                  </h2>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedOpportunity?.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      selectedOpportunity?.estado === 'contactado' ? 'bg-blue-100 text-blue-800' :
                      selectedOpportunity?.estado === 'agendado' ? 'bg-purple-100 text-purple-800' :
                      selectedOpportunity?.estado === 'completado' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedOpportunity?.estado ? selectedOpportunity.estado.charAt(0).toUpperCase() + selectedOpportunity.estado.slice(1) : ''}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedOpportunity?.prioridad === 'alta' ? 'bg-red-100 text-red-800' :
                      selectedOpportunity?.prioridad === 'media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      Prioridad {selectedOpportunity?.prioridad}
                    </span>
                  </div>
                </div>
                
                {canUpdateOpportunities && (
                  <button
                    onClick={handleEdit}
                    className="btn-secondary"
                  >
                    Editar Oportunidad
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Información del Servicio</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Descripción:</span> {selectedOpportunity?.descripcion}</p>
                    {selectedOpportunity?.servicio_sugerido && (
                      <p><span className="font-medium">Servicio:</span> {selectedOpportunity.servicio_sugerido}</p>
                    )}
                    {selectedOpportunity?.precio_estimado && (
                      <p><span className="font-medium">Precio estimado:</span> ${selectedOpportunity.precio_estimado.toLocaleString()}</p>
                    )}
                    <p><span className="font-medium">Tipo:</span> {selectedOpportunity?.tipo_oportunidad.replace(/_/g, ' ')}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Fechas y Seguimiento</h3>
                  <div className="space-y-2 text-sm">
                    {selectedOpportunity?.fecha_sugerida && (
                      <p><span className="font-medium">Fecha sugerida:</span> {new Date(selectedOpportunity.fecha_sugerida).toLocaleDateString('es-MX')}</p>
                    )}
                    {selectedOpportunity?.fecha_contacto_sugerida && (
                      <p><span className="font-medium">Contactar antes del:</span> {new Date(selectedOpportunity.fecha_contacto_sugerida).toLocaleDateString('es-MX')}</p>
                    )}
                    {selectedOpportunity?.usuario_asignado_nombre && (
                      <p><span className="font-medium">Asignado a:</span> {selectedOpportunity.usuario_asignado_nombre}</p>
                    )}
                    <p><span className="font-medium">Creado:</span> {new Date(selectedOpportunity?.fecha_creacion || '').toLocaleDateString('es-MX')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="card p-4 text-center hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">💬</div>
                <div className="font-medium">Contactar Cliente</div>
                <div className="text-sm text-gray-600">WhatsApp o llamada</div>
              </button>
              
              <button className="card p-4 text-center hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">📅</div>
                <div className="font-medium">Programar Cita</div>
                <div className="text-sm text-gray-600">Agendar servicio</div>
              </button>
              
              <button className="card p-4 text-center hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">📝</div>
                <div className="font-medium">Agregar Nota</div>
                <div className="text-sm text-gray-600">Seguimiento</div>
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* Recordatorios del día */}
            {reminders.length > 0 && (
              <div className="card p-6 border-l-4 border-orange-500">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  ⏰ Recordatorios de Hoy ({reminders.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reminders.slice(0, 6).map((reminder) => (
                    <div key={reminder.opportunity_id} className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-1">{reminder.titulo}</h4>
                      <p className="text-sm text-gray-600 mb-2">{reminder.customer_nombre}</p>
                      <p className="text-sm text-gray-600">{reminder.vehicle_marca} {reminder.vehicle_modelo}</p>
                      <div className="mt-2 flex space-x-2">
                        {reminder.customer_whatsapp && (
                          <a
                            href={formatPhoneForWhatsApp(reminder.customer_whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
                          >
                            WhatsApp
                          </a>
                        )}
                        <button
                          onClick={() => handleOpportunitySelect(reminder)}
                          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                        >
                          Ver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {reminders.length > 6 && (
                  <p className="text-sm text-gray-600 mt-3">
                    Y {reminders.length - 6} recordatorios más...
                  </p>
                )}
              </div>
            )}

            {/* Filtros y acciones */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Oportunidades de Venta
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="btn-secondary text-sm"
                  >
                    {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                  </button>
                  {canCreateOpportunities && (
                    <button
                      onClick={handleCreateNew}
                      className="btn-primary text-sm"
                    >
                      + Nueva Oportunidad
                    </button>
                  )}
                </div>
              </div>

              {/* Filtros */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select {...register('estado')} className="input-field text-sm">
                      <option value="">Todos</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="contactado">Contactado</option>
                      <option value="agendado">Agendado</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="completado">Completado</option>
                      <option value="perdido">Perdido</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                    <select {...register('prioridad')} className="input-field text-sm">
                      <option value="">Todas</option>
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
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

            {/* Lista de oportunidades */}
            {error && (
              <div className="card p-4 bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando oportunidades...</p>
              </div>
            ) : opportunities.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {opportunities.length} oportunidades encontradas
                </h3>
                {opportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.opportunity_id}
                    opportunity={opportunity}
                    onSelect={handleOpportunitySelect}
                    onStatusChange={canUpdateOpportunities ? handleStatusChange : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-gray-600">No hay oportunidades que coincidan con los filtros</p>
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