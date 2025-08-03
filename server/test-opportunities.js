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

async function testOpportunities() {
  try {
    console.log('🧪 Probando consultas de oportunidades...\n');
    
    const client = await pool.connect();
    
    // 1. Contar oportunidades básico
    console.log('1️⃣ Conteo básico de oportunidades:');
    const basicCount = await client.query('SELECT COUNT(*) as count FROM opportunities');
    console.log('   Total oportunidades:', basicCount.rows[0].count);
    
    // 2. Ver estructura de oportunidades
    console.log('\n2️⃣ Primeras oportunidades (sin JOINs):');
    const basicOpportunities = await client.query(`
      SELECT opportunity_id, vin, customer_id, titulo, estado, prioridad, fecha_creacion
      FROM opportunities 
      ORDER BY opportunity_id 
      LIMIT 3
    `);
    basicOpportunities.rows.forEach(opp => {
      console.log(`   - [${opp.opportunity_id}] ${opp.titulo} | Estado: ${opp.estado} | Prioridad: ${opp.prioridad}`);
    });
    
    // 3. Probar la consulta compleja que falla
    console.log('\n3️⃣ Probando consulta compleja con JOINs:');
    try {
      const complexQuery = `
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
        ORDER BY 
          CASE o.prioridad 
            WHEN 'alta' THEN 1 
            WHEN 'media' THEN 2 
            WHEN 'baja' THEN 3 
          END,
          o.fecha_contacto_sugerida ASC,
          o.fecha_creacion DESC
        LIMIT 50 OFFSET 0
      `;
      
      const complexResult = await client.query(complexQuery);
      console.log('   ✅ Consulta compleja exitosa');
      console.log('   📊 Resultados:', complexResult.rows.length);
      
      if (complexResult.rows.length > 0) {
        console.log('   📋 Primera oportunidad completa:');
        const first = complexResult.rows[0];
        console.log('     -', first.titulo);
        console.log('     - Cliente:', first.customer_nombre);
        console.log('     - Vehículo:', `${first.vehicle_marca} ${first.vehicle_modelo} ${first.vehicle_año}`);
        console.log('     - Usuario creador:', first.usuario_creador_nombre);
        console.log('     - Usuario asignado:', first.usuario_asignado_nombre);
      }
      
    } catch (error) {
      console.log('   ❌ Error en consulta compleja:');
      console.log('     ', error.message);
      console.log('     Código:', error.code);
      console.log('     Detalle:', error.detail);
    }
    
    // 4. Verificar tablas relacionadas
    console.log('\n4️⃣ Verificando integridad de relaciones:');
    
    // Verificar si hay oportunidades con customer_id que no existe en customers
    const orphanCustomers = await client.query(`
      SELECT o.opportunity_id, o.customer_id 
      FROM opportunities o 
      LEFT JOIN customers c ON o.customer_id = c.customer_id 
      WHERE c.customer_id IS NULL
    `);
    console.log('   Oportunidades con clientes inexistentes:', orphanCustomers.rows.length);
    
    // Verificar si hay oportunidades con vin que no existe en vehicles
    const orphanVehicles = await client.query(`
      SELECT o.opportunity_id, o.vin 
      FROM opportunities o 
      LEFT JOIN vehicles v ON o.vin = v.vin 
      WHERE v.vin IS NULL
    `);
    console.log('   Oportunidades con vehículos inexistentes:', orphanVehicles.rows.length);
    
    // Verificar si hay oportunidades con usuario_creador que no existe
    const orphanCreators = await client.query(`
      SELECT o.opportunity_id, o.usuario_creador 
      FROM opportunities o 
      LEFT JOIN users u ON o.usuario_creador = u.user_id 
      WHERE o.usuario_creador IS NOT NULL AND u.user_id IS NULL
    `);
    console.log('   Oportunidades con usuarios creadores inexistentes:', orphanCreators.rows.length);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    await pool.end();
  }
}

testOpportunities();