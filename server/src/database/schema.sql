-- Henry Diagnostics - Database Schema
-- Esquema centrado en vehículos con VIN como identificador único permanente

-- Tabla de usuarios del sistema
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('administrador', 'mecanico', 'seguimiento')),
    telefono VARCHAR(15),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes/propietarios
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(15) NOT NULL, -- +52 format
    whatsapp VARCHAR(15), -- +52 format 
    email VARCHAR(255),
    direccion TEXT,
    codigo_postal VARCHAR(5), -- Mexican postal codes
    rfc VARCHAR(13), -- Mexican RFC for business customers
    notas TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla principal de vehículos (centrada en VIN)
CREATE TABLE vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    vin VARCHAR(17) UNIQUE NOT NULL, -- VIN único permanente (17 caracteres)
    marca VARCHAR(100) NOT NULL, -- Nissan, Volkswagen, Chevrolet, etc.
    modelo VARCHAR(100) NOT NULL, -- Tsuru, Jetta, Aveo, etc.
    año INTEGER NOT NULL CHECK (año >= 1900 AND año <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    placa_actual VARCHAR(10), -- Placas mexicanas actuales (ABC-123-D)
    customer_id INTEGER REFERENCES customers(customer_id), -- Propietario actual
    kilometraje_actual INTEGER DEFAULT 0,
    color VARCHAR(50),
    numero_motor VARCHAR(50),
    tipo_combustible VARCHAR(20) DEFAULT 'gasolina' CHECK (tipo_combustible IN ('gasolina', 'diesel', 'hibrido', 'electrico')),
    transmision VARCHAR(20) DEFAULT 'manual' CHECK (transmision IN ('manual', 'automatica')),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notas TEXT,
    activo BOOLEAN DEFAULT true
);

-- Historial de placas por vehículo (para rastrear cambios de propietario/placas)
CREATE TABLE vehicle_plate_history (
    history_id SERIAL PRIMARY KEY,
    vin VARCHAR(17) NOT NULL REFERENCES vehicles(vin),
    placa_anterior VARCHAR(10) NOT NULL,
    fecha_cambio TIMESTAMP NOT NULL,
    motivo_cambio VARCHAR(50) NOT NULL CHECK (motivo_cambio IN ('cambio_propietario', 'perdida', 'robo', 'renovacion', 'otro')),
    customer_anterior INTEGER REFERENCES customers(customer_id),
    notas TEXT,
    creado_por INTEGER REFERENCES users(user_id)
);

-- Catálogo de servicios predefinidos
CREATE TABLE service_catalog (
    service_id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2),
    duracion_estimada INTEGER, -- minutos
    categoria VARCHAR(100), -- 'mantenimiento', 'reparacion', 'diagnostico'
    kilometraje_sugerido INTEGER, -- cada cuántos km se recomienda
    meses_sugeridos INTEGER, -- cada cuántos meses se recomienda
    activo BOOLEAN DEFAULT true
);

-- Servicios realizados (vinculados a VIN)
CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    vin VARCHAR(17) NOT NULL REFERENCES vehicles(vin),
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id), -- Cliente al momento del servicio
    usuario_mecanico INTEGER REFERENCES users(user_id),
    fecha_servicio DATE NOT NULL,
    tipo_servicio VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    kilometraje_servicio INTEGER,
    precio DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'completado' CHECK (estado IN ('cotizado', 'autorizado', 'en_proceso', 'completado', 'cancelado')),
    notas TEXT,
    proximo_servicio_km INTEGER, -- Sugerencia para próximo servicio
    proximo_servicio_fecha DATE, -- Sugerencia para próximo servicio
    garantia_meses INTEGER DEFAULT 3,
    refacciones_usadas TEXT, -- JSON o texto con refacciones
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Oportunidades de venta por vehículo
CREATE TABLE opportunities (
    opportunity_id SERIAL PRIMARY KEY,
    vin VARCHAR(17) NOT NULL REFERENCES vehicles(vin),
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id), -- Propietario actual
    usuario_creador INTEGER REFERENCES users(user_id),
    usuario_asignado INTEGER REFERENCES users(user_id), -- Personal de seguimiento
    tipo_oportunidad VARCHAR(100) NOT NULL, -- 'mantenimiento_programado', 'reparacion_diferida', 'servicio_estacional'
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    servicio_sugerido VARCHAR(255),
    precio_estimado DECIMAL(10,2),
    fecha_sugerida DATE, -- Cuándo se debería realizar el servicio
    fecha_contacto_sugerida DATE, -- Cuándo contactar al cliente (calculada automáticamente)
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'contactado', 'agendado', 'en_proceso', 'completado', 'perdido')),
    prioridad VARCHAR(20) DEFAULT 'media' CHECK (prioridad IN ('alta', 'media', 'baja')),
    origen VARCHAR(50) DEFAULT 'manual' CHECK (origen IN ('manual', 'automatico', 'historial', 'kilometraje')),
    kilometraje_referencia INTEGER, -- Kilometraje cuando se creó la oportunidad
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notas de seguimiento de oportunidades
CREATE TABLE opportunity_notes (
    note_id SERIAL PRIMARY KEY,
    opportunity_id INTEGER NOT NULL REFERENCES opportunities(opportunity_id),
    usuario_id INTEGER NOT NULL REFERENCES users(user_id),
    tipo_contacto VARCHAR(50) CHECK (tipo_contacto IN ('llamada', 'whatsapp', 'visita', 'email', 'nota_interna')),
    resultado VARCHAR(50) CHECK (resultado IN ('contactado', 'no_contesta', 'ocupado', 'interesado', 'no_interesado', 'agendado')),
    notas TEXT NOT NULL,
    fecha_contacto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    seguimiento_requerido BOOLEAN DEFAULT false,
    fecha_seguimiento DATE
);

-- Recordatorios programados automáticos
CREATE TABLE scheduled_reminders (
    reminder_id SERIAL PRIMARY KEY,
    vin VARCHAR(17) NOT NULL REFERENCES vehicles(vin),
    opportunity_id INTEGER REFERENCES opportunities(opportunity_id),
    tipo_recordatorio VARCHAR(50) NOT NULL CHECK (tipo_recordatorio IN ('7_dias_antes', '3_dias_antes', '1_dia_antes', 'vencido')),
    fecha_servicio_programada DATE NOT NULL,
    fecha_contacto_sugerida DATE NOT NULL, -- Calculada automáticamente
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'contactado', 'confirmado', 'cancelado')),
    usuario_asignado INTEGER REFERENCES users(user_id), -- Personal de seguimiento
    notas_contacto TEXT,
    fecha_contacto_realizado TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Log de mensajes de WhatsApp enviados
CREATE TABLE whatsapp_logs (
    log_id SERIAL PRIMARY KEY,
    vin VARCHAR(17) NOT NULL REFERENCES vehicles(vin),
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
    opportunity_id INTEGER REFERENCES opportunities(opportunity_id),
    usuario_id INTEGER NOT NULL REFERENCES users(user_id),
    numero_telefono VARCHAR(15) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo_mensaje VARCHAR(50) CHECK (tipo_mensaje IN ('recordatorio', 'cotizacion', 'confirmacion', 'seguimiento', 'personalizado')),
    estado VARCHAR(50) DEFAULT 'enviado' CHECK (estado IN ('enviado', 'entregado', 'leido', 'error')),
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Programación de mantenimiento por marca/modelo
CREATE TABLE maintenance_schedules (
    schedule_id SERIAL PRIMARY KEY,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100),
    año_inicio INTEGER,
    año_fin INTEGER,
    servicio VARCHAR(255) NOT NULL,
    kilometraje_intervalo INTEGER, -- Cada cuántos km
    meses_intervalo INTEGER, -- Cada cuántos meses
    descripcion TEXT,
    activo BOOLEAN DEFAULT true
);

-- Índices para optimizar búsquedas principales
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_placa_actual ON vehicles(placa_actual);
CREATE INDEX idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX idx_vehicle_plate_history_vin ON vehicle_plate_history(vin);
CREATE INDEX idx_vehicle_plate_history_placa ON vehicle_plate_history(placa_anterior);
CREATE INDEX idx_customers_nombre ON customers(nombre);
CREATE INDEX idx_customers_telefono ON customers(telefono);
CREATE INDEX idx_services_vin ON services(vin);
CREATE INDEX idx_services_fecha ON services(fecha_servicio);
CREATE INDEX idx_opportunities_vin ON opportunities(vin);
CREATE INDEX idx_opportunities_estado ON opportunities(estado);
CREATE INDEX idx_opportunities_fecha_sugerida ON opportunities(fecha_sugerida);
CREATE INDEX idx_scheduled_reminders_fecha_contacto ON scheduled_reminders(fecha_contacto_sugerida);
CREATE INDEX idx_scheduled_reminders_estado ON scheduled_reminders(estado);

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar fecha_actualizacion
CREATE TRIGGER trigger_users_fecha_actualizacion
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

CREATE TRIGGER trigger_customers_fecha_actualizacion
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

CREATE TRIGGER trigger_vehicles_fecha_actualizacion
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

CREATE TRIGGER trigger_opportunities_fecha_actualizacion
    BEFORE UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

-- Función para calcular fecha de contacto sugerida
CREATE OR REPLACE FUNCTION calcular_fecha_contacto(fecha_servicio DATE, dias_antes INTEGER)
RETURNS DATE AS $$
BEGIN
    RETURN fecha_servicio - INTERVAL '%s days' % dias_antes;
END;
$$ LANGUAGE plpgsql;