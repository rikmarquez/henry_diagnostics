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

async function fixServicesMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Iniciando migración de services: vin → vehicle_id');
    
    await client.query('BEGIN');
    
    // PASO 1: Agregar columna vehicle_id
    console.log('📝 Paso 1: Agregando columna vehicle_id...');
    try {
      await client.query('ALTER TABLE services ADD COLUMN vehicle_id INTEGER');
      console.log('✅ Columna vehicle_id agregada');
    } catch (error) {
      console.log('⚠️  Columna vehicle_id ya existe:', error.message);
    }
    
    // PASO 2: Como no hay datos en services (total: 0), podemos hacer los cambios directos
    console.log('📝 Paso 2: Configurando vehicle_id como NOT NULL...');
    await client.query('ALTER TABLE services ALTER COLUMN vehicle_id SET NOT NULL');
    console.log('✅ vehicle_id configurado como NOT NULL');
    
    // PASO 3: Agregar foreign key constraint
    console.log('📝 Paso 3: Agregando foreign key constraint...');
    try {
      await client.query(`
        ALTER TABLE services 
        ADD CONSTRAINT fk_services_vehicle_id 
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
      `);
      console.log('✅ Foreign key constraint agregado');
    } catch (error) {
      console.log('⚠️  Foreign key ya existe:', error.message);
    }
    
    // PASO 4: Eliminar columna vin
    console.log('📝 Paso 4: Eliminando columna vin...');
    try {
      await client.query('ALTER TABLE services DROP COLUMN vin');
      console.log('✅ Columna vin eliminada');
    } catch (error) {
      console.log('⚠️  Columna vin ya eliminada:', error.message);
    }
    
    // PASO 5: Crear índice
    console.log('📝 Paso 5: Creando índice...');
    try {
      await client.query('CREATE INDEX idx_services_vehicle_id ON services(vehicle_id)');
      console.log('✅ Índice creado');
    } catch (error) {
      console.log('⚠️  Índice ya existe:', error.message);
    }
    
    await client.query('COMMIT');
    
    // Verificar resultado final
    console.log('🔍 Verificando estructura final...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'services' AND column_name IN ('vehicle_id', 'vin')
      ORDER BY column_name
    `);
    
    console.log('📊 Columnas relevantes en services:');
    columnsResult.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    console.log('🎉 Migración completada exitosamente');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixServicesMigration()
  .then(() => {
    console.log('✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
  });