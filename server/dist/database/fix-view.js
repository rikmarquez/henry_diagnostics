"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./connection");
async function recreateView() {
    try {
        console.log('Eliminando vista existente...');
        await (0, connection_1.query)('DROP VIEW IF EXISTS user_management_view');
        console.log('Creando nueva vista...');
        await (0, connection_1.query)(`
      CREATE VIEW user_management_view AS
      SELECT 
          u.user_id,
          u.email,
          u.nombre,
          u.rol,
          u.telefono,
          u.activo,
          u.fecha_creacion,
          u.fecha_actualizacion,
          u.ultimo_acceso as ultimo_login,
          u.password_temporal as password_temp,
          u.cambiar_password_proximo_login as fecha_password_temp,
          0 as servicios_asignados,
          0 as oportunidades_asignadas,
          COALESCE(a.ultima_actividad, u.fecha_actualizacion) as ultima_actividad
      FROM users u
      LEFT JOIN (
          SELECT user_id, MAX(fecha) as ultima_actividad
          FROM user_activity_log
          GROUP BY user_id
      ) a ON u.user_id = a.user_id;
    `);
        console.log('✅ Vista recreada exitosamente');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
recreateView();
//# sourceMappingURL=fix-view.js.map