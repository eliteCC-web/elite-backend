// Script de prueba para verificar el endpoint de perfil
const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

async function testProfileEndpoint() {
  try {
    console.log('🔍 Probando endpoint de perfil...');
    
    // Primero, intentar obtener el perfil sin token (debería fallar)
    try {
      await axios.get(`${API_BASE_URL}/users/profile`);
      console.log('❌ Error: El endpoint debería requerir autenticación');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correcto: El endpoint requiere autenticación');
      } else {
        console.log('❌ Error inesperado:', error.response?.status, error.response?.data);
      }
    }

    // Verificar que el servidor esté funcionando
    try {
      const healthCheck = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
      console.log('✅ Servidor funcionando:', healthCheck.status);
    } catch (error) {
      console.log('❌ Servidor no responde:', error.message);
    }

    console.log('\n📋 Para probar completamente:');
    console.log('1. Inicia sesión en el frontend');
    console.log('2. Ve a la página de perfil');
    console.log('3. Revisa la consola del navegador para errores');
    console.log('4. Verifica que el token JWT esté presente en localStorage');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testProfileEndpoint(); 