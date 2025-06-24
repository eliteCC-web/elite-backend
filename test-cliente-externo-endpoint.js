const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function testClienteExternoProfile() {
  try {
    console.log('=== Probando endpoint de perfil para CLIENTE_EXTERNO ===\n');

    // 1. Login con un usuario CLIENTE_EXTERNO
    console.log('1. Intentando login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'cliente.externo1@elitecc.com', // Usuario de ejemplo
      password: 'Elite123'
    });

    const { token, user } = loginResponse.data;
    console.log('✅ Login exitoso');
    console.log('Usuario:', user.firstName, user.lastName);
    console.log('Roles:', user.roles.map(r => r.name));
    console.log('Token:', token.substring(0, 50) + '...\n');

    // 2. Probar el endpoint de perfil
    console.log('2. Probando endpoint /users/profile...');
    const profileResponse = await axios.get(`${API_BASE_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const profile = profileResponse.data;
    console.log('✅ Perfil cargado exitosamente');
    console.log('ID:', profile.id);
    console.log('Nombre:', profile.firstName, profile.lastName);
    console.log('Email:', profile.email);
    console.log('Roles:', profile.roles.map(r => r.name));
    console.log('Email verificado:', profile.emailVerified);
    console.log('Creado:', profile.createdAt);

    // 3. Verificar que el rol es CLIENTE_EXTERNO
    const hasClienteExternoRole = profile.roles.some(role => role.name === 'CLIENTE_EXTERNO');
    if (hasClienteExternoRole) {
      console.log('\n✅ El usuario tiene el rol CLIENTE_EXTERNO correctamente');
    } else {
      console.log('\n❌ El usuario NO tiene el rol CLIENTE_EXTERNO');
      console.log('Roles actuales:', profile.roles.map(r => r.name));
    }

    // 4. Probar otros endpoints que deberían funcionar para CLIENTE_EXTERNO
    console.log('\n3. Probando otros endpoints...');
    
    // Probar listar eventos
    try {
      const eventsResponse = await axios.get(`${API_BASE_URL}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Endpoint /events accesible');
    } catch (error) {
      console.log('❌ Error accediendo a /events:', error.response?.data?.message || error.message);
    }

    // Probar listar tiendas
    try {
      const storesResponse = await axios.get(`${API_BASE_URL}/stores`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Endpoint /stores accesible');
    } catch (error) {
      console.log('❌ Error accediendo a /stores:', error.response?.data?.message || error.message);
    }

    console.log('\n=== Prueba completada ===');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Posibles causas:');
      console.log('- El usuario no existe');
      console.log('- La contraseña es incorrecta');
      console.log('- El email no está verificado');
    }
  }
}

// Función para probar con diferentes usuarios
async function testMultipleUsers() {
  const testUsers = [
    { email: 'cliente.externo1@elitecc.com', password: 'Elite123' },
    { email: 'cliente.externo2@elitecc.com', password: 'Elite123' },
    { email: 'cliente.externo3@elitecc.com', password: 'Elite123' }
  ];

  for (const user of testUsers) {
    console.log(`\n=== Probando usuario: ${user.email} ===`);
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, user);
      const { token, user: userData } = loginResponse.data;
      
      console.log('✅ Login exitoso');
      console.log('Roles:', userData.roles.map(r => r.name));
      
      // Verificar perfil
      const profileResponse = await axios.get(`${API_BASE_URL}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Perfil accesible');
      
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }
  }
}

// Ejecutar las pruebas
if (require.main === module) {
  console.log('Iniciando pruebas para rol CLIENTE_EXTERNO...\n');
  
  testClienteExternoProfile()
    .then(() => {
      console.log('\n¿Deseas probar con múltiples usuarios? (Ctrl+C para salir)');
      setTimeout(() => {
        testMultipleUsers();
      }, 2000);
    })
    .catch(console.error);
}

module.exports = { testClienteExternoProfile, testMultipleUsers }; 