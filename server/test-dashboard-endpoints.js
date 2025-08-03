const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST?.includes('railway') ? { rejectUnauthorized: false } : false,
  client_encoding: 'UTF8',
});

async function testDashboardEndpoints() {
  try {
    console.log('🧪 Probando exactamente los endpoints que usa el Dashboard...\n');
    
    const client = await pool.connect();
    
    // 1. Probar /vehicles/count (función getVehiclesCount)
    console.log('1️⃣ Testing vehicles/count:');
    try {
      const vehiclesCountResult = await client.query('SELECT COUNT(*) as count FROM vehicles WHERE activo = true');
      const vehicleCount = parseInt(vehiclesCountResult.rows[0].count);
      console.log('   ✅ vehicleService.getCount() ->', { count: vehicleCount });
    } catch (error) {
      console.log('   ❌ vehicleService.getCount() ->', error.message);
    }
    
    // 2. Probar /opportunities/reminders/today (función getRemindersToday)
    console.log('\n2️⃣ Testing opportunities/reminders/today:');
    try {
      const remindersResult = await client.query(`
        SELECT opportunity_id, titulo, fecha_contacto_sugerida 
        FROM opportunities 
        WHERE DATE(fecha_contacto_sugerida) = CURRENT_DATE
      `);
      console.log('   ✅ opportunityService.getRemindersToday() ->', { reminders: remindersResult.rows, count: remindersResult.rows.length });
    } catch (error) {
      console.log('   ❌ opportunityService.getRemindersToday() ->', error.message);
    }
    
    // 3. Probar /opportunities/search?estado=pendiente (función getPending)
    console.log('\n3️⃣ Testing opportunities/search?estado=pendiente:');
    try {
      const pendingResult = await client.query(`
        SELECT 
          o.*,
          c.nombre as customer_nombre,
          c.telefono as customer_telefono,
          c.whatsapp as customer_whatsapp,
          v.marca as vehicle_marca,
          v.modelo as vehicle_modelo,
          v."año" as vehicle_año,
          v.placa_actual as vehicle_placa,
          u_creador.nombre as usuario_creador_nombre,
          u_asignado.nombre as usuario_asignado_nombre
        FROM opportunities o
        LEFT JOIN customers c ON o.customer_id = c.customer_id
        LEFT JOIN vehicles v ON o.vin = v.vin
        LEFT JOIN users u_creador ON o.usuario_creador = u_creador.user_id
        LEFT JOIN users u_asignado ON o.usuario_asignado = u_asignado.user_id
        WHERE o.estado = 'pendiente'
        ORDER BY 
          CASE o.prioridad 
            WHEN 'alta' THEN 1 
            WHEN 'media' THEN 2 
            WHEN 'baja' THEN 3 
          END,
          o.fecha_contacto_sugerida ASC,
          o.fecha_creacion DESC
        LIMIT 50 OFFSET 0
      `);
      console.log('   ✅ opportunityService.getPending() ->', { opportunities: pendingResult.rows, count: pendingResult.rows.length });
    } catch (error) {
      console.log('   ❌ opportunityService.getPending() ->', error.message);
    }
    
    // 4. Simulación completa del dashboard
    console.log('\n📊 SIMULACIÓN COMPLETA DEL DASHBOARD:');
    console.log('================================');
    
    // Obtener datos igual que el dashboard
    const [remindersResult, opportunitiesResult, vehiclesCountResult] = await Promise.all([
      client.query(`
        SELECT opportunity_id, titulo, fecha_contacto_sugerida 
        FROM opportunities 
        WHERE DATE(fecha_contacto_sugerida) = CURRENT_DATE
      `),
      client.query(`
        SELECT 
          o.*,
          c.nombre as customer_nombre,
          v.marca as vehicle_marca,
          v.modelo as vehicle_modelo
        FROM opportunities o
        LEFT JOIN customers c ON o.customer_id = c.customer_id
        LEFT JOIN vehicles v ON o.vin = v.vin
        WHERE o.estado = 'pendiente'
        LIMIT 50
      `),
      client.query('SELECT COUNT(*) as count FROM vehicles WHERE activo = true')
    ]);
    
    const stats = {
      vehiclesCount: parseInt(vehiclesCountResult.rows[0].count) || 0,
      opportunitiesPending: opportunitiesResult.rows?.length || 0,
      remindersToday: remindersResult.rows?.length || 0,
      servicesThisMonth: 0, // TODO: implement when services are tracked
    };
    
    console.log('📈 Stats que debería mostrar el Dashboard:');
    console.log('   🚗 Vehículos Registrados:', stats.vehiclesCount);
    console.log('   💼 Oportunidades Pendientes:', stats.opportunitiesPending);  
    console.log('   ⏰ Recordatorios Hoy:', stats.remindersToday);
    console.log('   ✅ Servicios del Mes:', stats.servicesThisMonth);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    await pool.end();
  }
}

testDashboardEndpoints();