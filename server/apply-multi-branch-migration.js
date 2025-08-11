const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Conexión directa a Railway
const connectionString = 'postgresql://postgres:uFXiUmoRNqxdKctJesvlRiLiOXuWTQac@shortline.proxy.rlwy.net:52806/railway';

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function applyMultiBranchMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🏢 Iniciando migración Multi-Sucursal...');
    
    // Leer archivo de migración
    const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', 'create_multi_branch_structure.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Archivo de migración cargado');
    
    // Verificar si ya existe la tabla branches
    const checkBranches = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'branches'
      );
    `);
    
    if (checkBranches.rows[0].exists) {
      console.log('⚠️  Tabla branches ya existe. Verificando estructura...');
      
      // Mostrar estructura actual
      const branchesColumns = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'branches' 
        ORDER BY ordinal_position
      `);
      
      console.log('📊 Columnas en tabla branches:');
      branchesColumns.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
      });
      
      // Contar registros
      const branchCount = await client.query('SELECT COUNT(*) as total FROM branches');
      console.log(`📈 Total de sucursales: ${branchCount.rows[0].total}`);
      
      console.log('✅ Migración multi-sucursal ya aplicada anteriormente');
      return;
    }
    
    await client.query('BEGIN');
    
    console.log('🔧 Aplicando migración completa...');
    
    // Dividir SQL en statements individuales para mejor control de errores
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\s*$/))
      .map(s => s.replace(/\n\s*\n/g, '\n').trim());
    
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement && !statement.match(/^\s*COMMENT/)) {
        try {
          console.log(`⚙️  Ejecutando statement ${i + 1}/${statements.length}...`);
          
          // Log del statement para debugging (solo las primeras palabras)
          const preview = statement.substring(0, 60).replace(/\s+/g, ' ') + '...';
          console.log(`   ${preview}`);
          
          await client.query(statement);
          successCount++;
          console.log(`   ✅ Completado`);
          
        } catch (error) {
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.code === '42P07' || // relation already exists
              error.code === '42701') { // column already exists
            console.log(`   ⚠️  Ya existe (saltando):`, error.message.substring(0, 100));
            skipCount++;
          } else {
            console.error(`   ❌ Error en statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`\n📊 Resumen de migración:`);
    console.log(`   ✅ Statements exitosos: ${successCount}`);
    console.log(`   ⚠️  Statements saltados: ${skipCount}`);
    console.log(`   📝 Total procesados: ${statements.length}`);
    
    // Verificar resultado final
    console.log('\n🔍 Verificando estructura final...');
    
    // Verificar tablas creadas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('branches', 'mechanics')
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas multi-sucursal creadas:');
    tables.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Verificar sucursal principal
    const mainBranch = await client.query('SELECT * FROM branches WHERE branch_id = 1');
    if (mainBranch.rows.length > 0) {
      console.log('🏢 Sucursal principal configurada:');
      console.log(`  ✓ ${mainBranch.rows[0].nombre} (${mainBranch.rows[0].codigo})`);
    }
    
    // Verificar columnas branch_id agregadas
    const branchIdColumns = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE column_name = 'branch_id' 
      AND table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('🔗 Columnas branch_id agregadas:');
    branchIdColumns.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}.branch_id`);
    });
    
    console.log('\n🎉 Migración Multi-Sucursal completada exitosamente');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migración:', error);
    console.error('📋 Detalle:', {
      message: error.message,
      code: error.code
    });
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMultiBranchMigration()
  .then(() => {
    console.log('✅ Proceso Multi-Sucursal completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal en migración Multi-Sucursal:', error.message);
    process.exit(1);
  });