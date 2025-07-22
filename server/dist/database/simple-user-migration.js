"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./connection");
async function runSimpleUserMigration() {
    console.log('🚀 Ejecutando migración simplificada del módulo de usuario...');
    try {
        // Verificar y crear solo lo que falta
        // 1. Verificar si user_activity_log ya existe y tiene las columnas correctas
        const activityTableExists = await (0, connection_1.query)(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'user_activity_log' 
      ORDER BY ordinal_position
    `);
        console.log('Columnas en user_activity_log:', activityTableExists.rows.map(r => r.column_name));
        // 2. Crear índices si no existen
        await (0, connection_1.query)(`
      CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity_log(timestamp);
      CREATE INDEX IF NOT EXISTS idx_user_activity_performed_by ON user_activity_log(performed_by);
    `);
        // 3. Crear o reemplazar funciones
        await (0, connection_1.query)(`
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
    `);
        await (0, connection_1.query)(`
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
    `);
        // 4. Crear vista de gestión de usuarios
        await (0, connection_1.query)(`
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
    `);
        console.log('✅ Migración simplificada del módulo de usuario completada exitosamente');
    }
    catch (error) {
        console.error('❌ Error ejecutando migración simplificada:', error);
        throw error;
    }
}
runSimpleUserMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
//# sourceMappingURL=simple-user-migration.js.map