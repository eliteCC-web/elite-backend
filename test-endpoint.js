require('dotenv').config();
const axios = require('axios');

async function testEndpoint() {
  try {
    console.log('🧪 Testing schedule endpoint directly...');
    
    // Configuración
    const baseURL = process.env.API_URL || 'http://localhost:3001';
    const token = process.env.ADMIN_TOKEN;
    
    if (!token) {
      console.log('⚠️  No ADMIN_TOKEN provided. Please set it in your .env file');
      return;
    }

    console.log(`🔗 Using API URL: ${baseURL}`);
    console.log(`🔑 Using admin token: ${token.substring(0, 20)}...`);

    // 1. Probar endpoint de colaboradores
    console.log('\n📋 Step 1: Testing /api/schedule/colaboradores...');
    try {
      const colaboradoresResponse = await axios.get(`${baseURL}/api/schedule/colaboradores`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Colaboradores endpoint works!');
      console.log(`📊 Found ${colaboradoresResponse.data.length} colaboradores`);

      if (colaboradoresResponse.data.length > 0) {
        const testUser = colaboradoresResponse.data[0];
        console.log(`👤 Test user: ${testUser.firstName} ${testUser.lastName} (ID: ${testUser.id})`);

        // 2. Probar endpoint de crear schedule
        console.log('\n📋 Step 2: Testing /api/schedule...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split('T')[0];

        const scheduleData = {
          userId: testUser.id,
          date: dateString,
          startTime: '09:00',
          endTime: '17:00',
          shiftType: 'FULL_DAY',
          position: 'COLABORADOR'
        };

        console.log(`📅 Creating schedule for ${testUser.firstName} ${testUser.lastName}`);
        console.log(`📅 Date: ${dateString}`);
        console.log(`📅 Data:`, scheduleData);

        const scheduleResponse = await axios.post(`${baseURL}/api/schedule`, scheduleData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Schedule endpoint works!');
        console.log(`📊 Created schedule ID: ${scheduleResponse.data.id}`);
        console.log(`👤 User: ${scheduleResponse.data.user?.firstName} ${scheduleResponse.data.user?.lastName}`);
        console.log(`📧 Email: ${scheduleResponse.data.user?.email}`);

        console.log('\n📊 Next steps:');
        console.log('1. Check backend logs for notification details');
        console.log('2. Check if email was sent to:', scheduleResponse.data.user?.email);

      } else {
        console.log('❌ No colaboradores found');
      }

    } catch (error) {
      console.log('❌ Error testing endpoints');
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }

  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
  }
}

testEndpoint(); 