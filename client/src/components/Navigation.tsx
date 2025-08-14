import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Logo } from './Logo';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Navigation = ({ currentPage, onPageChange }: NavigationProps) => {
  const { user, logout } = useAuth();
  const [isSecondaryMenuOpen, setIsSecondaryMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Menú principal (header)
  const primaryMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'services', label: 'Servicios', icon: '🔧' },
    { id: 'appointments', label: 'Citas', icon: '📅' },
    { id: 'opportunities', label: 'Oportunidades', icon: '💼' },
  ];

  // Menú secundario (cortina)
  const secondaryMenuItems = [
    { id: 'reception', label: 'Recepción', icon: '🚪' },
    { id: 'appointmentList', label: 'Lista Completa', icon: '📋' },
    { id: 'vehicles', label: 'Vehículos', icon: '🚗' },
    { id: 'customers', label: 'Clientes', icon: '👥' },
    { id: 'mechanics', label: 'Mecánicos', icon: '🔧' },
    ...(user?.rol === 'administrador' ? [{ id: 'users', label: 'Usuarios', icon: '👤' }] : []),
  ];

  const toggleSecondaryMenu = () => {
    setIsSecondaryMenuOpen(!isSecondaryMenuOpen);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Primera línea: Logo, título y botón más opciones */}
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              <Logo size="sm" />
              <span className="ml-3 text-xl font-semibold text-gray-900">
                Henry Diagnostics
              </span>
            </div>
            
            {/* Botón para abrir menú secundario */}
            <button
              onClick={toggleSecondaryMenu}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isSecondaryMenuOpen
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Más opciones"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">Más</span>
              <span className={`transition-transform duration-200 ${isSecondaryMenuOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
          </div>
          
          {/* Segunda línea: Menú principal - Solo desktop */}
          <div className="hidden sm:block border-t border-gray-100 py-2">
            <nav className="flex items-center justify-center space-x-3 lg:space-x-6">
              {primaryMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    currentPage === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              
              {/* Cerrar sesión */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors whitespace-nowrap"
              >
                <span>🚪</span>
                <span>Cerrar Sesión</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Menú secundario tipo cortina */}
      <div className={`bg-gray-50 border-b border-gray-200 shadow-sm transition-all duration-300 ease-in-out overflow-hidden ${
        isSecondaryMenuOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-center space-x-4 lg:space-x-6 py-4">
            {secondaryMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setIsSecondaryMenuOpen(false); // Cerrar menú al seleccionar
                }}
                className={`flex items-center space-x-1 lg:space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  currentPage === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Navegación móvil - scroll horizontal con ambos menús */}
      <div className="sm:hidden border-t border-gray-200 bg-gray-50">
        <div className="px-4 py-2">
          <div className="text-xs text-gray-500 mb-2 font-medium">Principal</div>
          <nav className="flex overflow-x-auto space-x-3 mb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {primaryMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`flex flex-col items-center p-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors min-w-0 flex-shrink-0 ${
                  currentPage === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="text-base mb-1">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center p-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors min-w-0 flex-shrink-0 text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              <span className="text-base mb-1">🚪</span>
              <span className="text-xs">Cerrar</span>
            </button>
          </nav>
          
          <div className="text-xs text-gray-500 mb-2 font-medium">Administración</div>
          <nav className="flex overflow-x-auto space-x-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {secondaryMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`flex flex-col items-center p-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors min-w-0 flex-shrink-0 ${
                  currentPage === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="text-base mb-1">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};