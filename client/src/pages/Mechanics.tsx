import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  mechanicService, 
  type Mechanic, 
  type Branch, 
  type CreateMechanicRequest, 
  type UpdateMechanicRequest, 
  type MechanicFilters 
} from '../services/mechanics';
import { useAuth } from '../hooks/useAuth';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

export const Mechanics = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const canManageMechanics = user?.rol === 'administrador';

  const { register: registerFilters, watch: watchFilters, reset: resetFilters } = useForm<MechanicFilters>();
  const filters = watchFilters();

  const { 
    register: registerForm, 
    handleSubmit, 
    reset: resetForm, 
    formState: { isSubmitting },
    setValue,
    watch
  } = useForm<CreateMechanicRequest | UpdateMechanicRequest>();

  const especialidadesValue = watch('especialidades') || [];
  const certificacionesValue = watch('certificaciones') || [];

  // Cargar datos iniciales
  useEffect(() => {
    loadMechanics();
    loadBranches();
  }, []);

  // Recargar cuando cambien los filtros
  useEffect(() => {
    if (Object.values(filters).some(value => value)) {
      setPagination(prev => ({ ...prev, page: 1 }));
      loadMechanics();
    }
  }, [filters]);

  const loadMechanics = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value && value !== '')
      );
      
      const result = await mechanicService.getMechanics({ ...cleanFilters, page, limit: pagination.limit });
      setMechanics(result.mechanics || []);
      setPagination({
        page: result.pagination?.page || 1,
        limit: result.pagination?.limit || 20,
        total: result.pagination?.total || 0,
        totalPages: result.pagination?.totalPages || 0
      });
    } catch (err: any) {
      console.error('Error cargando mecánicos:', err);
      setError(err.response?.data?.message || 'Error al cargar mecánicos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const result = await mechanicService.getBranches();
      setBranches(result.branches || []);
    } catch (err: any) {
      console.error('Error cargando sucursales:', err);
    }
  };

  const handleMechanicSelect = async (mechanic: Mechanic) => {
    try {
      const result = await mechanicService.getMechanicById(mechanic.mechanic_id);
      setSelectedMechanic(result.mechanic);
      setViewMode('detail');
    } catch (err: any) {
      console.error('Error cargando detalle del mecánico:', err);
      setError(err.response?.data?.message || 'Error al cargar detalle del mecánico');
    }
  };

  const handleCreateMechanic = () => {
    resetForm({
      branch_id: branches[0]?.branch_id || 1,
      fecha_ingreso: new Date().toISOString().split('T')[0],
      especialidades: [],
      certificaciones: [],
      nivel_experiencia: 'junior',
      comision_porcentaje: 0
    });
    setViewMode('create');
  };

  const handleEditMechanic = () => {
    if (selectedMechanic) {
      resetForm({
        ...selectedMechanic,
        fecha_nacimiento: selectedMechanic.fecha_nacimiento?.split('T')[0],
        fecha_ingreso: selectedMechanic.fecha_ingreso.split('T')[0]
      });
      setViewMode('edit');
    }
  };

  const handleSaveMechanic = async (data: CreateMechanicRequest | UpdateMechanicRequest) => {
    try {
      setError(null);
      
      if (viewMode === 'create') {
        await mechanicService.createMechanic(data as CreateMechanicRequest);
      } else if (viewMode === 'edit' && selectedMechanic) {
        const result = await mechanicService.updateMechanic(selectedMechanic.mechanic_id, data as UpdateMechanicRequest);
        setSelectedMechanic(result.mechanic);
      }
      
      await loadMechanics(pagination.page);
      setViewMode(viewMode === 'create' ? 'list' : 'detail');
    } catch (err: any) {
      console.error('Error guardando mecánico:', err);
      setError(err.response?.data?.message || 'Error al guardar mecánico');
    }
  };

  const handleDeleteMechanic = async (mechanicId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este mecánico?')) return;

    try {
      setError(null);
      await mechanicService.deleteMechanic(mechanicId);
      await loadMechanics(pagination.page);
      setViewMode('list');
      setSelectedMechanic(null);
    } catch (err: any) {
      console.error('Error eliminando mecánico:', err);
      setError(err.response?.data?.message || 'Error al eliminar mecánico');
    }
  };

  const clearFilters = () => {
    resetFilters();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadMechanics();
  };

  const addEspecialidad = (especialidad: string) => {
    if (especialidad && !especialidadesValue.includes(especialidad)) {
      setValue('especialidades', [...especialidadesValue, especialidad]);
    }
  };

  const removeEspecialidad = (index: number) => {
    setValue('especialidades', especialidadesValue.filter((_, i) => i !== index));
  };

  const addCertificacion = (certificacion: string) => {
    if (certificacion && !certificacionesValue.includes(certificacion)) {
      setValue('certificaciones', [...certificacionesValue, certificacion]);
    }
  };

  const removeCertificacion = (index: number) => {
    setValue('certificaciones', certificacionesValue.filter((_, i) => i !== index));
  };

  const getExperienceBadgeColor = (level: string) => {
    switch (level) {
      case 'master': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      case 'senior': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'intermedio': return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case 'junior': return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
      case 'edit':
        return (
          <div className="space-y-6">
            {/* Botón de regreso */}
            <button
              onClick={() => setViewMode(viewMode === 'create' ? 'list' : 'detail')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              ← Regresar {viewMode === 'create' ? 'a lista' : 'a detalle'}
            </button>

            {/* Formulario */}
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {viewMode === 'create' ? 'Crear Nuevo Mecánico' : `Editar Mecánico #${selectedMechanic?.mechanic_id}`}
              </h2>

              <form onSubmit={handleSubmit(handleSaveMechanic)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Información Personal */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Información Personal</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sucursal *
                      </label>
                      <select {...registerForm('branch_id')} className="input-field" required>
                        {branches.map((branch) => (
                          <option key={branch.branch_id} value={branch.branch_id}>
                            {branch.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Empleado *
                      </label>
                      <input
                        {...registerForm('numero_empleado')}
                        type="text"
                        className="input-field"
                        placeholder="EMP001"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre *
                        </label>
                        <input
                          {...registerForm('nombre')}
                          type="text"
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apellidos *
                        </label>
                        <input
                          {...registerForm('apellidos')}
                          type="text"
                          className="input-field"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alias/Sobrenombre
                        <span className="text-xs text-gray-500 ml-2">(máximo 15 caracteres)</span>
                      </label>
                      <input
                        {...registerForm('alias')}
                        type="text"
                        className="input-field"
                        placeholder='ej: "Pepe", "El Checo", "Memo"'
                        maxLength={15}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono
                        </label>
                        <input
                          {...registerForm('telefono')}
                          type="tel"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          {...registerForm('email')}
                          type="email"
                          className="input-field"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Nacimiento
                        </label>
                        <input
                          {...registerForm('fecha_nacimiento')}
                          type="date"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Ingreso *
                        </label>
                        <input
                          {...registerForm('fecha_ingreso')}
                          type="date"
                          className="input-field"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Información Laboral */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Información Laboral</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nivel de Experiencia *
                      </label>
                      <select {...registerForm('nivel_experiencia')} className="input-field" required>
                        <option value="junior">Junior</option>
                        <option value="intermedio">Intermedio</option>
                        <option value="senior">Senior</option>
                        <option value="master">Master</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Salario Base
                        </label>
                        <input
                          {...registerForm('salario_base')}
                          type="number"
                          step="0.01"
                          className="input-field"
                          placeholder="15000.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Comisión (%)
                        </label>
                        <input
                          {...registerForm('comision_porcentaje')}
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="input-field"
                          placeholder="5.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horario de Trabajo
                      </label>
                      <input
                        {...registerForm('horario_trabajo')}
                        type="text"
                        className="input-field"
                        placeholder="Lunes a Viernes 8:00 - 17:00"
                      />
                    </div>

                    {viewMode === 'edit' && (
                      <div className="flex items-center">
                        <input
                          {...registerForm('activo')}
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm font-medium text-gray-700">
                          Activo
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Especialidades */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidades
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {especialidadesValue.map((esp, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {esp}
                          <button
                            type="button"
                            onClick={() => removeEspecialidad(index)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {mechanicService.getCommonSpecialties()
                        .filter(esp => !especialidadesValue.includes(esp))
                        .map((esp) => (
                        <button
                          key={esp}
                          type="button"
                          onClick={() => addEspecialidad(esp)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50"
                        >
                          + {esp}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Certificaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificaciones
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {certificacionesValue.map((cert, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                        >
                          {cert}
                          <button
                            type="button"
                            onClick={() => removeCertificacion(index)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {mechanicService.getCommonCertifications()
                        .filter(cert => !certificacionesValue.includes(cert))
                        .map((cert) => (
                        <button
                          key={cert}
                          type="button"
                          onClick={() => addCertificacion(cert)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50"
                        >
                          + {cert}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    {...registerForm('notas')}
                    className="input-field"
                    rows={3}
                    placeholder="Notas adicionales sobre el mecánico..."
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'create' ? 'list' : 'detail')}
                    className="btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Guardando...' : viewMode === 'create' ? 'Crear Mecánico' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      case 'detail':
        return (
          <div className="space-y-6">
            {/* Botón de regreso */}
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              ← Regresar a mecánicos
            </button>

            {/* Detalle del mecánico */}
            <div className="card p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {mechanicService.formatName(selectedMechanic!)}
                  </h2>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    <span className={`px-4 py-2 rounded-lg font-semibold text-sm ${getExperienceBadgeColor(selectedMechanic!.nivel_experiencia)}`}>
                      🏆 {mechanicService.formatExperienceLevel(selectedMechanic!.nivel_experiencia)}
                    </span>
                    
                    <span className={`px-3 py-1 rounded-full text-sm ${selectedMechanic!.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedMechanic!.activo ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </div>
                </div>
                
                {canManageMechanics && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleEditMechanic}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <span>✏️</span>
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDeleteMechanic(selectedMechanic!.mechanic_id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Información Personal */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Información Personal</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Empleado:</span> {selectedMechanic!.numero_empleado}</p>
                    {selectedMechanic!.alias && (
                      <p><span className="font-medium">Alias:</span> <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">"{selectedMechanic!.alias}"</span></p>
                    )}
                    <p><span className="font-medium">Sucursal:</span> {selectedMechanic!.branch_nombre}</p>
                    {selectedMechanic!.telefono && (
                      <p><span className="font-medium">Teléfono:</span> {selectedMechanic!.telefono}</p>
                    )}
                    {selectedMechanic!.email && (
                      <p><span className="font-medium">Email:</span> {selectedMechanic!.email}</p>
                    )}
                    {selectedMechanic!.fecha_nacimiento && (
                      <p><span className="font-medium">Nacimiento:</span> {mechanicService.formatDate(selectedMechanic!.fecha_nacimiento)}</p>
                    )}
                    <p><span className="font-medium">Ingreso:</span> {mechanicService.formatDate(selectedMechanic!.fecha_ingreso)}</p>
                  </div>
                </div>

                {/* Información Laboral */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Información Laboral</h3>
                  <div className="space-y-2 text-sm">
                    {selectedMechanic!.salario_base && (
                      <p><span className="font-medium">Salario:</span> {mechanicService.formatSalary(selectedMechanic!.salario_base)}</p>
                    )}
                    <p><span className="font-medium">Comisión:</span> {selectedMechanic!.comision_porcentaje}%</p>
                    {selectedMechanic!.horario_trabajo && (
                      <p><span className="font-medium">Horario:</span> {selectedMechanic!.horario_trabajo}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Especialidades */}
              {selectedMechanic!.especialidades.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">Especialidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMechanic!.especialidades.map((esp, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {esp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificaciones */}
              {selectedMechanic!.certificaciones.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">Certificaciones</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMechanic!.certificaciones.map((cert, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        🏅 {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              {selectedMechanic!.notas && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Notas</h3>
                  <p className="text-sm text-gray-700">{selectedMechanic!.notas}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* Header con filtros y acciones */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Mecánicos
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="btn-secondary text-sm"
                  >
                    {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                  </button>
                  {canManageMechanics && (
                    <button
                      onClick={handleCreateMechanic}
                      className="btn-primary text-sm flex items-center space-x-2"
                    >
                      <span>➕</span>
                      <span>Nuevo Mecánico</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filtros */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                    <input
                      {...registerFilters('search')}
                      type="text"
                      placeholder="Nombre, apellido o número..."
                      className="input-field text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                    <select {...registerFilters('branch_id')} className="input-field text-sm">
                      <option value="">Todas</option>
                      {branches.map((branch) => (
                        <option key={branch.branch_id} value={branch.branch_id}>
                          {branch.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experiencia</label>
                    <select {...registerFilters('nivel_experiencia')} className="input-field text-sm">
                      <option value="">Todos</option>
                      <option value="junior">Junior</option>
                      <option value="intermedio">Intermedio</option>
                      <option value="senior">Senior</option>
                      <option value="master">Master</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select {...registerFilters('activo')} className="input-field text-sm">
                      <option value="">Todos</option>
                      <option value="true">Activos</option>
                      <option value="false">Inactivos</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 lg:col-span-4">
                    <button
                      onClick={clearFilters}
                      className="btn-secondary text-sm"
                    >
                      Limpiar Filtros
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de mecánicos */}
            {error && (
              <div className="card p-4 bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando mecánicos...</p>
              </div>
            ) : mechanics.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {pagination.total} mecánicos encontrados (página {pagination.page} de {pagination.totalPages})
                </h3>
                
                {/* Grid de mecánicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mechanics.map((mechanic) => (
                    <div
                      key={mechanic.mechanic_id}
                      className="card p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200 cursor-pointer"
                      onClick={() => handleMechanicSelect(mechanic)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {mechanic.nombre} {mechanic.apellidos}
                            </h3>
                            {mechanic.alias && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                "{mechanic.alias}"
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">#{mechanic.numero_empleado}</p>
                          <p className="text-sm text-gray-600">{mechanic.branch_nombre}</p>
                        </div>
                        
                        <span className={`px-2 py-1 rounded-full text-xs ${mechanic.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {mechanic.activo ? '✅' : '❌'}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className={`px-3 py-2 rounded-lg text-sm font-semibold ${getExperienceBadgeColor(mechanic.nivel_experiencia)}`}>
                          🏆 {mechanicService.formatExperienceLevel(mechanic.nivel_experiencia)}
                        </div>
                        
                        {mechanic.especialidades.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {mechanic.especialidades.slice(0, 2).map((esp, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                              >
                                {esp}
                              </span>
                            ))}
                            {mechanic.especialidades.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                +{mechanic.especialidades.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mt-3">
                          <span>📅 {mechanicService.formatDate(mechanic.fecha_ingreso)}</span>
                          {mechanic.telefono && (
                            <span>📱 {mechanic.telefono}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginación */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center space-x-2 mt-6">
                    <button
                      onClick={() => loadMechanics(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Anterior
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => loadMechanics(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-gray-600 mb-4">No hay mecánicos que coincidan con los filtros</p>
                {canManageMechanics && (
                  <button
                    onClick={handleCreateMechanic}
                    className="btn-primary"
                  >
                    Crear Primer Mecánico
                  </button>
                )}
                {Object.values(filters).some(value => value) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 btn-secondary text-sm"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>
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