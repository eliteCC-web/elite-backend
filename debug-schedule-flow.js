require('dotenv').config();
const axios = require('axios');

async function debugScheduleFlow() {
  try {
    console.log('🔍 Debugging schedule assignment flow...');
    
    // Configuración
    const baseURL = process.env.API_URL || 'http://localhost:3001';
    const token = process.env.ADMIN_TOKEN;
    
    if (!token) {
      console.log('⚠️  No ADMIN_TOKEN provided. Please set it in your .env file');
      console.log('   You can get a token by logging in as admin in the frontend');
      return;
    }

    console.log(`🔗 Using API URL: ${baseURL}`);
    console.log(`🔑 Using admin token: ${token.substring(0, 20)}...`);

    // 1. Verificar que el backend está funcionando
    console.log('\n📋 Step 1: Checking backend health...');
    try {
      const healthResponse = await axios.get(`${baseURL}/health`);
      console.log('✅ Backend is running');
    } catch (error) {
      console.log('❌ Backend is not running or not accessible');
      console.log('Error:', error.message);
      return;
    }

    // 2. Obtener colaboradores
    console.log('\n📋 Step 2: Getting colaboradores...');
    try {
      const colaboradoresResponse = await axios.get(`${baseURL}/schedule/colaboradores`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const colaboradores = colaboradoresResponse.data;
      console.log(`✅ Found ${colaboradores.length} colaboradores`);

      if (colaboradores.length === 0) {
        console.log('❌ No colaboradores found');
        return;
      }

      // Mostrar colaboradores
      colaboradores.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} - Email: ${user.email} - Phone: ${user.phone || 'No phone'}`);
      });

    } catch (error) {
      console.log('❌ Error getting colaboradores');
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
      return;
    }

    // 3. Crear un turno de prueba
    console.log('\n📋 Step 3: Creating test schedule...');
    const testUser = colaboradoresResponse.data[0];
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
    console.log(`📅 Time: ${scheduleData.startTime} - ${scheduleData.endTime}`);

    try {
      const scheduleResponse = await axios.post(`${baseURL}/schedule`, scheduleData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const createdSchedule = scheduleResponse.data;
      console.log(`✅ Schedule created successfully!`);
      console.log(`📋 Schedule ID: ${createdSchedule.id}`);
      console.log(`📋 User: ${createdSchedule.user?.firstName} ${createdSchedule.user?.lastName}`);
      console.log(`📋 Email: ${createdSchedule.user?.email}`);

      console.log('\n📊 Next steps:');
      console.log('1. Check the backend logs for notification details');
      console.log('2. Check if email was sent to:', createdSchedule.user?.email);
      console.log('3. Check Brevo dashboard for email delivery status');

    } catch (error) {
      console.log('❌ Error creating schedule');
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }

  } catch (error) {
    console.error('❌ Error debugging schedule flow:', error.message);
  }
}

debugScheduleFlow(); 