const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'suarec',
});

async function migrateStoreInfo() {
  try {
    console.log('Conectando a la base de datos...');
    await client.connect();
    console.log('Conectado exitosamente');

    // Verificar si las tablas existen
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'stores')
    `);

    if (tablesCheck.rows.length < 2) {
      console.log('Las tablas users y stores no existen. Asegúrate de que el backend esté corriendo.');
      return;
    }

    console.log('Buscando usuarios con storeInfo...');

    // Buscar usuarios que tienen storeInfo
    const usersWithStoreInfo = await client.query(`
      SELECT id, email, "storeInfo", "firstName", "lastName"
      FROM users 
      WHERE "storeInfo" IS NOT NULL 
      AND "storeInfo" != 'null'
      AND "storeInfo" != '{}'
    `);

    console.log(`Encontrados ${usersWithStoreInfo.rows.length} usuarios con storeInfo`);

    for (const user of usersWithStoreInfo.rows) {
      try {
        const storeInfo = user.storeInfo;
        
        if (!storeInfo || !storeInfo.name) {
          console.log(`⚠️  Usuario ${user.email} tiene storeInfo pero sin nombre de tienda`);
          continue;
        }

        // Verificar si ya existe una tienda para este usuario
        const existingStore = await client.query(`
          SELECT id FROM stores WHERE "ownerId" = $1
        `, [user.id]);

        if (existingStore.rows.length > 0) {
          console.log(`⏭️  Usuario ${user.email} ya tiene una tienda asociada`);
          continue;
        }

        // Generar número de local único
        const timestamp = Date.now().toString().slice(-4);
        const namePrefix = storeInfo.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
        const storeNumber = `${namePrefix}-${timestamp}`;

        // Determinar categoría
        const nameAndDesc = `${storeInfo.name} ${storeInfo.description || ''}`.toLowerCase();
        let category = 'General';
        
        if (nameAndDesc.includes('joyería') || nameAndDesc.includes('joya') || nameAndDesc.includes('oro')) {
          category = 'Joyería';
        } else if (nameAndDesc.includes('ropa') || nameAndDesc.includes('moda') || nameAndDesc.includes('vestir')) {
          category = 'Moda';
        } else if (nameAndDesc.includes('comida') || nameAndDesc.includes('restaurante') || nameAndDesc.includes('café')) {
          category = 'Gastronomía';
        } else if (nameAndDesc.includes('tecnología') || nameAndDesc.includes('celular') || nameAndDesc.includes('computador')) {
          category = 'Tecnología';
        } else if (nameAndDesc.includes('zapato') || nameAndDesc.includes('calzado')) {
          category = 'Calzado';
        } else if (nameAndDesc.includes('belleza') || nameAndDesc.includes('cosmético')) {
          category = 'Belleza';
        } else if (nameAndDesc.includes('deporte') || nameAndDesc.includes('gimnasio')) {
          category = 'Deportes';
        }

        // Extraer piso de la dirección
        let floor = '1';
        if (storeInfo.address) {
          const floorMatch = storeInfo.address.match(/nivel\s*(\d+)/i) || storeInfo.address.match(/piso\s*(\d+)/i);
          if (floorMatch) {
            floor = floorMatch[1];
          }
        }

        // Crear la tienda
        const insertResult = await client.query(`
          INSERT INTO stores (
            store_number, 
            name, 
            phone, 
            description, 
            image_url, 
            category, 
            floor, 
            monthly_rent, 
            is_active, 
            "ownerId", 
            created_at, 
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          RETURNING id
        `, [
          storeNumber,
          storeInfo.name,
          storeInfo.phone || 'N/A',
          storeInfo.description || '',
          storeInfo.images && storeInfo.images.length > 0 ? storeInfo.images[0] : null,
          category,
          floor,
          null, // monthly_rent
          true, // is_active
          user.id
        ]);

        const storeId = insertResult.rows[0].id;

        // Actualizar la relación en la tabla users
        await client.query(`
          UPDATE users 
          SET "ownedStoreId" = $1 
          WHERE id = $2
        `, [storeId, user.id]);

        console.log(`✅ Tienda creada para ${user.email}: ${storeInfo.name} (${storeNumber})`);

      } catch (error) {
        console.error(`❌ Error procesando usuario ${user.email}:`, error.message);
      }
    }

    // Contar total de tiendas
    const countResult = await client.query('SELECT COUNT(*) FROM stores');
    console.log(`\n🎉 Total de tiendas en la base de datos: ${countResult.rows[0].count}`);

    // Mostrar resumen de usuarios con storeInfo
    const remainingUsers = await client.query(`
      SELECT COUNT(*) FROM users 
      WHERE "storeInfo" IS NOT NULL 
      AND "storeInfo" != 'null'
      AND "storeInfo" != '{}'
    `);
    console.log(`📊 Usuarios que aún tienen storeInfo: ${remainingUsers.rows[0].count}`);

  } catch (error) {
    console.error('Error ejecutando migración:', error);
  } finally {
    await client.end();
    console.log('Conexión cerrada');
  }
}

migrateStoreInfo(); 