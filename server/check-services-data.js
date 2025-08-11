const { Pool } = require('pg');

// Conexión directa a Railway
const connectionString = 'postgresql://postgres:uFXiUmoRNqxdKctJesvlRiLiOXuWTQac@shortline.proxy.rlwy.net:52806/railway';

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function checkServicesData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando datos en tabla services...');
    
    // Contar servicios totales
    const totalResult = await client.query('SELECT COUNT(*) as total FROM services');
    console.log(`📊 Total de servicios: ${totalResult.rows[0].total}`);
    
    if (parseInt(totalResult.rows[0].total) > 0) {
      // Mostrar los servicios más recientes
      const recentServices = await client.query(`
        SELECT 
          s.service_id,
          s.fecha_servicio,
          s.tipo_servicio,
          s.descripcion,
          s.precio,
          s.estado,
          s.fecha_creacion,
          c.nombre as cliente_nombre,
          v.marca || ' ' || v.modelo || ' ' || v.año as vehiculo,
          v.placa_actual
        FROM services s
        LEFT JOIN customers c ON s.customer_id = c.customer_id
        LEFT JOIN vehicles v ON s.vehicle_id = v.vehicle_id
        ORDER BY s.fecha_creacion DESC
        LIMIT 10
      `);
      
      console.log('\n📋 Servicios recientes:');
      recentServices.rows.forEach((service, index) => {
        console.log(`\n${index + 1}. Servicio ID: ${service.service_id}`);
        console.log(`   Cliente: ${service.cliente_nombre}`);
        console.log(`   Vehículo: ${service.vehiculo} - ${service.placa_actual}`);
        console.log(`   Servicio: ${service.tipo_servicio}`);
        console.log(`   Descripción: ${service.descripcion}`);
        console.log(`   Precio: $${service.precio}`);
        console.log(`   Estado: ${service.estado}`);
        console.log(`   Fecha: ${service.fecha_servicio}`);
        console.log(`   Creado: ${service.fecha_creacion}`);
      });
      
      // Servicios del mes actual
      const thisMonth = await client.query(`
        SELECT COUNT(*) as count
        FROM services 
        WHERE EXTRACT(YEAR FROM fecha_servicio) = EXTRACT(YEAR FROM CURRENT_DATE)
          AND EXTRACT(MONTH FROM fecha_servicio) = EXTRACT(MONTH FROM CURRENT_DATE)
      `);
      console.log(`\n📅 Servicios este mes: ${thisMonth.rows[0].count}`);
      
      // Servicios por estado
      const byStatus = await client.query(`
        SELECT estado, COUNT(*) as count
        FROM services 
        GROUP BY estado
        ORDER BY count DESC
      `);
      console.log('\n📊 Servicios por estado:');
      byStatus.rows.forEach(row => {
        console.log(`   ${row.estado}: ${row.count}`);
      });
      
    } else {
      console.log('📝 No hay servicios registrados en la base de datos');
      
      // Verificar si hay clientes y vehículos
      const customersCount = await client.query('SELECT COUNT(*) as total FROM customers');
      const vehiclesCount = await client.query('SELECT COUNT(*) as total FROM vehicles');
      
      console.log(`👥 Clientes: ${customersCount.rows[0].total}`);
      console.log(`🚗 Vehículos: ${vehiclesCount.rows[0].total}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkServicesData();