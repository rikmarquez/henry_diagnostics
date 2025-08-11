const { Pool } = require('pg');

// Conexión directa a Railway
const connectionString = 'postgresql://postgres:uFXiUmoRNqxdKctJesvlRiLiOXuWTQac@shortline.proxy.rlwy.net:52806/railway';

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false } // Railway requiere SSL
});

async function migrateServicesOnRailway() {
  const client = await pool.connect();
  
  try {
    console.log('🚂 Conectando a Railway PostgreSQL...');
    
    // Verificar estructura actual primero
    console.log('🔍 Verificando estructura actual de services...');
    const currentColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'services' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Columnas actuales en services:');
    currentColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    // Contar registros
    const countResult = await client.query('SELECT COUNT(*) as total FROM services');
    console.log(`📈 Total de servicios existentes: ${countResult.rows[0].total}`);
    
    await client.query('BEGIN');
    
    // Solo proceder si la tabla aún tiene 'vin' y no 'vehicle_id'
    const hasVin = currentColumns.rows.some(row => row.column_name === 'vin');
    const hasVehicleId = currentColumns.rows.some(row => row.column_name === 'vehicle_id');
    
    if (!hasVin && hasVehicleId) {
      console.log('✅ Migración ya aplicada. La tabla services ya tiene vehicle_id y no vin.');
      await client.query('ROLLBACK');
      return;
    }
    
    if (!hasVin) {
      console.log('⚠️  Tabla services no tiene columna vin. Estructura inesperada.');
      await client.query('ROLLBACK');
      return;
    }
    
    console.log('🔧 Aplicando migración services: vin → vehicle_id...');
    
    // PASO 1: Agregar columna vehicle_id
    console.log('📝 Paso 1: Agregando columna vehicle_id...');
    try {
      await client.query('ALTER TABLE services ADD COLUMN vehicle_id INTEGER');
      console.log('✅ Columna vehicle_id agregada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Columna vehicle_id ya existe');
      } else {
        throw error;
      }
    }
    
    // PASO 2: Migrar datos existentes (si hay registros)
    if (parseInt(countResult.rows[0].total) > 0) {
      console.log('📝 Paso 2: Migrando datos existentes...');
      const migratedCount = await client.query(`
        UPDATE services 
        SET vehicle_id = v.vehicle_id 
        FROM vehicles v 
        WHERE services.vin = v.vin 
        AND services.vin IS NOT NULL
        AND services.vehicle_id IS NULL
      `);
      console.log(`✅ ${migratedCount.rowCount} servicios migrados con VIN válido`);
      
      // Intentar migrar servicios sin VIN válido usando customer_id
      const migratedByCustomer = await client.query(`
        UPDATE services 
        SET vehicle_id = (
          SELECT v.vehicle_id 
          FROM vehicles v 
          WHERE v.customer_id = services.customer_id 
          AND v.activo = true 
          ORDER BY v.fecha_actualizacion DESC 
          LIMIT 1
        )
        WHERE services.vehicle_id IS NULL 
        AND services.customer_id IS NOT NULL
      `);
      console.log(`✅ ${migratedByCustomer.rowCount} servicios adicionales migrados por customer_id`);
    }
    
    // PASO 3: Verificar que todos los registros tengan vehicle_id
    const nullVehicleIds = await client.query('SELECT COUNT(*) as count FROM services WHERE vehicle_id IS NULL');
    if (parseInt(nullVehicleIds.rows[0].count) > 0) {
      console.log(`⚠️  ${nullVehicleIds.rows[0].count} servicios no tienen vehicle_id válido. No se puede continuar.`);
      await client.query('ROLLBACK');
      return;
    }
    
    // PASO 4: Hacer vehicle_id NOT NULL
    console.log('📝 Paso 4: Configurando vehicle_id como NOT NULL...');
    await client.query('ALTER TABLE services ALTER COLUMN vehicle_id SET NOT NULL');
    console.log('✅ vehicle_id configurado como NOT NULL');
    
    // PASO 5: Agregar foreign key constraint  
    console.log('📝 Paso 5: Agregando foreign key constraint...');
    try {
      await client.query(`
        ALTER TABLE services 
        ADD CONSTRAINT fk_services_vehicle_id 
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
      `);
      console.log('✅ Foreign key constraint agregado');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Foreign key constraint ya existe');
      } else {
        throw error;
      }
    }
    
    // PASO 6: Eliminar columna vin
    console.log('📝 Paso 6: Eliminando columna vin...');
    try {
      await client.query('ALTER TABLE services DROP COLUMN vin');
      console.log('✅ Columna vin eliminada');
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('⚠️  Columna vin ya eliminada');
      } else {
        throw error;
      }
    }
    
    // PASO 7: Crear índice
    console.log('📝 Paso 7: Creando índice...');
    try {
      await client.query('CREATE INDEX idx_services_vehicle_id ON services(vehicle_id)');
      console.log('✅ Índice creado');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Índice ya existe');
      } else {
        throw error;
      }
    }
    
    await client.query('COMMIT');
    
    // Verificación final
    console.log('🔍 Verificando estructura final...');
    const finalColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'services' AND column_name IN ('vehicle_id', 'vin')
      ORDER BY column_name
    `);
    
    console.log('📊 Estructura final de services:');
    finalColumns.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    console.log('🎉 Migración de services completada exitosamente en Railway');
    
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

migrateServicesOnRailway()
  .then(() => {
    console.log('✅ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
  });