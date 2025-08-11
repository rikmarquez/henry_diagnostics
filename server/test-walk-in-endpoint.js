const axios = require('axios');

// URL correcta del backend en Railway
const BASE_URL = 'https://henrydiagnostics-production.up.railway.app';

async function testWalkInEndpoint() {
  try {
    console.log('🧪 Probando endpoint POST /api/reception/walk-in...');
    
    // Datos de prueba para cliente nuevo
    const testData = {
      accion: 'servicio_inmediato',
      cliente_nuevo: {
        nombre: 'Cliente Test',
        telefono: '+525512345678',
        whatsapp: '+525512345678',
        email: 'test@example.com',
        direccion: 'Dirección de prueba'
      },
      vehiculo_nuevo: {
        marca: 'Toyota',
        modelo: 'Corolla',
        año: 2020,
        placa_actual: 'ABC123',
        color: 'Blanco',
        kilometraje_actual: 50000
      },
      servicio_inmediato: {
        tipo_servicio: 'Cambio de aceite',
        descripcion: 'Cambio de aceite y filtro',
        precio_estimado: 500
      }
    };
    
    console.log('📤 Enviando datos:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/reception/walk-in`, testData, {
      headers: {
        'Content-Type': 'application/json',
        // Normalmente necesitarías un token de autenticación aquí
        // 'Authorization': 'Bearer YOUR_TOKEN'
      },
      timeout: 10000
    });
    
    console.log('✅ Respuesta exitosa:', response.status);
    console.log('📋 Datos de respuesta:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Error HTTP:', error.response.status);
      console.error('📋 Detalle del error:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('🔐 Error de autenticación (esperado si no hay token)');
      } else if (error.response.status === 500) {
        console.log('💥 Error 500 - El problema persiste');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 No se puede conectar al servidor');
    } else {
      console.error('❌ Error inesperado:', error.message);
    }
  }
}

testWalkInEndpoint();