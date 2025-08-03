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

async function fixColumnNames() {
  try {
    console.log('🔧 Corrigiendo nombres de columnas con encoding...\n');
    
    const client = await pool.connect();
    
    // Primero verificar que la columna existe con el nombre corrupto
    const columnsResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'vehicles'
      AND column_name LIKE '%??%'
    `);
    
    console.log('🔍 Columnas con problemas de encoding encontradas:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}`);
    });
    
    if (columnsResult.rows.length === 0) {
      console.log('  ✅ No se encontraron columnas con problemas de encoding');
      client.release();
      return;
    }
    
    // Renombrar la columna
    console.log('\n🔧 Renombrando columna "a??o" a "año"...');
    
    try {
      await client.query('ALTER TABLE vehicles RENAME COLUMN "a??o" TO "año"');
      console.log('✅ Columna renombrada exitosamente');
      
      // Verificar el cambio
      const verifyResult = await client.query(`
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vehicles'
        AND column_name IN ('año', 'a??o')
      `);
      
      console.log('\n📋 Verificación del cambio:');
      verifyResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}`);
      });
      
      // Probar una consulta
      console.log('\n🧪 Probando consulta con la nueva columna:');
      const testResult = await client.query('SELECT vin, marca, modelo, "año" FROM vehicles LIMIT 3');
      testResult.rows.forEach(vehicle => {
        console.log(`  - ${vehicle.marca} ${vehicle.modelo} ${vehicle.año} (${vehicle.vin})`);
      });
      
    } catch (error) {
      console.error('❌ Error renombrando columna:', error.message);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    await pool.end();
  }
}

fixColumnNames();