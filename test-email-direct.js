require('dotenv').config();
const axios = require('axios');

async function testEmailDirect() {
  try {
    console.log('🧪 Testing direct email sending...');
    
    // Verificar configuración
    if (!process.env.BREVO_API) {
      console.log('❌ BREVO_API not configured');
      return;
    }

    console.log('✅ BREVO_API configured');

    // Email de prueba
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    
    if (!testEmail || testEmail === 'test@example.com') {
      console.log('⚠️  Please set TEST_EMAIL in your .env file with a real email');
      console.log('   Example: TEST_EMAIL=tu-email@gmail.com');
      return;
    }

    console.log(`📧 Testing with email: ${testEmail}`);

    // Crear mensaje de prueba
    const emailData = {
      sender: {
        name: 'ELITE',
        email: 'elitecc.soporte@gmail.com'  // Usar email verificado de Brevo
      },
      to: [
        {
          email: testEmail,
          name: 'Test User'
        }
      ],
      subject: 'Test Email - ELITE Notifications',
      htmlContent: `
        <html>
          <body>
            <h1>Test Email from ELITE</h1>
            <p>This is a test email to verify that Brevo email service is working.</p>
            <p>If you receive this email, the email notifications are working correctly.</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </body>
        </html>
      `
    };

    console.log('\n📤 Sending test email...');

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API,
        'content-type': 'application/json'
      }
    });

    console.log('✅ Email sent successfully!');
    console.log(`📨 Message ID: ${response.data.messageId}`);
    console.log(`📊 Response:`, response.data);

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testEmailDirect(); 