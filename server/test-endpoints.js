const axios = require('axios');

// URL base del servidor
const BASE_URL = 'http://localhost:3001/api';

async function testEndpoints() {
  console.log('🧪 Probando endpoints del dashboard...\n');
  
  try {
    // 1. Probar conteo de vehículos
    console.log('1️⃣ Probando /vehicles/count');
    const vehiclesResponse = await axios.get(`${BASE_URL}/vehicles/count`);
    console.log('   Respuesta:', vehiclesResponse.data);
    
    // 2. Probar recordatorios del día
    console.log('\n2️⃣ Probando /opportunities/reminders/today');
    const remindersResponse = await axios.get(`${BASE_URL}/opportunities/reminders/today`);
    console.log('   Respuesta:', remindersResponse.data);
    
    // 3. Probar oportunidades pendientes
    console.log('\n3️⃣ Probando /opportunities/search?estado=pendiente');
    const pendingResponse = await axios.get(`${BASE_URL}/opportunities/search`, {
      params: { estado: 'pendiente', limit: 50 }
    });
    console.log('   Respuesta:', pendingResponse.data);
    
    // 4. Probar búsqueda de clientes (para ver caracteres)
    console.log('\n4️⃣ Probando /customers/search');
    const customersResponse = await axios.get(`${BASE_URL}/customers/search`, {
      params: { limit: 10 }
    });
    console.log('   Clientes encontrados:', customersResponse.data.customers?.length || 0);
    if (customersResponse.data.customers?.length > 0) {
      console.log('   Primeros 3 clientes:');
      customersResponse.data.customers.slice(0, 3).forEach((customer, index) => {
        console.log(`     ${index + 1}. ${customer.nombre} - ${customer.telefono}`);
      });
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Error HTTP:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('❌ Error de red: No se pudo conectar al servidor');
      console.error('   ¿Está el servidor corriendo en http://localhost:3001?');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testEndpoints();