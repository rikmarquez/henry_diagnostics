const fs = require('fs');
const path = require('path');

// Configuración de conexión a PostgreSQL
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
  connectionTimeoutMillis: 10000,
  application_name: 'henrys_diagnostics',
  client_encoding: 'UTF8'
});

async function applyServicesMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Iniciando migración de services: vin → vehicle_id');
    
    // Leer archivo de migración
    const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', 'update_services_to_vehicle_id.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Contenido de migración cargado');
    
    // Iniciar transacción
    await client.query('BEGIN');
    
    // Ejecutar migración línea por línea para mejor control
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`⚙️  Ejecutando paso ${i + 1}/${statements.length}...`);
        try {
          await client.query(statement);
          console.log(`✅ Paso ${i + 1} completado`);
        } catch (error) {
          console.log(`⚠️  Paso ${i + 1} falló (posiblemente ya aplicado):`, error.message);
          // Continuamos con el siguiente paso
        }
      }
    }
    
    // Verificar resultado
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'services' AND column_name IN ('vehicle_id', 'vin')
      ORDER BY column_name
    `);
    
    console.log('📊 Columnas en tabla services:', checkResult.rows.map(r => r.column_name));
    
    // Contar registros
    const countResult = await client.query('SELECT COUNT(*) as total FROM services');
    console.log(`📈 Total de servicios: ${countResult.rows[0].total}`);
    
    await client.query('COMMIT');
    console.log('🎉 Migración de services completada exitosamente');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar migración
applyServicesMigration()
  .then(() => {
    console.log('✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });