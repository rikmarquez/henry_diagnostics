const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'henrys_diagnostics', 
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_HOST?.includes('railway') ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

async function checkServicesStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Revisando estructura de tabla services...');
    
    // Verificar qué columnas existen en services
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'services' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Columnas en tabla services:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    // Verificar datos existentes
    const countResult = await client.query('SELECT COUNT(*) as total FROM services');
    console.log(`📈 Total de servicios: ${countResult.rows[0].total}`);
    
    // Si hay servicios, mostrar ejemplo
    if (parseInt(countResult.rows[0].total) > 0) {
      const sampleResult = await client.query('SELECT * FROM services LIMIT 1');
      console.log('📄 Ejemplo de servicio:', sampleResult.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkServicesStructure();