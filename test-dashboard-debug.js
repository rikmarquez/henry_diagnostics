const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

// Token de prueba - reemplaza con un token válido
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluaXN0cmFkb3IiLCJpYXQiOjE3MjI3NDI5MDEsImV4cCI6MTcyMjc0NjUwMX0.example'; // Token de ejemplo

async function testEndpoint(endpoint, name) {
  try {
    console.log(`\n🔍 Testing ${name}: ${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(data, null, 2));
    
    return { success: true, data, status: response.status };
  } catch (error) {
    console.log(`❌ Error in ${name}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function testDashboardEndpoints() {
  console.log('🚀 Testing Dashboard Endpoints');
  console.log('================================');
  
  // Test individual endpoints
  await testEndpoint('/api/vehicles/count', 'Vehicles Count');
  await testEndpoint('/api/opportunities/search?estado=pendiente&limit=50', 'Pending Opportunities');
  await testEndpoint('/api/opportunities/reminders/today', 'Reminders Today');
  
  // Test appointments today
  const today = new Date().toISOString().split('T')[0];
  await testEndpoint(`/api/opportunities/search?tiene_cita=true&fecha_desde=${today}&fecha_hasta=${today}&limit=50`, 'Appointments Today');
  
  // Test general opportunities search
  await testEndpoint('/api/opportunities/search?limit=10', 'General Opportunities Search');
  
  console.log('\n🏁 Test completed');
}

testDashboardEndpoints().catch(console.error);