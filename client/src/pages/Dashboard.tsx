import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { opportunityService } from '../services/opportunities';
import { vehicleService } from '../services/vehicles';
import { serviceService } from '../services/services';

interface DashboardProps {
  onNavigate: (page: string) => void;
  onNavigateToVehicleForm: () => void;
}

export const Dashboard = ({ onNavigate, onNavigateToVehicleForm }: DashboardProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    vehiclesCount: 0,
    opportunitiesPending: 0,
    remindersToday: 0,
    servicesThisMonth: 0,
    appointmentsToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchPlate, setSearchPlate] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Solo cargar datos cuando la autenticación esté lista y el usuario esté autenticado
    if (!authLoading && user) {
      loadDashboardData();
    }
  }, [authLoading, user]);

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Dashboard: Iniciando carga de datos...');
      
      // Cargar estadísticas básicas
      const today = new Date().toISOString().split('T')[0];
      const [remindersResult, opportunitiesResult, vehiclesCountResult, appointmentsResult, servicesCountResult] = await Promise.all([
        opportunityService.getRemindersToday(),
        opportunityService.getPending(),
        vehicleService.getCount(),
        opportunityService.getAppointmentsToday(),
        serviceService.getCountThisMonth(),
      ]);

      console.log('📊 Dashboard: Datos recibidos', {
        vehicles: vehiclesCountResult,
        opportunities: opportunitiesResult,
        reminders: remindersResult,
        appointments: appointmentsResult,
        services: servicesCountResult
      });
      
      console.log('🔍 Dashboard: Detalle appointments:', {
        appointmentsResult,
        appointmentsArray: appointmentsResult?.opportunities,
        appointmentsLength: appointmentsResult?.opportunities?.length,
        finalCount: appointmentsResult?.opportunities?.length || 0
      });

      setStats({
        vehiclesCount: vehiclesCountResult.count || 0,
        opportunitiesPending: opportunitiesResult.opportunities?.length || 0,
        remindersToday: remindersResult.reminders?.length || 0,
        servicesThisMonth: servicesCountResult.count || 0,
        appointmentsToday: appointmentsResult.opportunities?.length || 0,
      });

    } catch (error) {
      console.error('❌ Dashboard: Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVehicleSearch = async () => {
    if (!searchPlate.trim()) return;
    
    setIsSearching(true);
    try {
      const result = await vehicleService.searchByPlate(searchPlate.trim());
      if (result.vehicles && result.vehicles.length > 0) {
        // Navigate to vehicles page with search results
        onNavigate('vehicles');
        // Store search results in localStorage for the vehicles page to pick up
        localStorage.setItem('vehicleSearchResults', JSON.stringify(result.vehicles));
        localStorage.setItem('vehicleSearchQuery', searchPlate.trim());
      } else {
        alert('No se encontró ningún vehículo con esas placas');
      }
    } catch (error) {
      console.error('Error searching vehicle:', error);
      alert('Error al buscar el vehículo');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVehicleSearch();
    }
  };

  // Mostrar loading mientras la autenticación se inicializa
  if (authLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenido, {user?.nombre}
            </h1>
            <p className="text-gray-600 mt-2">
              Sistema de seguimiento de clientes y vehículos
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Vehículos Registrados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '--' : stats.vehiclesCount}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <span className="text-blue-600 text-xl">🚗</span>
                </div>
              </div>
            </div>

            <div className={`card p-6 ${stats.appointmentsToday > 0 ? 'ring-2 ring-blue-200 bg-blue-50' : ''}`}>
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
                  <p className={`text-2xl font-bold ${stats.appointmentsToday > 0 ? 'text-blue-600' : 'text-gray-900'}`}>
                    {isLoading ? '--' : stats.appointmentsToday}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stats.appointmentsToday > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <span className={`text-xl ${stats.appointmentsToday > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                    📅
                  </span>
                </div>
              </div>
              {stats.appointmentsToday > 0 && (
                <div className="mt-3">
                  <button 
                    onClick={() => onNavigate('appointments')}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full font-medium"
                  >
                    Ver Citas
                  </button>
                </div>
              )}
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Oportunidades Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '--' : stats.opportunitiesPending}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <span className="text-yellow-600 text-xl">💼</span>
                </div>
              </div>
            </div>

            <div className={`card p-6 cursor-pointer hover:shadow-lg transition-shadow ${stats.servicesThisMonth > 0 ? 'ring-2 ring-green-200 bg-green-50' : ''}`}
                 onClick={() => onNavigate('services')}>
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Servicios del Mes</p>
                  <p className={`text-2xl font-bold ${stats.servicesThisMonth > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {isLoading ? '--' : stats.servicesThisMonth}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stats.servicesThisMonth > 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <span className={`text-xl ${stats.servicesThisMonth > 0 ? 'text-green-600' : 'text-gray-600'}`}>✅</span>
                </div>
              </div>
              {stats.servicesThisMonth > 0 && (
                <div className="mt-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('services');
                    }}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full font-medium"
                  >
                    Ver Servicios
                  </button>
                </div>
              )}
            </div>

            <div className={`card p-6 ${stats.remindersToday > 0 ? 'ring-2 ring-red-200 bg-red-50' : ''}`}>
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Recordatorios Hoy</p>
                  <p className={`text-2xl font-bold ${stats.remindersToday > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {isLoading ? '--' : stats.remindersToday}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stats.remindersToday > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <span className={`text-xl ${stats.remindersToday > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {stats.remindersToday > 0 ? '🔥' : '⏰'}
                  </span>
                </div>
              </div>
              {stats.remindersToday > 0 && (
                <div className="mt-3">
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'reminders' }))}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full font-medium"
                  >
                    Ver Recordatorios
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Búsqueda Rápida</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={searchPlate}
                  onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Buscar por placas (ABC-123-A)"
                  className="input-field text-sm"
                />
                <button 
                  onClick={handleVehicleSearch}
                  disabled={isSearching || !searchPlate.trim()}
                  className="w-full btn-primary text-sm disabled:opacity-50"
                >
                  {isSearching ? 'Buscando...' : 'Buscar Vehículo'}
                </button>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    console.log('📅 Dashboard: Navigating to appointments');
                    onNavigate('appointments');
                  }}
                  className="w-full btn-primary text-sm"
                >
                  📅 Agendar Cita Rápida
                </button>
                <button 
                  onClick={() => {
                    console.log('🚗 Dashboard: Using direct vehicle form navigation');
                    onNavigateToVehicleForm();
                  }}
                  className="w-full btn-secondary text-sm"
                >
                  Registrar Nuevo Vehículo
                </button>
                <button 
                  onClick={() => {
                    console.log('💼 Dashboard: Navigating to opportunities');
                    onNavigate('opportunities');
                  }}
                  className="w-full btn-secondary text-sm"
                >
                  Crear Oportunidad
                </button>
                <button 
                  onClick={() => {
                    console.log('⏰ Dashboard: Navigating to reminders');
                    onNavigate('reminders');
                  }}
                  className="w-full btn-secondary text-sm"
                >
                  Ver Recordatorios
                </button>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos Recordatorios</h3>
              <div className="text-sm text-gray-600">
                <p>No hay recordatorios programados para hoy</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};