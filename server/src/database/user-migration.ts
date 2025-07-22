import { query } from './connection';
import fs from 'fs';
import path from 'path';

async function runUserMigration() {
  console.log('🚀 Ejecutando migración del módulo de usuario...');
  
  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'user-management-migration.sql'),
      'utf8'
    );

    await query(migrationSQL);
    console.log('✅ Migración del módulo de usuario completada exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando migración de usuario:', error);
    throw error;
  }
}

runUserMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));