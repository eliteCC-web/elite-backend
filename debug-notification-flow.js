require('dotenv').config();
const axios = require('axios');

async function debugNotificationFlow() {
  try {
    console.log('🔍 Debugging notification flow...');
    
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

    // 1. Obtener colaboradores
    console.log('\n📋 Step 1: Getting colaboradores...');
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

      // Mostrar colaboradores con emails
      colaboradores.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} - Email: ${user.email}`);
      });

    } catch (error) {
      console.log('❌ Error getting colaboradores');
      console.log('Error:', error.message);
      return;
    }

    // 2. Crear un turno de prueba
    console.log('\n📋 Step 2: Creating test schedule...');
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
    console.log(`📧 User email: ${testUser.email}`);
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
      console.log('2. Look for these log messages:');
      console.log('   - "Starting to send notification for schedule ID: X"');
      console.log('   - "Starting email notification for schedule ID: X"');
      console.log('   - "Schedule notification email sent successfully"');
      console.log('3. Check if email was sent to:', createdSchedule.user?.email);
      console.log('4. Check Brevo dashboard for email delivery status');

      console.log('\n🔍 To check backend logs, run:');
      console.log('   tail -f logs/app.log  # or wherever your logs are');

    } catch (error) {
      console.log('❌ Error creating schedule');
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }

  } catch (error) {
    console.error('❌ Error debugging notification flow:', error.message);
  }
}

debugNotificationFlow(); 