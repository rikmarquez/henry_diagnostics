import React, { useState, useEffect } from 'react';
import { getUsers, getUserStats, createUser, updateUser, resetUserPassword, getUserActivity } from '../services/users';
import type { User, UserStats, CreateUserRequest, UpdateUserRequest, UserFilters, UserActivity } from '../services/users';
import { UserForm } from '../components/UserForm';
import { UserActivityModal } from '../components/UserActivityModal';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [tempPassword, setTempPassword] = useState<string>('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10
  });
  
  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, statsResponse] = await Promise.all([
        getUsers(filters),
        getUserStats()
      ]);
      
      setUsers(usersResponse.users);
      setPagination(usersResponse.pagination);
      setStats(statsResponse);
    } catch (err) {
      setError('Error al cargar datos de usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: CreateUserRequest) => {
    try {
      const response = await createUser(userData);
      setTempPassword(response.temporary_password);
      setShowPasswordModal(true);
      setShowCreateForm(false);
      loadData();
    } catch (err) {
      setError('Error al crear usuario');
      console.error(err);
    }
  };

  const handleUpdateUser = async (userData: UpdateUserRequest) => {
    if (!selectedUser) return;
    
    try {
      await updateUser(selectedUser.user_id, userData);
      setShowEditForm(false);
      setSelectedUser(null);
      loadData();
    } catch (err) {
      setError('Error al actualizar usuario');
      console.error(err);
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      const response = await resetUserPassword(userId);
      setTempPassword(response.temporary_password);
      setShowPasswordModal(true);
    } catch (err) {
      setError('Error al restablecer contraseña');
      console.error(err);
    }
  };

  const handleViewActivity = async (user: User) => {
    try {
      setSelectedUser(user);
      const response = await getUserActivity(user.user_id);
      setActivities(response.activities);
      setShowActivityModal(true);
    } catch (err) {
      setError('Error al cargar actividades del usuario');
      console.error(err);
    }
  };

  const getRoleDisplayName = (rol: string) => {
    switch (rol) {
      case 'administrador': return 'Administrador';
      case 'mecanico': return 'Técnico/Mecánico';
      case 'seguimiento': return 'Personal de Seguimiento';
      default: return rol;
    }
  };

  const getRoleBadgeColor = (rol: string) => {
    switch (rol) {
      case 'administrador': return 'bg-red-100 text-red-800';
      case 'mecanico': return 'bg-blue-100 text-blue-800';
      case 'seguimiento': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p className="mt-2 text-gray-600">Administra usuarios del sistema</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-blue-600">{stats.total_usuarios}</div>
            <div className="text-sm text-gray-600">Total Usuarios</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-green-600">{stats.usuarios_activos}</div>
            <div className="text-sm text-gray-600">Activos</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-yellow-600">{stats.passwords_temporales}</div>
            <div className="text-sm text-gray-600">Contraseñas Temp.</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-purple-600">{stats.activos_mes}</div>
            <div className="text-sm text-gray-600">Activos Este Mes</div>
          </div>
        </div>
      )}

      {/* Filtros y acciones */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              className="input"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
            <select
              className="input"
              value={filters.rol || ''}
              onChange={(e) => setFilters({ ...filters, rol: e.target.value || undefined, page: 1 })}
            >
              <option value="">Todos los roles</option>
              <option value="administrador">Administrador</option>
              <option value="mecanico">Técnico/Mecánico</option>
              <option value="seguimiento">Personal de Seguimiento</option>
            </select>
            <select
              className="input"
              value={filters.activo?.toString() || ''}
              onChange={(e) => setFilters({ 
                ...filters, 
                activo: e.target.value ? e.target.value === 'true' : undefined, 
                page: 1 
              })}
            >
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary whitespace-nowrap"
          >
            + Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="bg-white shadow border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acceso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.password_temp && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Contraseña temporal
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.rol)}`}>
                      {getRoleDisplayName(user.rol)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.ultimo_login ? formatDate(user.ultimo_login) : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowEditForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleResetPassword(user.user_id)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => handleViewActivity(user)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Actividad
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} usuarios
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                disabled={!pagination.hasPrev}
                className="btn-secondary disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                disabled={!pagination.hasNext}
                className="btn-secondary disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de contraseña temporal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contraseña Temporal Generada</h3>
              <div className="bg-gray-50 p-4 rounded border">
                <p className="text-sm text-gray-600 mb-2">Contraseña temporal:</p>
                <p className="text-lg font-mono font-bold text-blue-600 bg-white p-2 rounded border">
                  {tempPassword}
                </p>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                ⚠️ Guarda esta contraseña temporal. El usuario deberá cambiarla en su primer inicio de sesión.
              </p>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setTempPassword('');
                  }}
                  className="btn-primary"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de formulario de usuario */}
      <UserForm
        user={showEditForm ? selectedUser : undefined}
        isOpen={showCreateForm || showEditForm}
        onClose={() => {
          setShowCreateForm(false);
          setShowEditForm(false);
          setSelectedUser(null);
        }}
        onSubmit={showEditForm ? handleUpdateUser : handleCreateUser}
        loading={loading}
      />

      {/* Modal de actividad de usuario */}
      <UserActivityModal
        user={selectedUser}
        activities={activities}
        isOpen={showActivityModal}
        onClose={() => {
          setShowActivityModal(false);
          setSelectedUser(null);
          setActivities([]);
        }}
      />
    </div>
  );
};

export default Users;