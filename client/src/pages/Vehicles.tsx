import { useState, useEffect } from 'react';
import { VehicleSearch } from '../components/VehicleSearch';
import { VehicleForm } from '../components/VehicleForm';
import { OpportunityForm } from '../components/OpportunityForm';
import { useAuth } from '../hooks/useAuth';

import type { Vehicle } from '../types/index';

type ViewMode = 'search' | 'create' | 'edit' | 'detail' | 'create-opportunity';

interface VehiclesProps {
  initialMode?: ViewMode;
  onModeUsed?: () => void;
}

export const Vehicles = ({ initialMode = 'search', onModeUsed }: VehiclesProps) => {
  console.log('🚗 VEHICLES COMPONENT LOADED with initialMode:', initialMode);
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Llamar onModeUsed cuando se monta el componente para limpiar el estado en MainApp
  useEffect(() => {
    if (initialMode === 'create' && onModeUsed) {
      console.log('🧹 Cleaning up initialMode in parent');
      onModeUsed();
    }
  }, [initialMode, onModeUsed]);

  const canModifyVehicles = true; // Permitir a todos los usuarios crear vehículos


  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setViewMode('detail');
  };

  const handleCreateNew = () => {
    console.log('🚗 handleCreateNew called');
    console.log('Current viewMode:', viewMode);
    setSelectedVehicle(null);
    setViewMode('create');
    console.log('ViewMode set to: create');
  };

  const handleEdit = () => {
    if (selectedVehicle) {
      setViewMode('edit');
    }
  };

  const handleSuccess = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setViewMode('detail');
  };

  const handleOpportunitySuccess = () => {
    // Regresar al detalle del vehículo después de crear la oportunidad
    setViewMode('detail');
  };

  const handleCancel = () => {
    setViewMode('search');
    setSelectedVehicle(null);
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/^\+52/, '');
    return `https://wa.me/52${cleanPhone}`;
  };

  const renderContent = () => {
    console.log('📱 Rendering Vehicles with viewMode:', viewMode);
    switch (viewMode) {
      case 'create':
        return (
          <VehicleForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        );

      case 'edit':
        return (
          <VehicleForm
            vehicle={selectedVehicle!}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        );

      case 'create-opportunity':
        return (
          <div className="space-y-4">
            <button
              onClick={() => setViewMode('detail')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              ← Regresar al vehículo
            </button>
            <OpportunityForm
              preselectedVin={selectedVehicle?.vin}
              onSuccess={handleOpportunitySuccess}
              onCancel={() => setViewMode('detail')}
            />
          </div>
        );

      case 'detail':
        return (
          <div className="space-y-6">
            {/* Botón de regreso */}
            <button
              onClick={() => setViewMode('search')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              ← Regresar a búsqueda
            </button>

            {/* Información del vehículo */}
            <div className="card p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedVehicle?.marca} {selectedVehicle?.modelo} {selectedVehicle?.año}
                  </h2>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedVehicle?.placa_actual || 'Sin placas'}
                    </span>
                    <span className="text-gray-600 text-sm">
                      VIN: {selectedVehicle?.vin}
                    </span>
                  </div>
                </div>
                
                {canModifyVehicles && (
                  <button
                    onClick={handleEdit}
                    className="btn-secondary"
                  >
                    Editar Vehículo
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Información Básica</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Marca:</span> {selectedVehicle?.marca}</p>
                    <p><span className="font-medium">Modelo:</span> {selectedVehicle?.modelo}</p>
                    <p><span className="font-medium">Año:</span> {selectedVehicle?.año}</p>
                    <p><span className="font-medium">Color:</span> {selectedVehicle?.color || 'No especificado'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Información Técnica</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Kilometraje:</span> {selectedVehicle?.kilometraje_actual?.toLocaleString()} km</p>
                    <p><span className="font-medium">Combustible:</span> {selectedVehicle?.tipo_combustible}</p>
                    <p><span className="font-medium">Transmisión:</span> {selectedVehicle?.transmision}</p>
                    <p><span className="font-medium">Motor:</span> {selectedVehicle?.numero_motor || 'No especificado'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Propietario</h3>
                  {selectedVehicle?.customer ? (
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="font-medium text-gray-900">{selectedVehicle.customer.nombre}</p>
                      <p>📞 {selectedVehicle.customer.telefono}</p>
                      {selectedVehicle.customer.whatsapp && (
                        <a
                          href={formatPhoneForWhatsApp(selectedVehicle.customer.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          💬 Enviar WhatsApp
                        </a>
                      )}
                      {selectedVehicle.customer.email && (
                        <p>✉️ {selectedVehicle.customer.email}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No asignado</p>
                  )}
                </div>
              </div>

              {selectedVehicle?.notas && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2">Notas</h3>
                  <p className="text-sm text-gray-600">{selectedVehicle.notas}</p>
                </div>
              )}
            </div>

            {/* Acciones rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {canModifyVehicles && (
                <button 
                  onClick={() => {
                    setSelectedVehicle(selectedVehicle);
                    setViewMode('create-opportunity');
                  }}
                  className="card p-4 text-center hover:shadow-md transition-shadow"
                >
                  <div className="text-2xl mb-2">🔧</div>
                  <div className="font-medium">Crear Oportunidad</div>
                  <div className="text-sm text-gray-600">Programar servicio</div>
                </button>
              )}
              
              <button className="card p-4 text-center hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">📋</div>
                <div className="font-medium">Ver Historial</div>
                <div className="text-sm text-gray-600">Servicios realizados</div>
              </button>
              
              {selectedVehicle?.customer?.whatsapp && (
                <a
                  href={formatPhoneForWhatsApp(selectedVehicle.customer.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card p-4 text-center hover:shadow-md transition-shadow block"
                >
                  <div className="text-2xl mb-2">💬</div>
                  <div className="font-medium">Contactar Cliente</div>
                  <div className="text-sm text-gray-600">WhatsApp directo</div>
                </a>
              )}
            </div>
          </div>
        );

      default:
        console.log('🔍 Rendering VehicleSearch with canModifyVehicles:', canModifyVehicles);
        console.log('🔍 handleCreateNew function:', handleCreateNew);
        return (
          <VehicleSearch
            onVehicleSelect={handleVehicleSelect as any}
            onCreateNew={canModifyVehicles ? handleCreateNew : undefined}
          />
        );
    }
  };

  return (
    <div className="bg-gray-50">

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </div>
    </div>
  );
};