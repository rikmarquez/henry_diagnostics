import React from 'react';
import type { User, UserActivity } from '../services/users';

interface UserActivityModalProps {
  user: User | null;
  activities: UserActivity[];
  isOpen: boolean;
  onClose: () => void;
}

export const UserActivityModal: React.FC<UserActivityModalProps> = ({
  user,
  activities,
  isOpen,
  onClose
}) => {
  if (!isOpen || !user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionDisplayName = (action: string) => {
    switch (action) {
      case 'user_created': return 'Usuario creado';
      case 'user_updated': return 'Usuario actualizado';
      case 'password_reset': return 'Contraseña restablecida';
      case 'login': return 'Inicio de sesión';
      case 'logout': return 'Cierre de sesión';
      case 'password_changed': return 'Contraseña cambiada';
      default: return action;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'user_created':
        return '➕';
      case 'user_updated':
        return '✏️';
      case 'password_reset':
        return '🔑';
      case 'login':
        return '🔓';
      case 'logout':
        return '🔒';
      case 'password_changed':
        return '🔐';
      default:
        return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'user_created':
        return 'text-green-600 bg-green-50';
      case 'user_updated':
        return 'text-blue-600 bg-blue-50';
      case 'password_reset':
        return 'text-yellow-600 bg-yellow-50';
      case 'login':
        return 'text-green-600 bg-green-50';
      case 'logout':
        return 'text-gray-600 bg-gray-50';
      case 'password_changed':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const renderActivityDetails = (activity: UserActivity) => {
    if (!activity.detalles) return null;

    try {
      const details = typeof activity.detalles === 'string' 
        ? JSON.parse(activity.detalles) 
        : activity.detalles;

      return (
        <div className="mt-2 text-sm text-gray-600">
          {activity.accion === 'user_updated' && details.changes && (
            <div>
              <span className="font-medium">Cambios realizados:</span>
              <ul className="list-disc list-inside ml-2 mt-1">
                {Object.entries(details.changes).map(([key, value]) => (
                  <li key={key}>
                    <span className="capitalize">{key}:</span> {String(value)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {activity.accion === 'user_created' && details.created_user && (
            <div>
              <span className="font-medium">Usuario creado:</span>
              <div className="ml-2 mt-1">
                Email: {details.created_user.email}<br/>
                Rol: {details.created_user.rol}
              </div>
            </div>
          )}

          {activity.accion === 'password_reset' && details.reset_by && (
            <div>
              <span className="font-medium">Restablecido por:</span> {details.reset_by}
            </div>
          )}
        </div>
      );
    } catch (error) {
      return (
        <div className="mt-2 text-sm text-gray-500">
          Detalles: {String(activity.detalles)}
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-0 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-md">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Actividad de Usuario
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {user.nombre} ({user.email})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Cerrar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <p className="text-gray-500">No hay actividades registradas para este usuario</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.log_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(activity.accion)}`}>
                        <span className="text-sm">{getActionIcon(activity.accion)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {getActionDisplayName(activity.accion)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(activity.fecha)}
                        </p>
                        {activity.performed_by_name && (
                          <p className="text-xs text-gray-400 mt-1">
                            Realizado por: {activity.performed_by_name}
                          </p>
                        )}
                        {renderActivityDetails(activity)}
                      </div>
                    </div>
                  </div>
                  
                  {(activity.ip_address || activity.user_agent) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-400 space-y-1">
                        {activity.ip_address && (
                          <div>IP: {activity.ip_address}</div>
                        )}
                        {activity.user_agent && (
                          <div className="truncate">
                            Navegador: {activity.user_agent}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-3 rounded-b-md">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};