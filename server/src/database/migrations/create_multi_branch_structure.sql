-- Migración Multi-Sucursal para Henry's Diagnostics
-- Fecha: 11 Agosto 2025
-- OBJETIVO: Soportar múltiples talleres/sucursales

-- ============================================================================
-- 1. TABLA DE SUCURSALES
-- ============================================================================
CREATE TABLE branches (
    branch_id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    codigo VARCHAR(10) NOT NULL UNIQUE, -- Código corto para identificación
    direccion TEXT,
    ciudad VARCHAR(100),
    estado VARCHAR(50),
    codigo_postal VARCHAR(5),
    telefono VARCHAR(15),
    email VARCHAR(255),
    gerente_id INTEGER REFERENCES users(user_id),
    horario_apertura TIME DEFAULT '08:00:00',
    horario_cierre TIME DEFAULT '18:00:00',
    dias_laborales VARCHAR(20) DEFAULT 'LUNES-SABADO', -- LUNES-VIERNES, LUNES-SABADO, etc.
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Campos de configuración
    configuracion JSONB, -- Para configuraciones específicas por sucursal
    notas TEXT
);

-- ============================================================================
-- 2. TABLA DE MECÁNICOS (SEPARADA DE USERS)
-- ============================================================================
CREATE TABLE mechanics (
    mechanic_id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL REFERENCES branches(branch_id),
    numero_empleado VARCHAR(20) UNIQUE NOT NULL, -- Número de empleado único
    nombre VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    telefono VARCHAR(15),
    email VARCHAR(255),
    fecha_nacimiento DATE,
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Información laboral
    especialidades TEXT[], -- Array de especialidades
    certificaciones TEXT[], -- Array de certificaciones
    nivel_experiencia VARCHAR(20) CHECK (nivel_experiencia IN ('junior', 'intermedio', 'senior', 'master')),
    salario_base DECIMAL(10,2),
    comision_porcentaje DECIMAL(5,2) DEFAULT 0, -- % de comisión por servicios
    
    -- Estado laboral
    activo BOOLEAN DEFAULT true,
    fecha_baja DATE,
    motivo_baja TEXT,
    
    -- Auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    notas TEXT
);

-- ============================================================================
-- 3. MODIFICAR TABLAS EXISTENTES - AGREGAR BRANCH_ID
-- ============================================================================

-- 3.1 Agregar branch_id a users (empleados administrativos)
ALTER TABLE users ADD COLUMN branch_id INTEGER REFERENCES branches(branch_id);

-- 3.2 Agregar branch_id a customers (para segmentación por sucursal)
ALTER TABLE customers ADD COLUMN branch_id INTEGER REFERENCES branches(branch_id);

-- 3.3 Agregar branch_id a services
ALTER TABLE services ADD COLUMN branch_id INTEGER REFERENCES branches(branch_id);

-- 3.4 Agregar branch_id a opportunities
ALTER TABLE opportunities ADD COLUMN branch_id INTEGER REFERENCES branches(branch_id);

-- ============================================================================
-- 4. MODIFICAR SERVICES - CAMBIAR USUARIO_MECANICO POR MECHANIC_ID
-- ============================================================================

-- Agregar nueva columna mechanic_id
ALTER TABLE services ADD COLUMN mechanic_id INTEGER REFERENCES mechanics(mechanic_id);

-- La columna usuario_mecanico se mantendrá por ahora para compatibilidad
-- En el futuro se puede eliminar cuando todos los servicios usen mechanic_id

-- ============================================================================
-- 5. CREAR SUCURSAL PRINCIPAL (MIGRACIÓN AUTOMÁTICA)
-- ============================================================================

-- Insertar sucursal principal
INSERT INTO branches (
    branch_id, nombre, codigo, direccion, ciudad, 
    estado, telefono, activo
) VALUES (
    1, 'Henry''s Diagnostics - Matriz', 'MATRIZ', 
    'Dirección Principal', 'Ciudad Principal',
    'Estado Principal', '+52XXXXXXXXXX', true
) ON CONFLICT (branch_id) DO NOTHING;

-- Asignar todos los registros existentes a la sucursal principal
UPDATE users SET branch_id = 1 WHERE branch_id IS NULL;
UPDATE customers SET branch_id = 1 WHERE branch_id IS NULL;  
UPDATE services SET branch_id = 1 WHERE branch_id IS NULL;
UPDATE opportunities SET branch_id = 1 WHERE branch_id IS NULL;

-- ============================================================================
-- 6. ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índices para branches
CREATE INDEX idx_branches_activo ON branches(activo);
CREATE INDEX idx_branches_codigo ON branches(codigo);

-- Índices para mechanics
CREATE INDEX idx_mechanics_branch_id ON mechanics(branch_id);
CREATE INDEX idx_mechanics_activo ON mechanics(activo);
CREATE INDEX idx_mechanics_numero_empleado ON mechanics(numero_empleado);
CREATE INDEX idx_mechanics_especialidades ON mechanics USING GIN(especialidades);

-- Índices para las nuevas columnas branch_id
CREATE INDEX idx_users_branch_id ON users(branch_id);
CREATE INDEX idx_customers_branch_id ON customers(branch_id);  
CREATE INDEX idx_services_branch_id ON services(branch_id);
CREATE INDEX idx_opportunities_branch_id ON opportunities(branch_id);
CREATE INDEX idx_services_mechanic_id ON services(mechanic_id);

-- ============================================================================
-- 7. TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- ============================================================================

-- Trigger para branches
CREATE TRIGGER trigger_branches_fecha_actualizacion
    BEFORE UPDATE ON branches
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

-- Trigger para mechanics
CREATE TRIGGER trigger_mechanics_fecha_actualizacion
    BEFORE UPDATE ON mechanics
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

-- ============================================================================
-- 8. COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE branches IS 'Sucursales/talleres de Henry''s Diagnostics';
COMMENT ON COLUMN branches.codigo IS 'Código corto único para identificar la sucursal (ej: MATRIZ, SUC001)';
COMMENT ON COLUMN branches.configuracion IS 'Configuraciones específicas por sucursal en formato JSON';

COMMENT ON TABLE mechanics IS 'Mecánicos empleados, separados de users para mejor gestión';
COMMENT ON COLUMN mechanics.especialidades IS 'Array de especialidades: frenos, motor, transmision, etc.';
COMMENT ON COLUMN mechanics.certificaciones IS 'Array de certificaciones técnicas';
COMMENT ON COLUMN mechanics.comision_porcentaje IS 'Porcentaje de comisión sobre servicios realizados';

COMMENT ON COLUMN users.branch_id IS 'Sucursal donde trabaja el usuario administrativo';
COMMENT ON COLUMN customers.branch_id IS 'Sucursal donde fue registrado el cliente inicialmente';
COMMENT ON COLUMN services.branch_id IS 'Sucursal donde se realizó el servicio';
COMMENT ON COLUMN services.mechanic_id IS 'Mecánico que realizó el servicio (reemplaza usuario_mecanico)';
COMMENT ON COLUMN opportunities.branch_id IS 'Sucursal que maneja la oportunidad';

-- ============================================================================
-- 9. VISTAS PARA CONSULTAS COMUNES
-- ============================================================================

-- Vista de mecánicos con información de sucursal
CREATE VIEW view_mechanics_detail AS
SELECT 
    m.mechanic_id,
    m.numero_empleado,
    m.nombre,
    m.apellidos,
    m.nombre || ' ' || m.apellidos as nombre_completo,
    m.telefono,
    m.especialidades,
    m.nivel_experiencia,
    m.activo,
    b.nombre as sucursal_nombre,
    b.codigo as sucursal_codigo,
    b.ciudad as sucursal_ciudad
FROM mechanics m
LEFT JOIN branches b ON m.branch_id = b.branch_id;

-- Vista de servicios con información completa
CREATE VIEW view_services_detail AS  
SELECT 
    s.service_id,
    s.fecha_servicio,
    s.tipo_servicio,
    s.precio,
    s.estado,
    -- Cliente
    c.nombre as cliente_nombre,
    c.telefono as cliente_telefono,
    -- Vehículo
    v.marca || ' ' || v.modelo || ' ' || v.año as vehiculo_descripcion,
    v.placa_actual,
    -- Mecánico
    COALESCE(
        m.nombre || ' ' || m.apellidos,
        u.nombre
    ) as mecanico_nombre,
    -- Sucursal
    b.nombre as sucursal_nombre,
    b.codigo as sucursal_codigo
FROM services s
LEFT JOIN customers c ON s.customer_id = c.customer_id
LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
LEFT JOIN mechanics m ON s.mechanic_id = m.mechanic_id
LEFT JOIN users u ON s.usuario_mecanico = u.user_id
LEFT JOIN branches b ON s.branch_id = b.branch_id;

COMMENT ON VIEW view_mechanics_detail IS 'Vista completa de mecánicos con información de sucursal';
COMMENT ON VIEW view_services_detail IS 'Vista completa de servicios con toda la información relacionada';