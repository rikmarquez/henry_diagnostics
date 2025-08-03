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

async function testDatabase() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    
    // Probar conexión
    const client = await pool.connect();
    console.log('✅ Conexión exitosa');
    
    // Verificar encoding
    const encodingResult = await client.query('SHOW client_encoding');
    console.log('🔤 Client encoding:', encodingResult.rows[0].client_encoding);
    
    // Contar vehículos
    const vehiclesCount = await client.query('SELECT COUNT(*) as count FROM vehicles WHERE activo = true');
    console.log('🚗 Vehículos activos:', vehiclesCount.rows[0].count);
    
    // Contar clientes
    const customersCount = await client.query('SELECT COUNT(*) as count FROM customers');
    console.log('👥 Clientes:', customersCount.rows[0].count);
    
    // Contar oportunidades
    const opportunitiesCount = await client.query('SELECT COUNT(*) as count FROM opportunities');
    console.log('💼 Oportunidades:', opportunitiesCount.rows[0].count);
    
    // Verificar algunos nombres con acentos
    const customersWithAccents = await client.query(`
      SELECT nombre, telefono 
      FROM customers 
      WHERE nombre LIKE '%á%' OR nombre LIKE '%é%' OR nombre LIKE '%í%' OR nombre LIKE '%ó%' OR nombre LIKE '%ú%'
      LIMIT 5
    `);
    console.log('👤 Clientes con acentos:');
    customersWithAccents.rows.forEach(customer => {
      console.log(`  - ${customer.nombre} (${customer.telefono})`);
    });
    
    // Verificar tablas existentes
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('📋 Tablas en la base de datos:');
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabase();