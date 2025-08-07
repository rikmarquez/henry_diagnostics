import React, { useState, useEffect } from 'react';
import { receptionService, CitaRecepcion, ReceptionWalkInRequest } from '../services/reception';

const Reception: React.FC = () => {
  const [citas, setCitas] = useState<CitaRecepcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Estados para modales
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState<CitaRecepcion | null>(null);

  // Estados para formulario walk-in
  const [walkInForm, setWalkInForm] = useState<ReceptionWalkInRequest>({
    accion: 'servicio_inmediato',
    cliente_nuevo: {
      nombre: '',
      telefono: '',
      whatsapp: '',
      email: '',
      direccion: ''
    },
    vehiculo_nuevo: {
      marca: '',
      modelo: '',
      año: new Date().getFullYear(),
      placa_actual: '',
      color: '',
      kilometraje_actual: 0
    },
    servicio_inmediato: {
      tipo_servicio: '',
      descripcion: '',
      precio_estimado: 0
    }
  });

  const [receptionForm, setReceptionForm] = useState({
    tipo_servicio: '',
    descripcion: '',
    precio_estimado: 0,
    usuario_mecanico: null as number | null
  });

  const loadCitas = async () => {
    try {
      setLoading(true);
      const response = await receptionService.getCitasDelDia(selectedDate);
      setCitas(response.citas);
    } catch (error) {
      console.error('Error cargando citas:', error);
      alert('Error cargando citas del día');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCitas();
  }, [selectedDate]);

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await receptionService.processWalkInClient(walkInForm);
      alert('Cliente walk-in procesado exitosamente');
      setShowWalkInModal(false);
      resetWalkInForm();
      loadCitas();
    } catch (error: any) {
      console.error('Error procesando walk-in:', error);
      alert(error.response?.data?.details || 'Error procesando cliente');
    }
  };

  const handleReceptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCita) return;
    
    try {
      await receptionService.receptionarCita(selectedCita.opportunity_id, receptionForm);
      alert('Cita recepcionada exitosamente');
      setShowReceptionModal(false);
      setSelectedCita(null);
      resetReceptionForm();
      loadCitas();
    } catch (error: any) {
      console.error('Error recepcionando cita:', error);
      alert(error.response?.data?.details || 'Error recepcionando cita');
    }
  };

  const resetWalkInForm = () => {
    setWalkInForm({
      accion: 'servicio_inmediato',
      cliente_nuevo: {
        nombre: '',
        telefono: '',
        whatsapp: '',
        email: '',
        direccion: ''
      },
      vehiculo_nuevo: {
        marca: '',
        modelo: '',
        año: new Date().getFullYear(),
        placa_actual: '',
        color: '',
        kilometraje_actual: 0
      },
      servicio_inmediato: {
        tipo_servicio: '',
        descripcion: '',
        precio_estimado: 0
      }
    });
  };

  const resetReceptionForm = () => {
    setReceptionForm({
      tipo_servicio: '',
      descripcion: '',
      precio_estimado: 0,
      usuario_mecanico: null
    });
  };

  const getOrigenBadge = (origen: string) => {
    const colorMap = {
      opportunity: 'bg-blue-100 text-blue-800',
      llamada_cliente: 'bg-green-100 text-green-800',
      walk_in: 'bg-purple-100 text-purple-800',
      seguimiento: 'bg-orange-100 text-orange-800',
      manual: 'bg-gray-100 text-gray-800'
    };
    
    const labelMap = {
      opportunity: 'Seguimiento',
      llamada_cliente: 'Llamada',
      walk_in: 'Walk-in',
      seguimiento: 'Seguimiento',
      manual: 'Manual'
    };

    const color = colorMap[origen as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
    const label = labelMap[origen as keyof typeof labelMap] || origen;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  const getTipoCitaBadge = (tipo: string) => {
    return tipo === 'cita_rapida' 
      ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Datos Incompletos</span>
      : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Datos Completos</span>;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recepción</h1>
          <p className="text-gray-600">Gestión de llegada de clientes y citas</p>
        </div>
        <button
          onClick={() => setShowWalkInModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <span className="mr-2">👤</span>
          Cliente Walk-In
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Fecha</label>
        <input
          id="date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="mt-1 block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            📅 Citas del Día - {new Date(selectedDate).toLocaleDateString('es-MX')}
          </h3>
          
          {loading ? (
            <p>Cargando citas...</p>
          ) : citas.length === 0 ? (
            <p className="text-gray-500">No hay citas programadas para este día</p>
          ) : (
            <div className="space-y-4">
              {citas.map((cita) => (
                <div key={cita.opportunity_id} className="border border-gray-200 rounded-lg p-4 border-l-4 border-l-blue-500">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span>⏰</span>
                          <span className="font-semibold">{cita.cita_hora}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>👤</span>
                          <span>{cita.cita_nombre_contacto}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>📞</span>
                          <span>{cita.cita_telefono_contacto}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm">
                        <span>🚗</span>
                        <span>{cita.cita_descripcion_breve}</span>
                      </div>

                      {cita.placa_actual && (
                        <div className="text-sm text-gray-600">
                          {cita.marca} {cita.modelo} - {cita.placa_actual}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {getOrigenBadge(cita.origen_cita)}
                        {getTipoCitaBadge(cita.tipo_cita)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {cita.tipo_cita === 'cita_completa' ? (
                        <button 
                          onClick={() => {
                            setSelectedCita(cita);
                            setShowReceptionModal(true);
                          }}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <span className="mr-1">✅</span>
                          Recepcionar
                        </button>
                      ) : (
                        <button 
                          disabled
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
                        >
                          Completar Datos Primero
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Walk-In */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cliente Walk-In</h3>
              <p className="text-sm text-gray-600 mb-6">Procesar cliente que llegó sin cita previa</p>
              
              <form onSubmit={handleWalkInSubmit} className="space-y-6">
                {/* Datos del Cliente */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Datos del Cliente</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                      <input
                        type="text"
                        required
                        value={walkInForm.cliente_nuevo?.nombre || ''}
                        onChange={(e) => setWalkInForm(prev => ({
                          ...prev,
                          cliente_nuevo: { ...prev.cliente_nuevo!, nombre: e.target.value }
                        }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Teléfono *</label>
                      <input
                        type="tel"
                        required
                        value={walkInForm.cliente_nuevo?.telefono || ''}
                        onChange={(e) => setWalkInForm(prev => ({
                          ...prev,
                          cliente_nuevo: { ...prev.cliente_nuevo!, telefono: e.target.value }
                        }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Datos del Vehículo */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Datos del Vehículo</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Marca *</label>
                      <input
                        type="text"
                        required
                        value={walkInForm.vehiculo_nuevo?.marca || ''}
                        onChange={(e) => setWalkInForm(prev => ({
                          ...prev,
                          vehiculo_nuevo: { ...prev.vehiculo_nuevo!, marca: e.target.value }
                        }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Modelo *</label>
                      <input
                        type="text"
                        required
                        value={walkInForm.vehiculo_nuevo?.modelo || ''}
                        onChange={(e) => setWalkInForm(prev => ({
                          ...prev,
                          vehiculo_nuevo: { ...prev.vehiculo_nuevo!, modelo: e.target.value }
                        }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Año *</label>
                      <input
                        type="number"
                        required
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        value={walkInForm.vehiculo_nuevo?.año || new Date().getFullYear()}
                        onChange={(e) => setWalkInForm(prev => ({
                          ...prev,
                          vehiculo_nuevo: { ...prev.vehiculo_nuevo!, año: parseInt(e.target.value) }
                        }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Placas *</label>
                      <input
                        type="text"
                        required
                        value={walkInForm.vehiculo_nuevo?.placa_actual || ''}
                        onChange={(e) => setWalkInForm(prev => ({
                          ...prev,
                          vehiculo_nuevo: { ...prev.vehiculo_nuevo!, placa_actual: e.target.value.toUpperCase() }
                        }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Tipo de Servicio */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Servicio</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">¿Qué quiere hacer el cliente?</label>
                      <select 
                        value={walkInForm.accion} 
                        onChange={(e) => setWalkInForm(prev => ({ 
                          ...prev, 
                          accion: e.target.value as 'servicio_inmediato' | 'agendar_cita' 
                        }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="servicio_inmediato">Servicio inmediato</option>
                        <option value="agendar_cita">Agendar cita para después</option>
                      </select>
                    </div>

                    {walkInForm.accion === 'servicio_inmediato' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Tipo de servicio *</label>
                          <input
                            type="text"
                            required
                            value={walkInForm.servicio_inmediato?.tipo_servicio || ''}
                            onChange={(e) => setWalkInForm(prev => ({
                              ...prev,
                              servicio_inmediato: { ...prev.servicio_inmediato!, tipo_servicio: e.target.value }
                            }))}
                            placeholder="Ej: Cambio de aceite, Reparación de frenos..."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Descripción</label>
                          <textarea
                            value={walkInForm.servicio_inmediato?.descripcion || ''}
                            onChange={(e) => setWalkInForm(prev => ({
                              ...prev,
                              servicio_inmediato: { ...prev.servicio_inmediato!, descripcion: e.target.value }
                            }))}
                            placeholder="Detalles del servicio requerido..."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowWalkInModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {walkInForm.accion === 'servicio_inmediato' ? 'Crear Servicio' : 'Agendar Cita'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Recepción */}
      {showReceptionModal && selectedCita && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recepcionar Cita</h3>
              <p className="text-sm text-gray-600 mb-6">
                Cliente: {selectedCita.cita_nombre_contacto} - {selectedCita.cita_descripcion_breve}
              </p>
              
              <form onSubmit={handleReceptionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de servicio</label>
                  <input
                    type="text"
                    value={receptionForm.tipo_servicio}
                    onChange={(e) => setReceptionForm(prev => ({ ...prev, tipo_servicio: e.target.value }))}
                    placeholder={selectedCita.cita_descripcion_breve}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción detallada</label>
                  <textarea
                    value={receptionForm.descripcion}
                    onChange={(e) => setReceptionForm(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Detalles del diagnóstico y trabajo a realizar..."
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio estimado</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={receptionForm.precio_estimado}
                    onChange={(e) => setReceptionForm(prev => ({ ...prev, precio_estimado: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowReceptionModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Crear Servicio
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reception;