import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import appointmentService, { Appointment, ConvertAppointmentRequest } from '../services/appointments';
import { customerService } from '../services/customers';
import { vehicleService } from '../services/vehicles';
import { mechanicService } from '../services/mechanics';

interface Customer {
  customer_id: number;
  nombre: string;
  telefono: string;
  email?: string;
  direccion?: string;
}

interface Vehicle {
  vehicle_id: number;
  marca: string;
  modelo: string;
  año: number;
  color: string;
  placa_actual: string;
}

interface Mechanic {
  mechanic_id: number;
  nombre: string;
  apellidos: string;
  alias?: string;
  nivel_experiencia: string;
  branch_nombre?: string;
}

interface ConvertAppointmentModalProps {
  appointment: Appointment;
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

const ConvertAppointmentModal: React.FC<ConvertAppointmentModalProps> = ({
  appointment,
  isOpen,
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<'customer' | 'vehicle' | 'service'>('customer');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isNewVehicle, setIsNewVehicle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para búsquedas
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ConvertAppointmentRequest>();

  useEffect(() => {
    if (isOpen) {
      reset();
      setIsNewCustomer(false);
      setIsNewVehicle(false);
      setError(null);
      setSelectedCustomer(null);
      setSelectedVehicle(null);
      setCustomerSearchTerm('');
      setCustomerSearchResults([]);
      setCustomerVehicles([]);
      loadMechanics();
      
      // Pre-llenar con datos de la cita
      setValue('descripcion', `Servicio programado: ${appointment.cita_descripcion_breve}`);

      // 🎯 LÓGICA MEJORADA: Si la cita ya tiene customer_id y vehicle_id, saltar a servicio
      console.log('🔍 Verificando datos de cita:', {
        customer_id: (appointment as any).customer_id,
        vehicle_id: (appointment as any).vehicle_id,
        customer_nombre: (appointment as any).customer_nombre,
        vehicle_marca: (appointment as any).vehicle_marca
      });

      if ((appointment as any).customer_id && (appointment as any).vehicle_id) {
        // YA TENEMOS CLIENTE Y VEHÍCULO - Ir directo a servicio
        console.log('✅ Cita tiene cliente y vehículo - saltando a paso de servicio');
        
        // Crear objetos simulados con los datos que ya tenemos
        const existingCustomer = {
          customer_id: (appointment as any).customer_id,
          nombre: (appointment as any).customer_nombre || appointment.cita_nombre_contacto,
          telefono: (appointment as any).customer_telefono || appointment.cita_telefono_contacto,
        };
        
        const existingVehicle = {
          vehicle_id: (appointment as any).vehicle_id,
          marca: (appointment as any).vehicle_marca || '',
          modelo: (appointment as any).vehicle_modelo || '',
          año: (appointment as any).vehicle_año || new Date().getFullYear(),
          placa_actual: (appointment as any).vehicle_placa || '',
        };

        setSelectedCustomer(existingCustomer);
        setSelectedVehicle(existingVehicle);
        setValue('customer_id', existingCustomer.customer_id);
        setValue('vehicle_id', existingVehicle.vehicle_id);
        setStep('service');
      } else {
        // NO TIENE DATOS COMPLETOS - Empezar desde cliente
        console.log('⚠️ Cita sin datos completos - empezando desde búsqueda');
        setStep('customer');
      }
    }
  }, [isOpen, reset, setValue, appointment]);

  const loadMechanics = async () => {
    try {
      const response = await mechanicService.getMechanics({ activo: true, limit: 100 });
      setMechanics(response.mechanics || []);
    } catch (error) {
      console.error('Error cargando mecánicos:', error);
    }
  };

  // Búsqueda de clientes con debounce
  useEffect(() => {
    if (customerSearchTerm.length >= 2 && !isNewCustomer) {
      const timeoutId = setTimeout(async () => {
        try {
          const response = await customerService.searchByName(customerSearchTerm);
          setCustomerSearchResults(response.customers || []);
        } catch (error) {
          console.error('Error buscando clientes:', error);
          setCustomerSearchResults([]);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setCustomerSearchResults([]);
    }
  }, [customerSearchTerm, isNewCustomer]);

  const handleCustomerSelect = async (customer: Customer) => {
    console.log('👤 Cliente seleccionado:', customer.nombre);
    setSelectedCustomer(customer);
    setCustomerSearchResults([]);
    setValue('customer_id', customer.customer_id);
    
    // Cargar vehículos del cliente
    try {
      const response = await vehicleService.getCustomerVehicles(customer.customer_id);
      setCustomerVehicles(response.vehicles || []);
      
      if (response.vehicles && response.vehicles.length > 0) {
        setStep('vehicle');
      } else {
        setIsNewVehicle(true);
        setStep('service');
      }
    } catch (error) {
      console.error('Error cargando vehículos del cliente:', error);
      setIsNewVehicle(true);
      setStep('service');
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    console.log('🚗 Vehículo seleccionado:', vehicle.placa_actual);
    setSelectedVehicle(vehicle);
    setValue('vehicle_id', vehicle.vehicle_id);
    setStep('service');
  };

  const handleNewCustomerToggle = () => {
    setIsNewCustomer(!isNewCustomer);
    setSelectedCustomer(null);
    setCustomerVehicles([]);
    setSelectedVehicle(null);
    setCustomerSearchResults([]);
    setCustomerSearchTerm('');
    
    if (!isNewCustomer) {
      // Pre-llenar teléfono de la cita
      setValue('new_customer.telefono', appointment.cita_telefono_contacto);
      setValue('new_customer.nombre', appointment.cita_nombre_contacto);
      setIsNewVehicle(true);
      setStep('service');
    } else {
      setStep('customer');
    }
  };

  const onSubmit = async (data: ConvertAppointmentRequest) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎯 Enviando datos de conversión:', data);

      const result = await appointmentService.convertToService(appointment.opportunity_id, data);
      
      console.log('✅ Conversión exitosa:', result);
      onSuccess();
    } catch (error: any) {
      console.error('❌ Error en conversión:', error);
      const errorMessage = error.response?.data?.error || 'Error al convertir la cita';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            🎯 Convertir Cita a Servicio
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Información de la Cita */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">📅 Información de la Cita</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-medium">Hora:</span> {appointment.cita_hora}</p>
              <p><span className="font-medium">Contacto:</span> {appointment.cita_nombre_contacto}</p>
            </div>
            <div>
              <p><span className="font-medium">Teléfono:</span> {appointment.cita_telefono_contacto}</p>
              <p><span className="font-medium">Vehículo:</span> {appointment.cita_descripcion_breve}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* PASO 1: Cliente */}
          {step === 'customer' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!isNewCustomer}
                    onChange={() => !isNewCustomer || handleNewCustomerToggle()}
                    className="mr-2"
                  />
                  Cliente Existente
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={isNewCustomer}
                    onChange={() => isNewCustomer || handleNewCustomerToggle()}
                    className="mr-2"
                  />
                  Cliente Nuevo
                </label>
              </div>

              {!isNewCustomer ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔍 Buscar Cliente
                  </label>
                  <input
                    type="text"
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    placeholder="Nombre o teléfono del cliente..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  
                  {customerSearchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      {customerSearchResults.map((customer) => (
                        <button
                          key={customer.customer_id}
                          type="button"
                          onClick={() => handleCustomerSelect(customer)}
                          className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{customer.nombre}</div>
                          <div className="text-sm text-gray-600">{customer.telefono}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">👤 Datos del Cliente Nuevo</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      {...register('new_customer.nombre', { required: 'Nombre es requerido' })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                    {errors.new_customer?.nombre && (
                      <p className="text-red-600 text-sm mt-1">{errors.new_customer.nombre.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono *
                      </label>
                      <input
                        {...register('new_customer.telefono', { required: 'Teléfono es requerido' })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        {...register('new_customer.email')}
                        type="email"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      {...register('new_customer.direccion')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('service')}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Continuar ➡️
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PASO 2: Vehículo */}
          {step === 'vehicle' && selectedCustomer && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">
                🚗 Vehículos de {selectedCustomer.nombre}
              </h3>
              
              <div className="space-y-2">
                {customerVehicles.map((vehicle) => (
                  <button
                    key={vehicle.vehicle_id}
                    type="button"
                    onClick={() => handleVehicleSelect(vehicle)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="font-medium">
                      {vehicle.marca} {vehicle.modelo} {vehicle.año}
                    </div>
                    <div className="text-sm text-gray-600">
                      {vehicle.color} - Placas: {vehicle.placa_actual}
                    </div>
                  </button>
                ))}
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isNewVehicle}
                    onChange={(e) => setIsNewVehicle(e.target.checked)}
                    className="mr-2"
                  />
                  Es un vehículo nuevo de este cliente
                </label>
              </div>

              {isNewVehicle && (
                <button
                  type="button"
                  onClick={() => setStep('service')}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Continuar con Vehículo Nuevo ➡️
                </button>
              )}
            </div>
          )}

          {/* PASO 3: Servicio */}
          {step === 'service' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">🔧 Datos del Servicio</h3>

              {/* Información del cliente y vehículo seleccionados */}
              {selectedCustomer && selectedVehicle && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">✅ Cliente y Vehículo Confirmados</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium">Cliente:</span> {selectedCustomer.nombre}</p>
                      <p><span className="font-medium">Teléfono:</span> {selectedCustomer.telefono}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Vehículo:</span> {selectedVehicle.marca} {selectedVehicle.modelo} {selectedVehicle.año}</p>
                      <p><span className="font-medium">Placas:</span> {selectedVehicle.placa_actual}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Información del vehículo nuevo si aplica */}
              {isNewVehicle && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-yellow-900">🚗 Datos del Vehículo Nuevo</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Marca *
                      </label>
                      <input
                        {...register('new_vehicle.marca', { required: 'Marca es requerida' })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Modelo *
                      </label>
                      <input
                        {...register('new_vehicle.modelo', { required: 'Modelo es requerido' })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Año *
                      </label>
                      <input
                        {...register('new_vehicle.año', { 
                          required: 'Año es requerido',
                          min: { value: 1900, message: 'Año inválido' },
                          max: { value: new Date().getFullYear() + 1, message: 'Año inválido' }
                        })}
                        type="number"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color *
                      </label>
                      <input
                        {...register('new_vehicle.color', { required: 'Color es requerido' })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Placas *
                      </label>
                      <input
                        {...register('new_vehicle.placa_actual', { required: 'Placas son requeridas' })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Datos del servicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Servicio *
                </label>
                <select
                  {...register('tipo_servicio', { required: 'Tipo de servicio es requerido' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Diagnóstico">Diagnóstico</option>
                  <option value="Reparación">Reparación</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Revisión">Revisión</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  💡 El precio se establecerá durante la cotización
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción del Servicio
                </label>
                <textarea
                  {...register('descripcion')}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mecánico Asignado
                </label>
                <select
                  {...register('mechanic_id')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Sin asignar</option>
                  {mechanics.map((mechanic) => (
                    <option key={mechanic.mechanic_id} value={mechanic.mechanic_id}>
                      {mechanic.alias ? `"${mechanic.alias}" - ` : ''}
                      {mechanic.nombre} {mechanic.apellidos} 
                      ({mechanic.nivel_experiencia} - {mechanic.branch_nombre})
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {loading ? '⏳ Convirtiendo...' : '🎯 Crear Servicio'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ConvertAppointmentModal;