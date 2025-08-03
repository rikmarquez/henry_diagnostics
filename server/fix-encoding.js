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

// Mapeo de correcciones comunes para nombres mexicanos
const CORRECTIONS = {
  // Pérez
  'P??rez': 'Pérez',
  'P�rez': 'Pérez',
  // García  
  'Garc??a': 'García',
  'Garc�a': 'García',
  // María
  'Mar??a': 'María',
  'Mar�a': 'María',
  // González
  'Gonz??lez': 'González',
  'Gonz�lez': 'González',
  // López
  'L??pez': 'López',
  'L�pez': 'López',
  // Rodríguez
  'Rodr??guez': 'Rodríguez',
  'Rodr�guez': 'Rodríguez',
  // Méndez
  'M??ndez': 'Méndez',
  'M�ndez': 'Méndez',
  // Martínez
  'Mart??nez': 'Martínez',
  'Mart�nez': 'Martínez',
  // Hernández
  'Hern??ndez': 'Hernández',
  'Hern�ndez': 'Hernández',
  // Ramírez
  'Ram??rez': 'Ramírez',
  'Ram�rez': 'Ramírez',
  // Sánchez
  'S??nchez': 'Sánchez',
  'S�nchez': 'Sánchez',
  // José
  'Jos??': 'José',
  'Jos�': 'José',
  // Ángel
  '??ngel': 'Ángel',
  '�ngel': 'Ángel',
  // Jesús
  'Jes??s': 'Jesús',
  'Jes�s': 'Jesús',
  // Andrés
  'Andr??s': 'Andrés',
  'Andr�s': 'Andrés',
  // Víctor
  'V??ctor': 'Víctor',
  'V�ctor': 'Víctor',
  // Mónica
  'M??nica': 'Mónica',
  'M�nica': 'Mónica',
  // Sofía
  'Sof??a': 'Sofía',
  'Sof�a': 'Sofía',
  // Adrián
  'Adri??n': 'Adrián',
  'Adri�n': 'Adrián',
  // Común para múltiples acentos
  '??': 'á',
  '??': 'é', 
  '??': 'í',
  '??': 'ó',
  '??': 'ú',
  '??': 'ñ',
  '??': 'Á',
  '??': 'É',
  '??': 'Í', 
  '??': 'Ó',
  '??': 'Ú',
  '??': 'Ñ'
};

async function fixCustomerNames() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Iniciando corrección de nombres con acentos...\n');
    
    // Obtener todos los clientes con problemas de encoding
    const customersResult = await client.query(`
      SELECT customer_id, nombre, telefono 
      FROM customers 
      WHERE nombre LIKE '%??%' OR nombre LIKE '%�%'
      ORDER BY customer_id
    `);
    
    console.log(`📋 Encontrados ${customersResult.rows.length} clientes con problemas de encoding:\n`);
    
    let correctedCount = 0;
    
    for (const customer of customersResult.rows) {
      let originalName = customer.nombre;
      let correctedName = originalName;
      
      // Aplicar todas las correcciones
      for (const [wrong, correct] of Object.entries(CORRECTIONS)) {
        // Escapar caracteres especiales de regex
        const escapedWrong = wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        correctedName = correctedName.replace(new RegExp(escapedWrong, 'g'), correct);
      }
      
      // Si el nombre cambió, actualizarlo
      if (correctedName !== originalName) {
        await client.query(
          'UPDATE customers SET nombre = $1 WHERE customer_id = $2',
          [correctedName, customer.customer_id]
        );
        
        console.log(`✅ [ID: ${customer.customer_id}] "${originalName}" → "${correctedName}"`);
        correctedCount++;
      } else {
        console.log(`⚠️  [ID: ${customer.customer_id}] "${originalName}" - No se pudo corregir automáticamente`);
      }
    }
    
    console.log(`\n🎉 Corrección completada: ${correctedCount} nombres actualizados`);
    
    // Mostrar algunos ejemplos después de la corrección
    console.log('\n📋 Verificando correcciones...');
    const verifyResult = await client.query(`
      SELECT customer_id, nombre, telefono 
      FROM customers 
      ORDER BY customer_id 
      LIMIT 5
    `);
    
    console.log('\nPrimeros 5 clientes después de la corrección:');
    verifyResult.rows.forEach((customer, index) => {
      console.log(`${index + 1}. [ID: ${customer.customer_id}] ${customer.nombre} - ${customer.telefono}`);
    });
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixCustomerNames();