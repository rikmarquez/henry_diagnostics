import { useState, useEffect } from 'react';
import { opportunityService } from '../services/opportunities';
import { OpportunityCard } from '../components/OpportunityCard';
import type { Opportunity } from '../types/index';
import { useAuth } from '../hooks/useAuth';

export const Reminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'today' | 'upcoming' | 'overdue'>('today');

  const canUpdateOpportunities = user?.rol === 'administrador' || user?.rol === 'seguimiento';

  useEffect(() => {
    loadReminders();
  }, [selectedTab]);

  const loadReminders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let result;
      
      switch (selectedTab) {
        case 'today':
          result = await opportunityService.getRemindersToday();
          setReminders(result.reminders || []);
          break;
          
        case 'upcoming':
          // Próximos 7 días
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          
          result = await opportunityService.search({
            estado: 'pendiente',
            fecha_hasta: nextWeek.toISOString().split('T')[0],
          });
          setReminders(result.opportunities || []);
          break;
          
        case 'overdue':
          // Vencidos
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          result = await opportunityService.search({
            estado: 'pendiente',
            fecha_hasta: yesterday.toISOString().split('T')[0],
          });
          setReminders(result.opportunities || []);
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar recordatorios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (opportunityId: number, newStatus: string) => {
    try {
      await opportunityService.changeStatus(opportunityId, newStatus as any);
      loadReminders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const handleDelete = async (opportunity: Opportunity) => {
    try {
      setIsLoading(true);
      await opportunityService.delete(opportunity.opportunity_id);
      
      // Mostrar mensaje de éxito
      alert(`✅ Oportunidad "${opportunity.titulo}" eliminada exitosamente`);
      
      // Recargar la lista
      loadReminders();
    } catch (err: any) {
      console.error('Error eliminando oportunidad:', err);
      const message = err.response?.data?.message || 'Error al eliminar la oportunidad';
      alert(`❌ ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/^\+52/, '');
    return `https://wa.me/52${cleanPhone}`;
  };


  const getTodayStats = () => {
    if (selectedTab !== 'today') return null;
    
    const byPriority = reminders.reduce((acc, reminder) => {
      acc[reminder.prioridad] = (acc[reminder.prioridad] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: reminders.length,
      alta: byPriority.alta || 0,
      media: byPriority.media || 0,
      baja: byPriority.baja || 0,
    };
  };

  const stats = getTodayStats();

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recordatorios y Seguimiento</h1>
            <p className="text-gray-600 mt-1">
              Gestiona los recordatorios de contacto con clientes
            </p>
          </div>

          {/* Stats para hoy */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card p-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Hoy</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <span className="text-blue-600 text-xl">📅</span>
                  </div>
                </div>
              </div>

              <div className="card p-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Prioridad Alta</p>
                    <p className="text-2xl font-bold text-red-600">{stats.alta}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <span className="text-red-600 text-xl">🔥</span>
                  </div>
                </div>
              </div>

              <div className="card p-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Prioridad Media</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.media}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <span className="text-yellow-600 text-xl">⚡</span>
                  </div>
                </div>
              </div>

              <div className="card p-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Prioridad Baja</p>
                    <p className="text-2xl font-bold text-green-600">{stats.baja}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <span className="text-green-600 text-xl">📝</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="card">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setSelectedTab('today')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === 'today'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Hoy
                  {selectedTab === 'today' && (
                    <span className="bg-blue-100 text-blue-600 ml-2 py-0.5 px-2 rounded-full text-xs">
                      {reminders.length}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setSelectedTab('upcoming')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === 'upcoming'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Próximos 7 días
                  {selectedTab === 'upcoming' && (
                    <span className="bg-blue-100 text-blue-600 ml-2 py-0.5 px-2 rounded-full text-xs">
                      {reminders.length}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setSelectedTab('overdue')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === 'overdue'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Vencidos
                  {selectedTab === 'overdue' && (
                    <span className="bg-red-100 text-red-600 ml-2 py-0.5 px-2 rounded-full text-xs">
                      {reminders.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando recordatorios...</p>
                </div>
              ) : reminders.length > 0 ? (
                <div className="space-y-4">
                  {selectedTab === 'today' && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        📞 Clientes para contactar hoy
                      </h3>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-blue-800 text-sm mb-3">
                          <strong>Sugerencia de flujo de trabajo:</strong>
                        </p>
                        <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                          <li>Contactar primero las prioridades altas 🔥</li>
                          <li>Enviar mensaje de WhatsApp con el template sugerido</li>
                          <li>Marcar como "Contactado" después de enviar mensaje</li>
                          <li>Programar seguimiento si es necesario</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {reminders.map((reminder) => (
                    <div key={reminder.opportunity_id} className="relative">
                      <OpportunityCard
                        opportunity={reminder}
                        onStatusChange={canUpdateOpportunities ? handleStatusChange : undefined}
                        onDelete={canUpdateOpportunities ? handleDelete : undefined}
                        showVehicleInfo={true}
                      />
                      
                      {/* WhatsApp quick action */}
                      {reminder.customer_whatsapp && (
                        <div className="absolute top-4 right-4">
                          <a
                            href={formatPhoneForWhatsApp(reminder.customer_whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 shadow-lg"
                          >
                            <span>💬</span>
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">
                    {selectedTab === 'today' ? '🎉' : 
                     selectedTab === 'upcoming' ? '📅' : '✅'}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedTab === 'today' ? '¡Excelente! No hay recordatorios para hoy' :
                     selectedTab === 'upcoming' ? 'No hay recordatorios próximos' :
                     '¡Perfecto! No hay recordatorios vencidos'}
                  </h3>
                  <p className="text-gray-600">
                    {selectedTab === 'today' ? 'Puedes revisar los recordatorios próximos o crear nuevas oportunidades.' :
                     selectedTab === 'upcoming' ? 'Los próximos recordatorios aparecerán aquí cuando se acerquen las fechas.' :
                     'Mantén este estado al día contactando a los clientes oportunamente.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Templates de WhatsApp */}
          {selectedTab === 'today' && reminders.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                💬 Templates de WhatsApp Sugeridos
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Recordatorio General</h4>
                  <p className="text-sm text-gray-700 italic">
                    "Hola [Cliente], espero que esté bien. Su [Marca Modelo Placas] necesita [Servicio]. 
                    ¿Cuándo le conviene traerlo al taller? Saludos - Henry Diagnostics"
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Seguimiento de Cotización</h4>
                  <p className="text-sm text-gray-700 italic">
                    "Buenos días [Cliente], recordamos que tiene una cotización pendiente para su [Vehículo Placas]. 
                    ¿Podemos agendarlo? - Henry Diagnostics"
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Mantenimiento Programado</h4>
                  <p className="text-sm text-gray-700 italic">
                    "Su [Marca Modelo Placas] ha recorrido [Kilometraje] desde el último servicio. 
                    Es momento de [Servicio]. ¿Le conviene esta semana? - Henry Diagnostics"
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Prioridad Alta</h4>
                  <p className="text-sm text-gray-700 italic">
                    "⚠️ [Cliente], es importante revisar su [Vehículo] para [Motivo]. 
                    ¿Puede traerlo hoy o mañana? - Henry Diagnostics"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};