// Importar el controlador directamente para probar
const { query } = require('./dist/database/connection');

async function testAPIFunctions() {
  console.log('🧪 Probando funciones del API directamente...\n');
  
  try {
    // 1. Probar conteo de vehículos (misma query que en getVehiclesCount)
    console.log('1️⃣ Probando conteo de vehículos');
    const vehiclesResult = await query('SELECT COUNT(*) as count FROM vehicles WHERE activo = true');
    console.log('   Resultado:', { count: parseInt(vehiclesResult.rows[0].count) });
    
    // 2. Probar búsqueda de oportunidades pendientes
    console.log('\n2️⃣ Probando oportunidades pendientes');
    const opportunitiesResult = await query(`
      SELECT opportunity_id, titulo, estado, prioridad 
      FROM opportunities 
      WHERE estado = 'pendiente' 
      LIMIT 50
    `);
    console.log('   Oportunidades pendientes:', opportunitiesResult.rows.length);
    console.log('   Primeras oportunidades:', opportunitiesResult.rows.slice(0, 3));
    
    // 3. Probar recordatorios del día
    console.log('\n3️⃣ Probando recordatorios del día');
    const remindersResult = await query(`
      SELECT opportunity_id, titulo, fecha_contacto_sugerida 
      FROM opportunities 
      WHERE DATE(fecha_contacto_sugerida) = CURRENT_DATE
    `);
    console.log('   Recordatorios hoy:', remindersResult.rows.length);
    console.log('   Recordatorios:', remindersResult.rows);
    
    // 4. Probar clientes con encoding
    console.log('\n4️⃣ Probando clientes (verificar encoding)');
    const customersResult = await query('SELECT customer_id, nombre, telefono FROM customers LIMIT 5');
    console.log('   Clientes encontrados:', customersResult.rows.length);
    customersResult.rows.forEach((customer, index) => {
      console.log(`   ${index + 1}. [ID: ${customer.customer_id}] ${customer.nombre} - ${customer.telefono}`);
      // Mostrar bytes del nombre para debug
      console.log(`      Bytes del nombre: ${Buffer.from(customer.nombre).toString('hex')}`);
    });
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error('   Stack:', error.stack);
  }
  
  process.exit(0);
}

testAPIFunctions();