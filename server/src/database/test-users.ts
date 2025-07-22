import { query } from './connection';

async function testUserStats() {
  try {
    console.log('🔍 Probando consulta de estadísticas de usuarios...');
    
    // Primero verificar qué columnas existen en la tabla users
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    const columns = await query(columnsQuery);
    console.log('📋 Columnas en tabla users:', columns.rows);
    
    // Probar consulta básica de conteo
    const basicCount = await query('SELECT COUNT(*) as total FROM users');
    console.log('📊 Total usuarios:', basicCount.rows[0]);
    
    // Probar la consulta de estadísticas completa
    const statsQuery = `
      SELECT 
        COUNT(*) as total_usuarios,
        COUNT(*) FILTER (WHERE activo = true) as usuarios_activos,
        COUNT(*) FILTER (WHERE activo = false) as usuarios_inactivos,
        COUNT(*) FILTER (WHERE rol = 'administrador') as administradores,
        COUNT(*) FILTER (WHERE rol = 'mecanico') as mecanicos,
        COUNT(*) FILTER (WHERE rol = 'seguimiento') as seguimiento,
        COUNT(*) FILTER (WHERE password_temporal = true) as passwords_temporales,
        COUNT(*) FILTER (WHERE ultimo_acceso > CURRENT_DATE - INTERVAL '30 days') as activos_mes
      FROM users
    `;

    const result = await query(statsQuery);
    console.log('📈 Estadísticas:', result.rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testUserStats();