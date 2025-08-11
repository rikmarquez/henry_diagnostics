const { Pool } = require('pg');

// Conexión directa a Railway
const connectionString = 'postgresql://postgres:uFXiUmoRNqxdKctJesvlRiLiOXuWTQac@shortline.proxy.rlwy.net:52806/railway';

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function applyMultiBranchSafe() {
  const client = await pool.connect();
  
  try {
    console.log('🏢 Iniciando migración Multi-Sucursal (Modo Seguro)...');
    
    await client.query('BEGIN');
    
    // PASO 1: Crear tabla branches
    console.log('📝 Paso 1: Creando tabla branches...');
    try {
      await client.query(`
        CREATE TABLE branches (
          branch_id SERIAL PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL UNIQUE,
          codigo VARCHAR(10) NOT NULL UNIQUE,
          direccion TEXT,
          ciudad VARCHAR(100),
          estado VARCHAR(50),
          codigo_postal VARCHAR(5),
          telefono VARCHAR(15),
          email VARCHAR(255),
          gerente_id INTEGER REFERENCES users(user_id),
          horario_apertura TIME DEFAULT '08:00:00',
          horario_cierre TIME DEFAULT '18:00:00',
          dias_laborales VARCHAR(20) DEFAULT 'LUNES-SABADO',
          activo BOOLEAN DEFAULT true,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          configuracion JSONB,
          notas TEXT
        )
      `);
      console.log('✅ Tabla branches creada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Tabla branches ya existe');
      } else {
        throw error;
      }
    }
    
    // PASO 2: Insertar sucursal principal
    console.log('📝 Paso 2: Insertando sucursal principal...');
    try {
      await client.query(`
        INSERT INTO branches (
          branch_id, nombre, codigo, direccion, ciudad, 
          estado, telefono, activo
        ) VALUES (
          1, 'Henry''s Diagnostics - Matriz', 'MATRIZ', 
          'Dirección Principal', 'Ciudad Principal',
          'Estado Principal', '+52XXXXXXXXXX', true
        ) ON CONFLICT (branch_id) DO NOTHING
      `);
      console.log('✅ Sucursal principal configurada');
    } catch (error) {
      console.log('⚠️  Error en sucursal principal:', error.message);
    }
    
    // PASO 3: Crear tabla mechanics
    console.log('📝 Paso 3: Creando tabla mechanics...');
    try {
      await client.query(`
        CREATE TABLE mechanics (
          mechanic_id SERIAL PRIMARY KEY,
          branch_id INTEGER NOT NULL REFERENCES branches(branch_id),
          numero_empleado VARCHAR(20) UNIQUE NOT NULL,
          nombre VARCHAR(255) NOT NULL,
          apellidos VARCHAR(255) NOT NULL,
          telefono VARCHAR(15),
          email VARCHAR(255),
          fecha_nacimiento DATE,
          fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
          especialidades TEXT[],
          certificaciones TEXT[],
          nivel_experiencia VARCHAR(20) CHECK (nivel_experiencia IN ('junior', 'intermedio', 'senior', 'master')),
          salario_base DECIMAL(10,2),
          comision_porcentaje DECIMAL(5,2) DEFAULT 0,
          activo BOOLEAN DEFAULT true,
          fecha_baja DATE,
          motivo_baja TEXT,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          notas TEXT
        )
      `);
      console.log('✅ Tabla mechanics creada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Tabla mechanics ya existe');
      } else {
        throw error;
      }
    }
    
    // PASO 4: Agregar columnas branch_id a tablas existentes
    const tablesToModify = ['users', 'customers', 'services', 'opportunities'];
    
    for (const tableName of tablesToModify) {
      console.log(`📝 Paso 4.${tablesToModify.indexOf(tableName) + 1}: Agregando branch_id a ${tableName}...`);
      try {
        await client.query(`ALTER TABLE ${tableName} ADD COLUMN branch_id INTEGER REFERENCES branches(branch_id)`);
        console.log(`✅ Columna branch_id agregada a ${tableName}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Columna branch_id ya existe en ${tableName}`);
        } else {
          throw error;
        }
      }
    }
    
    // PASO 5: Agregar columna mechanic_id a services
    console.log('📝 Paso 5: Agregando mechanic_id a services...');
    try {
      await client.query('ALTER TABLE services ADD COLUMN mechanic_id INTEGER REFERENCES mechanics(mechanic_id)');
      console.log('✅ Columna mechanic_id agregada a services');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Columna mechanic_id ya existe en services');
      } else {
        throw error;
      }
    }
    
    // PASO 6: Asignar todos los registros existentes a la sucursal principal
    console.log('📝 Paso 6: Asignando registros existentes a sucursal principal...');
    
    for (const tableName of tablesToModify) {
      try {
        const result = await client.query(`UPDATE ${tableName} SET branch_id = 1 WHERE branch_id IS NULL`);
        console.log(`✅ ${result.rowCount} registros actualizados en ${tableName}`);
      } catch (error) {
        console.log(`⚠️  Error actualizando ${tableName}:`, error.message);
      }
    }
    
    // PASO 7: Crear índices principales
    console.log('📝 Paso 7: Creando índices...');
    const indices = [
      'CREATE INDEX IF NOT EXISTS idx_branches_activo ON branches(activo)',
      'CREATE INDEX IF NOT EXISTS idx_branches_codigo ON branches(codigo)',
      'CREATE INDEX IF NOT EXISTS idx_mechanics_branch_id ON mechanics(branch_id)',
      'CREATE INDEX IF NOT EXISTS idx_mechanics_activo ON mechanics(activo)',
      'CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id)',
      'CREATE INDEX IF NOT EXISTS idx_customers_branch_id ON customers(branch_id)',
      'CREATE INDEX IF NOT EXISTS idx_services_branch_id ON services(branch_id)',
      'CREATE INDEX IF NOT EXISTS idx_services_mechanic_id ON services(mechanic_id)',
      'CREATE INDEX IF NOT EXISTS idx_opportunities_branch_id ON opportunities(branch_id)'
    ];
    
    for (const index of indices) {
      try {
        await client.query(index);
        console.log(`✅ Índice creado: ${index.split(' ')[5]}`);
      } catch (error) {
        console.log(`⚠️  Índice ya existe o error: ${error.message.substring(0, 50)}`);
      }
    }
    
    // PASO 8: Crear triggers
    console.log('📝 Paso 8: Creando triggers...');
    try {
      await client.query(`
        CREATE TRIGGER trigger_branches_fecha_actualizacion
        BEFORE UPDATE ON branches
        FOR EACH ROW
        EXECUTE FUNCTION update_fecha_actualizacion()
      `);
      console.log('✅ Trigger branches creado');
    } catch (error) {
      console.log('⚠️  Trigger branches ya existe o error:', error.message);
    }
    
    try {
      await client.query(`
        CREATE TRIGGER trigger_mechanics_fecha_actualizacion
        BEFORE UPDATE ON mechanics  
        FOR EACH ROW
        EXECUTE FUNCTION update_fecha_actualizacion()
      `);
      console.log('✅ Trigger mechanics creado');
    } catch (error) {
      console.log('⚠️  Trigger mechanics ya existe o error:', error.message);
    }
    
    await client.query('COMMIT');
    
    // Verificación final
    console.log('\n🔍 Verificación final...');
    
    // Verificar tablas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('branches', 'mechanics')
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas multi-sucursal:');
    tables.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Verificar sucursal principal
    const mainBranch = await client.query('SELECT * FROM branches WHERE branch_id = 1');
    if (mainBranch.rows.length > 0) {
      console.log('🏢 Sucursal principal:');
      console.log(`  ✓ ${mainBranch.rows[0].nombre} (${mainBranch.rows[0].codigo})`);
    }
    
    // Contar registros asignados a sucursal principal
    for (const tableName of tablesToModify) {
      const count = await client.query(`SELECT COUNT(*) as total FROM ${tableName} WHERE branch_id = 1`);
      console.log(`📊 ${tableName}: ${count.rows[0].total} registros en sucursal principal`);
    }
    
    console.log('\n🎉 Migración Multi-Sucursal completada exitosamente');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMultiBranchSafe()
  .then(() => {
    console.log('✅ Migración Multi-Sucursal completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
  });