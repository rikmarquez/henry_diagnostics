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

async function checkSchema() {
  try {
    console.log('🔍 Verificando schema de la tabla vehicles...\n');
    
    const client = await pool.connect();
    
    // Obtener información de las columnas de vehicles
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'vehicles'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Columnas de la tabla vehicles:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Probar diferentes formas de acceder a la columna año
    console.log('\n🧪 Probando diferentes formas de acceder a la columna año:');
    
    // 1. Sin comillas
    try {
      await client.query('SELECT año FROM vehicles LIMIT 1');
      console.log('  ✅ año (sin comillas) - funciona');
    } catch (error) {
      console.log('  ❌ año (sin comillas) - Error:', error.message);
    }
    
    // 2. Con comillas dobles
    try {
      await client.query('SELECT "año" FROM vehicles LIMIT 1');
      console.log('  ✅ "año" (con comillas dobles) - funciona');
    } catch (error) {
      console.log('  ❌ "año" (con comillas dobles) - Error:', error.message);
    }
    
    // 3. Con alias de tabla
    try {
      await client.query('SELECT v.año FROM vehicles v LIMIT 1');
      console.log('  ✅ v.año (con alias sin comillas) - funciona');
    } catch (error) {
      console.log('  ❌ v.año (con alias sin comillas) - Error:', error.message);
    }
    
    // 4. Con alias y comillas
    try {
      await client.query('SELECT v."año" FROM vehicles v LIMIT 1');
      console.log('  ✅ v."año" (con alias y comillas) - funciona');
    } catch (error) {
      console.log('  ❌ v."año" (con alias y comillas) - Error:', error.message);
    }
    
    // Obtener algunos datos de muestra
    console.log('\n📊 Datos de muestra:');
    const sampleResult = await client.query('SELECT vin, marca, modelo FROM vehicles LIMIT 3');
    sampleResult.rows.forEach(vehicle => {
      console.log(`  - ${vehicle.vin} | ${vehicle.marca} ${vehicle.modelo}`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();