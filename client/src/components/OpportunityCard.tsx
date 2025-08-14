import type { Opportunity } from '../types/index';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSelect?: (opportunity: Opportunity) => void;
  onStatusChange?: (opportunityId: number, newStatus: string) => void;
  onConvertToAppointment?: (opportunity: Opportunity) => void;
  onDelete?: (opportunity: Opportunity) => void;
  showVehicleInfo?: boolean;
}

const STATUS_COLORS = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  contactado: 'bg-blue-100 text-blue-800',
  agendado: 'bg-purple-100 text-purple-800',
  en_proceso: 'bg-orange-100 text-orange-800',
  completado: 'bg-green-100 text-green-800',
  perdido: 'bg-red-100 text-red-800',
};

const PRIORITY_COLORS = {
  alta: 'bg-red-100 text-red-800',
  media: 'bg-yellow-100 text-yellow-800',
  baja: 'bg-green-100 text-green-800',
};

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  contactado: 'Contactado',
  agendado: 'Agendado',
  en_proceso: 'En Proceso',
  completado: 'Completado',
  perdido: 'Perdido',
};

const PRIORITY_LABELS = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export const OpportunityCard = ({ 
  opportunity, 
  onSelect, 
  onStatusChange, 
  onConvertToAppointment,
  onDelete,
  showVehicleInfo = true 
}: OpportunityCardProps) => {
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/^\+52/, '');
    return `https://wa.me/52${cleanPhone}`;
  };

  const getDaysUntilService = () => {
    if (!opportunity.fecha_sugerida) return null;
    
    const today = new Date();
    const serviceDate = new Date(opportunity.fecha_sugerida);
    const diffTime = serviceDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysUntilService = getDaysUntilService();

  const getUrgencyColor = () => {
    if (!daysUntilService) return '';
    
    if (daysUntilService < 0) return 'border-l-4 border-red-500'; // Vencido
    if (daysUntilService <= 3) return 'border-l-4 border-orange-500'; // Urgente
    if (daysUntilService <= 7) return 'border-l-4 border-yellow-500'; // Próximo
    return 'border-l-4 border-green-500'; // Futuro
  };

  // Verificar si la oportunidad se puede eliminar
  const canDelete = () => {
    // No se puede eliminar si ya fue convertida a servicio
    if (opportunity.converted_to_service_id) {
      return false;
    }
    
    // Solo se puede eliminar si no tiene servicio asignado
    // (En este contexto, asumimos que si no tiene converted_to_service_id, se puede eliminar)
    return true;
  };

  return (
    <div 
      className={`card p-6 hover:shadow-md transition-shadow cursor-pointer ${getUrgencyColor()}`}
      onClick={() => onSelect?.(opportunity)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {opportunity.titulo}
          </h3>
          
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[opportunity.estado as keyof typeof STATUS_COLORS]}`}>
              {STATUS_LABELS[opportunity.estado as keyof typeof STATUS_LABELS]}
            </span>
            
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[opportunity.prioridad as keyof typeof PRIORITY_COLORS]}`}>
              Prioridad {PRIORITY_LABELS[opportunity.prioridad as keyof typeof PRIORITY_LABELS]}
            </span>

            {opportunity.precio_estimado && (
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                {formatPrice(opportunity.precio_estimado)}
              </span>
            )}
          </div>
        </div>

        {onStatusChange && (
          <div className="ml-4">
            <select
              value={opportunity.estado}
              onChange={(e) => {
                e.stopPropagation();
                onStatusChange(opportunity.opportunity_id, e.target.value);
              }}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pendiente">Pendiente</option>
              <option value="contactado">Contactado</option>
              <option value="agendado">Agendado</option>
              <option value="en_proceso">En Proceso</option>
              <option value="completado">Completado</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>
        )}
      </div>

      {/* Vehicle and Customer Info */}
      {(showVehicleInfo && (opportunity.vehicle_marca || opportunity.vin)) || opportunity.customer_nombre ? (
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex flex-col lg:flex-row lg:gap-6">
            {/* Vehicle Info */}
            {showVehicleInfo && (opportunity.vehicle_marca || opportunity.vin) && (
              <div className="flex-1 mb-3 lg:mb-0">
                <h4 className="font-medium text-gray-900 mb-1">
                  🚗 {opportunity.vehicle_marca} {opportunity.vehicle_modelo} {opportunity.vehicle_año}
                </h4>
                <p className="text-sm text-gray-600">
                  Placas: {opportunity.vehicle_placa || 'No asignadas'} • VIN: {opportunity.vin}
                </p>
              </div>
            )}

            {/* Customer Info */}
            {opportunity.customer_nombre && (
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  👤 Cliente: {opportunity.customer_nombre}
                </h4>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span>📞 {opportunity.customer_telefono}</span>
                  
                  {opportunity.customer_whatsapp && (
                    <a
                      href={formatPhoneForWhatsApp(opportunity.customer_whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Description */}
      <div className="mb-4">
        <p className="text-gray-700 text-sm line-clamp-2">
          {opportunity.descripcion}
        </p>
        
        {opportunity.servicio_sugerido && (
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium">Servicio:</span> {opportunity.servicio_sugerido}
          </p>
        )}
      </div>

      {/* Dates and Assignment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
        <div>
          {opportunity.fecha_sugerida && (
            <p>
              <span className="font-medium">Fecha sugerida:</span> {formatDate(opportunity.fecha_sugerida)}
              {daysUntilService !== null && (
                <span className={`ml-2 ${
                  daysUntilService < 0 ? 'text-red-600 font-medium' :
                  daysUntilService <= 3 ? 'text-orange-600 font-medium' :
                  daysUntilService <= 7 ? 'text-yellow-600 font-medium' :
                  'text-green-600'
                }`}>
                  {daysUntilService < 0 ? `(${Math.abs(daysUntilService)} días vencido)` :
                   daysUntilService === 0 ? '(Hoy)' :
                   daysUntilService === 1 ? '(Mañana)' :
                   `(en ${daysUntilService} días)`}
                </span>
              )}
            </p>
          )}
          
          {opportunity.fecha_contacto_sugerida && (
            <p>
              <span className="font-medium">Contactar:</span> {formatDate(opportunity.fecha_contacto_sugerida)}
            </p>
          )}
        </div>

        <div>
          {opportunity.usuario_asignado_nombre && (
            <p>
              <span className="font-medium">Asignado a:</span> {opportunity.usuario_asignado_nombre}
            </p>
          )}
          
          <p>
            <span className="font-medium">Creado:</span> {formatDate(opportunity.fecha_creacion)}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Tipo: {opportunity.tipo_oportunidad.replace(/_/g, ' ')}
          {opportunity.kilometraje_referencia && (
            <span className="ml-2">• {opportunity.kilometraje_referencia.toLocaleString()} km</span>
          )}
        </div>

        <div className="flex space-x-2">
          {opportunity.customer_whatsapp && (
            <a
              href={formatPhoneForWhatsApp(opportunity.customer_whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              WhatsApp
            </a>
          )}

          {/* Botón Convertir a Cita - Solo mostrar si la oportunidad NO es ya una cita y tiene cliente/vehículo */}
          {!opportunity.tiene_cita && opportunity.customer_id && opportunity.vehicle_id && onConvertToAppointment && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConvertToAppointment(opportunity);
              }}
              className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded"
              title="Convertir a cita programada"
            >
              📅 Agendar
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(opportunity);
            }}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
          >
            Ver Detalles
          </button>

          {/* Botón Eliminar - Solo mostrar si se puede eliminar y se proporciona la función */}
          {canDelete() && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`¿Estás seguro de que deseas eliminar esta oportunidad?\n\n"${opportunity.titulo}"\n\nEsta acción no se puede deshacer.`)) {
                  onDelete(opportunity);
                }
              }}
              className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition-colors"
              title="Eliminar oportunidad (solo si no tiene servicio asignado)"
            >
              🗑️ Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};