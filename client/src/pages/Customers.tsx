import { useState, useEffect } from 'react';
import { CustomerSearch } from '../components/CustomerSearch';
import { CustomerForm } from '../components/CustomerForm';
import { vehicleService } from '../services/vehicles';
import { Customer, Vehicle } from '../types';
import { useAuth } from '../hooks/useAuth';

type ViewMode = 'search' | 'create' | 'edit' | 'detail';

export const Customers = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  const canModifyCustomers = user?.rol === 'administrador' || user?.rol === 'mecanico';

  const handleCustomerSelect = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setViewMode('detail');
    
    // Cargar vehículos del cliente
    setIsLoadingVehicles(true);
    try {
      const result = await vehicleService.search({ customer_name: customer.nombre });
      setCustomerVehicles(result.vehicles || []);
    } catch (error) {
      console.error('Error cargando vehículos:', error);
      setCustomerVehicles([]);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedCustomer(null);
    setViewMode('create');
  };

  const handleEdit = () => {
    if (selectedCustomer) {
      setViewMode('edit');
    }
  };

  const handleSuccess = (customer: Customer) => {
    setSelectedCustomer(customer);
    setViewMode('detail');
  };

  const handleCancel = () => {
    setViewMode('search');
    setSelectedCustomer(null);
    setCustomerVehicles([]);
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/^\+52/, '');
    return `https://wa.me/52${cleanPhone}`;
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 13 && phone.startsWith('+52')) {
      return `+52 ${phone.slice(3, 5)} ${phone.slice(5, 9)} ${phone.slice(9)}`;
    }
    return phone;
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <CustomerForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        );

      case 'edit':
        return (
          <CustomerForm
            customer={selectedCustomer!}
            onSuccess={handleSuccess}
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
              ← Regresar a búsqueda
            </button>

            {/* Información del cliente */}
            <div className="card p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedCustomer?.nombre}
                  </h2>
                  <div className="flex items-center space-x-4 mt-2">
                    {selectedCustomer?.rfc && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        RFC: {selectedCustomer.rfc}
                      </span>
                    )}
                    <span className="text-gray-600 text-sm">
                      Cliente desde: {new Date(selectedCustomer?.fecha_registro || '').toLocaleDateString('es-MX')}
                    </span>
                  </div>
                </div>
                
                {canModifyCustomers && (
                  <button
                    onClick={handleEdit}
                    className="btn-secondary"
                  >
                    Editar Cliente
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Información de Contacto</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span>📞</span>
                      <span>{formatPhone(selectedCustomer?.telefono || '')}</span>
                      <a
                        href={`tel:${selectedCustomer?.telefono}`}
                        className="text-blue-600 hover:text-blue-700 ml-2"
                      >
                        Llamar
                      </a>
                    </div>
                    
                    {selectedCustomer?.whatsapp && (
                      <div className="flex items-center space-x-2">
                        <span>💬</span>
                        <span>{formatPhone(selectedCustomer.whatsapp)}</span>
                        <a
                          href={formatPhoneForWhatsApp(selectedCustomer.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 ml-2"
                        >
                          WhatsApp
                        </a>
                      </div>
                    )}
                    
                    {selectedCustomer?.email && (
                      <div className="flex items-center space-x-2">
                        <span>✉️</span>
                        <span>{selectedCustomer.email}</span>
                        <a
                          href={`mailto:${selectedCustomer.email}`}
                          className="text-purple-600 hover:text-purple-700 ml-2"
                        >
                          Email
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Ubicación</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    {selectedCustomer?.direccion ? (
                      <div className="flex items-start space-x-2">
                        <span>📍</span>
                        <span>{selectedCustomer.direccion}</span>
                      </div>
                    ) : (
                      <p className="text-gray-500">No especificada</p>
                    )}
                    
                    {selectedCustomer?.codigo_postal && (
                      <div className="flex items-center space-x-2">
                        <span>📮</span>
                        <span>CP: {selectedCustomer.codigo_postal}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Estadísticas</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Vehículos:</span> {customerVehicles.length}</p>
                    <p><span className="font-medium">Último contacto:</span> Hace 2 días</p>
                    <p><span className="font-medium">Servicios totales:</span> --</p>
                  </div>
                </div>
              </div>

              {selectedCustomer?.notas && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2">Notas</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedCustomer.notas}
                  </p>
                </div>
              )}
            </div>

            {/* Vehículos del cliente */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Vehículos del Cliente ({customerVehicles.length})
                </h3>
                <button className="btn-secondary text-sm">
                  + Registrar Vehículo para este Cliente
                </button>
              </div>

              {isLoadingVehicles ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando vehículos...</p>
                </div>
              ) : customerVehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customerVehicles.map((vehicle) => (
                    <div key={vehicle.vin} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          {vehicle.marca} {vehicle.modelo} {vehicle.año}
                        </h4>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          {vehicle.placa_actual || 'Sin placas'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">VIN:</span> {vehicle.vin}</p>
                        <p><span className="font-medium">Kilometraje:</span> {vehicle.kilometraje_actual?.toLocaleString()} km</p>
                        <p><span className="font-medium">Último servicio:</span> --</p>
                      </div>
                      
                      <div className="mt-3 flex space-x-2">
                        <button className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
                          Ver Historial
                        </button>
                        <button className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded">
                          Crear Oportunidad
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Este cliente no tiene vehículos registrados</p>
                  <button className="mt-2 btn-secondary text-sm">
                    Registrar Primer Vehículo
                  </button>
                </div>
              )}
            </div>

            {/* Acciones rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="card p-4 text-center hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">💬</div>
                <div className="font-medium">Enviar WhatsApp</div>
                <div className="text-sm text-gray-600">Contacto directo</div>
              </button>
              
              <button className="card p-4 text-center hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">🔧</div>
                <div className="font-medium">Crear Oportunidad</div>
                <div className="text-sm text-gray-600">Nuevo servicio</div>
              </button>
              
              <button className="card p-4 text-center hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">📋</div>
                <div className="font-medium">Ver Historial</div>
                <div className="text-sm text-gray-600">Todos los servicios</div>
              </button>
            </div>
          </div>
        );

      default:
        return (
          <CustomerSearch
            onCustomerSelect={handleCustomerSelect}
            onCreateNew={canModifyCustomers ? handleCreateNew : undefined}
          />
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