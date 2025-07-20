-- Migration: User Management Enhancement
-- This script adds fields and tables needed for user management functionality

-- Add fields to users table for management
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS password_temp BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fecha_password_temp TIMESTAMP;

-- Create user activity log table
CREATE TABLE IF NOT EXISTS user_activity_log (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    performed_by INTEGER REFERENCES users(user_id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_activity_performed_by ON user_activity_log(performed_by);

-- Create view for user management with additional stats
CREATE OR REPLACE VIEW user_management_view AS
SELECT 
    u.user_id,
    u.email,
    u.nombre,
    u.rol,
    u.telefono,
    u.activo,
    u.fecha_creacion,
    u.fecha_actualizacion,
    u.ultimo_login,
    u.password_temp,
    u.fecha_password_temp,
    COALESCE(s.servicios_asignados, 0) as servicios_asignados,
    COALESCE(o.oportunidades_asignadas, 0) as oportunidades_asignadas,
    COALESCE(a.ultima_actividad, u.fecha_actualizacion) as ultima_actividad
FROM users u
LEFT JOIN (
    SELECT usuario_mecanico, COUNT(*) as servicios_asignados
    FROM services 
    WHERE usuario_mecanico IS NOT NULL
    GROUP BY usuario_mecanico
) s ON u.user_id = s.usuario_mecanico
LEFT JOIN (
    SELECT usuario_asignado, COUNT(*) as oportunidades_asignadas
    FROM opportunities 
    WHERE usuario_asignado IS NOT NULL
    GROUP BY usuario_asignado
) o ON u.user_id = o.usuario_asignado
LEFT JOIN (
    SELECT user_id, MAX(timestamp) as ultima_actividad
    FROM user_activity_log
    GROUP BY user_id
) a ON u.user_id = a.user_id;

-- Function to log user activities
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id INTEGER,
    p_action VARCHAR(100),
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_performed_by INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO user_activity_log (
        user_id, action, details, ip_address, user_agent, performed_by
    ) VALUES (
        p_user_id, p_action, p_details, p_ip_address, p_user_agent, p_performed_by
    );
END;
$$ LANGUAGE plpgsql;

-- Function to generate temporary password
CREATE OR REPLACE FUNCTION generate_temp_password() RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE user_activity_log IS 'Log de actividades de usuarios para auditoría';
COMMENT ON VIEW user_management_view IS 'Vista para gestión de usuarios con estadísticas agregadas';
COMMENT ON FUNCTION log_user_activity IS 'Función para registrar actividades de usuarios';
COMMENT ON FUNCTION generate_temp_password IS 'Función para generar contraseñas temporales';