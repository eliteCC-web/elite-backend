require('dotenv').config();
const axios = require('axios');

async function testBackendConnection() {
  try {
    console.log('🧪 Testing backend connection...');
    
    // Configuración
    const baseURL = process.env.API_URL || 'http://localhost:3001';
    
    console.log(`🔗 Using API URL: ${baseURL}`);

    // 1. Probar endpoint básico
    console.log('\n📋 Step 1: Testing basic endpoint...');
    try {
      const healthResponse = await axios.get(`${baseURL}/api`);
      console.log('✅ Basic endpoint works!');
      console.log('📊 Response:', healthResponse.data);
    } catch (error) {
      console.log('❌ Basic endpoint failed');
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }

    // 2. Probar endpoint de colaboradores sin token
    console.log('\n📋 Step 2: Testing colaboradores without token...');
    try {
      const colaboradoresResponse = await axios.get(`${baseURL}/api/schedule/colaboradores`);
      console.log('❌ This should fail (no token)');
    } catch (error) {
      console.log('✅ Correctly failed without token');
      console.log('Error status:', error.response?.status);
      console.log('Error message:', error.response?.data?.message);
    }

    // 3. Probar con token
    const token = process.env.ADMIN_TOKEN;
    if (token) {
      console.log('\n📋 Step 3: Testing colaboradores with token...');
      try {
        const colaboradoresResponse = await axios.get(`${baseURL}/api/schedule/colaboradores`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Colaboradores endpoint works with token!');
        console.log(`📊 Found ${colaboradoresResponse.data.length} colaboradores`);
      } catch (error) {
        console.log('❌ Colaboradores endpoint failed with token');
        console.log('Error:', error.message);
        if (error.response) {
          console.log('Response status:', error.response.status);
          console.log('Response data:', error.response.data);
        }
      }
    } else {
      console.log('\n⚠️  No ADMIN_TOKEN provided, skipping token test');
    }

    console.log('\n📊 Summary:');
    console.log('1. Check if you see the global logs in backend');
    console.log('2. Check if the endpoints are responding');
    console.log('3. Check if the token is valid');

  } catch (error) {
    console.error('❌ Error testing backend connection:', error.message);
  }
}

testBackendConnection(); 