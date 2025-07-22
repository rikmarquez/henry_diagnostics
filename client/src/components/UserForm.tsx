import React, { useState, useEffect } from 'react';
import type { User, CreateUserRequest, UpdateUserRequest } from '../services/users';

interface UserFormProps {
  user?: User;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => void;
  loading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    rol: 'mecanico' as 'administrador' | 'mecanico' | 'seguimiento',
    telefono: '',
    activo: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        telefono: user.telefono || '',
        activo: user.activo
      });
    } else {
      setFormData({
        email: '',
        nombre: '',
        rol: 'mecanico',
        telefono: '',
        activo: true
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.rol) {
      newErrors.rol = 'El rol es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      email: formData.email.trim(),
      nombre: formData.nombre.trim(),
      rol: formData.rol,
      telefono: formData.telefono.trim() || undefined,
      ...(user && { activo: formData.activo })
    };

    onSubmit(submitData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {user ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </h3>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="usuario@ejemplo.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                className={`input ${errors.nombre ? 'border-red-500' : ''}`}
                placeholder="Juan Pérez"
                disabled={loading}
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
              )}
            </div>

            {/* Rol */}
            <div>
              <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-1">
                Rol *
              </label>
              <select
                id="rol"
                value={formData.rol}
                onChange={(e) => handleChange('rol', e.target.value as 'administrador' | 'mecanico' | 'seguimiento')}
                className={`input ${errors.rol ? 'border-red-500' : ''}`}
                disabled={loading}
              >
                <option value="mecanico">Técnico/Mecánico</option>
                <option value="seguimiento">Personal de Seguimiento</option>
                <option value="administrador">Administrador</option>
              </select>
              {errors.rol && (
                <p className="mt-1 text-sm text-red-600">{errors.rol}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.rol === 'administrador' && 'Acceso completo al sistema'}
                {formData.rol === 'mecanico' && 'Gestión de vehículos y servicios'}
                {formData.rol === 'seguimiento' && 'Seguimiento de oportunidades y clientes'}
              </p>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                className="input"
                placeholder="+1 234 567 8900"
                disabled={loading}
              />
            </div>

            {/* Estado (solo para edición) */}
            {user && (
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => handleChange('activo', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-700">Usuario activo</span>
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Los usuarios inactivos no pueden iniciar sesión en el sistema
                </p>
              </div>
            )}

            {/* Información adicional para nuevo usuario */}
            {!user && (
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Contraseña temporal
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Se generará automáticamente una contraseña temporal que deberás proporcionar al usuario.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {user ? 'Actualizando...' : 'Creando...'}
                  </div>
                ) : (
                  user ? 'Actualizar Usuario' : 'Crear Usuario'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};