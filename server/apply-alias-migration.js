const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Configuración de la base de datos
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:uFXiUmoRNqxdKctJesvlRiLiOXuWTQac@shortline.proxy.rlwy.net:52806/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function applyAliasMigration() {
  console.log('🚀 Iniciando migración de campo alias para mecánicos...');

  try {
    // Verificar si el campo ya existe
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'mechanics' 
      AND column_name = 'alias'
    `);

    if (checkResult.rows.length > 0) {
      console.log('⚠️ El campo alias ya existe en la tabla mechanics');
      return;
    }

    console.log('📋 Aplicando migración...');

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', 'add_alias_to_mechanics.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    // Ejecutar la migración
    await pool.query(migrationSQL);

    console.log('✅ Migración aplicada exitosamente');
    console.log('📊 Campo alias agregado a la tabla mechanics');
    console.log('🔍 Índice creado para búsquedas por alias');

    // Verificar que se aplicó correctamente
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'mechanics' 
      AND column_name = 'alias'
    `);

    if (verifyResult.rows.length > 0) {
      const column = verifyResult.rows[0];
      console.log('🎯 Verificación exitosa:');
      console.log(`   - Campo: ${column.column_name}`);
      console.log(`   - Tipo: ${column.data_type}`);
      console.log(`   - Longitud máxima: ${column.character_maximum_length}`);
      console.log(`   - Permite NULL: ${column.is_nullable}`);
    }

    console.log('\n🎉 Migración completada exitosamente');
    console.log('💡 Ahora puedes agregar alias/sobrenombres a los mecánicos');
    console.log('🔍 Las búsquedas incluyen el campo alias automáticamente');

  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  applyAliasMigration()
    .then(() => {
      console.log('\n✅ Proceso completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = { applyAliasMigration };