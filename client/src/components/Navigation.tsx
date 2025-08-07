import { useAuth } from '../hooks/useAuth';
import { Logo } from './Logo';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Navigation = ({ currentPage, onPageChange }: NavigationProps) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const getRoleDisplayName = (rol: string) => {
    switch (rol) {
      case 'administrador':
        return 'Administrador';
      case 'mecanico':
        return 'Técnico/Mecánico';
      case 'seguimiento':
        return 'Personal de Seguimiento';
      default:
        return rol;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'appointments', label: 'Citas', icon: '📅' },
    { id: 'reception', label: 'Recepción', icon: '🚪' },
    { id: 'vehicles', label: 'Vehículos', icon: '🚗' },
    { id: 'customers', label: 'Clientes', icon: '👥' },
    { id: 'opportunities', label: 'Oportunidades', icon: '💼' },
    { id: 'reminders', label: 'Recordatorios', icon: '⏰' },
    ...(user?.rol === 'administrador' ? [{ id: 'users', label: 'Usuarios', icon: '👤' }] : []),
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <Logo size="sm" />
              <span className="ml-3 text-xl font-semibold text-gray-900">
                Henry Diagnostics
              </span>
            </div>
            
            {/* Navigation Menu */}
            <nav className="hidden md:flex space-x-6">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 bg-gray-50">
        <nav className="flex overflow-x-auto px-4 py-2 space-x-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
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
    </header>
  );
};