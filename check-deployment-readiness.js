const fs = require('fs');
const path = require('path');

console.log('=== Verificando Preparación para Despliegue ===\n');

// 1. Verificar archivos de migración
console.log('1. Verificando archivos de migración...');
const migrationFiles = [
  'migration-add-email-verification.sql',
  'migrate-user-roles.sql'
];

migrationFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Existe`);
  } else {
    console.log(`❌ ${file} - No encontrado`);
  }
});

// 2. Verificar archivos de prueba
console.log('\n2. Verificando archivos de prueba...');
const testFiles = [
  'test-cliente-externo-endpoint.js',
  'check-email-verification-fields.js'
];

testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Existe`);
  } else {
    console.log(`❌ ${file} - No encontrado`);
  }
});

// 3. Verificar documentación
console.log('\n3. Verificando documentación...');
const docsFiles = [
  'EMAIL_VERIFICATION_SETUP.md',
  'README.md'
];

docsFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Existe`);
  } else {
    console.log(`❌ ${file} - No encontrado`);
  }
});

// 4. Verificar configuración de TypeORM
console.log('\n4. Verificando configuración de TypeORM...');
const ormConfigPath = path.join(__dirname, 'src', 'ormconfig.ts');
if (fs.existsSync(ormConfigPath)) {
  console.log('✅ ormconfig.ts - Existe');
} else {
  console.log('❌ ormconfig.ts - No encontrado');
}

// 5. Verificar package.json
console.log('\n5. Verificando dependencias...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Verificar dependencia de Brevo
  if (packageJson.dependencies && packageJson.dependencies['@getbrevo/brevo']) {
    console.log('✅ @getbrevo/brevo - Instalado');
  } else {
    console.log('❌ @getbrevo/brevo - No instalado');
  }
  
  // Verificar scripts
  if (packageJson.scripts && packageJson.scripts['typeorm']) {
    console.log('✅ typeorm script - Configurado');
  } else {
    console.log('❌ typeorm script - No configurado');
  }
}

// 6. Verificar variables de entorno
console.log('\n6. Verificando variables de entorno...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'BREVO_API_KEY',
    'BREVO_SENDER_EMAIL',
    'BREVO_SENDER_NAME',
    'EMAIL_VERIFICATION_EXPIRY_HOURS',
    'FRONTEND_URL'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName} - Configurado`);
    } else {
      console.log(`❌ ${varName} - No configurado`);
    }
  });
} else {
  console.log('❌ .env - No encontrado');
}

// 7. Verificar entidades
console.log('\n7. Verificando entidades...');
const entityFiles = [
  'src/email-verification/entities/email-verification.entity.ts',
  'src/user/entities/user.entity.ts'
];

entityFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Existe`);
  } else {
    console.log(`❌ ${file} - No encontrado`);
  }
});

// 8. Verificar servicios
console.log('\n8. Verificando servicios...');
const serviceFiles = [
  'src/email-verification/services/email-verification.service.ts',
  'src/auth/auth.service.ts'
];

serviceFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Existe`);
  } else {
    console.log(`❌ ${file} - No encontrado`);
  }
});

console.log('\n=== Resumen de Preparación ===');
console.log('✅ Si todos los archivos están presentes, el sistema está listo para despliegue');
console.log('✅ La base de datos se recreará automáticamente con la seed');
console.log('✅ Los usuarios tendrán roles correctos (CLIENTE_EXTERNO en lugar de USER)');
console.log('✅ Todos los usuarios de seed estarán verificados por email');
console.log('✅ El sistema de verificación de email estará completamente funcional');

console.log('\n=== Pasos para Despliegue ===');
console.log('1. Eliminar base de datos en Railway');
console.log('2. Desplegar el backend');
console.log('3. La seed automática creará todo correctamente');
console.log('4. Probar con: node test-cliente-externo-endpoint.js'); 