const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'suarec',
});

const sampleStores = [
  {
    storeNumber: "A-101",
    name: "Nike Store Elite",
    phone: "3001234567",
    description: "Tienda oficial de Nike con las últimas colecciones deportivas y calzado de alta calidad.",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    category: "Deportes",
    floor: "1",
    monthlyRent: 2500000,
    isActive: true
  },
  {
    storeNumber: "A-102",
    name: "Adidas Elite",
    phone: "3009876543",
    description: "Todo para deportistas con la mejor tecnología en ropa y calzado deportivo.",
    imageUrl: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=400",
    category: "Deportes",
    floor: "1",
    monthlyRent: 2200000,
    isActive: true
  },
  {
    storeNumber: "B-201",
    name: "Starbucks Coffee",
    phone: "3007654321",
    description: "Café premium y bebidas especiales en un ambiente acogedor y moderno.",
    imageUrl: "https://images.unsplash.com/photo-1575844264771-892081089af5?w=400",
    category: "Gastronomía",
    floor: "2",
    monthlyRent: 1800000,
    isActive: true
  },
  {
    storeNumber: "B-202",
    name: "Apple Store",
    phone: "3005551234",
    description: "Tienda oficial de Apple con los últimos dispositivos iPhone, iPad, Mac y accesorios.",
    imageUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400",
    category: "Tecnología",
    floor: "2",
    monthlyRent: 3500000,
    isActive: true
  },
  {
    storeNumber: "C-301",
    name: "Zara Fashion",
    phone: "3004445678",
    description: "Las últimas tendencias en moda para hombres y mujeres con diseños exclusivos.",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
    category: "Moda",
    floor: "3",
    monthlyRent: 2800000,
    isActive: true
  },
  {
    storeNumber: "C-302",
    name: "H&M",
    phone: "3003339876",
    description: "Moda asequible y sostenible para toda la familia con las últimas tendencias.",
    imageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400",
    category: "Moda",
    floor: "3",
    monthlyRent: 2400000,
    isActive: true
  },
  {
    storeNumber: "A-103",
    name: "McDonald's",
    phone: "3002223456",
    description: "Comida rápida de calidad con el sabor que todos conocen y aman.",
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
    category: "Gastronomía",
    floor: "1",
    monthlyRent: 2000000,
    isActive: true
  },
  {
    storeNumber: "B-203",
    name: "Samsung Store",
    phone: "3001117890",
    description: "Tecnología Samsung de vanguardia: smartphones, tablets, TVs y electrodomésticos.",
    imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400",
    category: "Tecnología",
    floor: "2",
    monthlyRent: 3200000,
    isActive: true
  },
  {
    storeNumber: "C-303",
    name: "Victoria's Secret",
    phone: "3009998765",
    description: "Lencería y productos de belleza de alta calidad para mujeres.",
    imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400",
    category: "Belleza",
    floor: "3",
    monthlyRent: 2600000,
    isActive: true
  },
  {
    storeNumber: "A-104",
    name: "Cinema Elite",
    phone: "3008886543",
    description: "Salas de cine de última generación con la mejor experiencia audiovisual.",
    imageUrl: "https://images.unsplash.com/photo-1489599832522-461acd474c08?w=400",
    category: "Entretenimiento",
    floor: "1",
    monthlyRent: 4000000,
    isActive: true
  },
  {
    storeNumber: "B-204",
    name: "Farmacia La Rebaja",
    phone: "3007774321",
    description: "Farmacia con amplia variedad de medicamentos y productos de cuidado personal.",
    imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400",
    category: "Salud",
    floor: "2",
    monthlyRent: 1500000,
    isActive: true
  },
  {
    storeNumber: "C-304",
    name: "Home Center",
    phone: "3006661234",
    description: "Todo para el hogar: muebles, decoración, herramientas y más.",
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
    category: "Hogar",
    floor: "3",
    monthlyRent: 3000000,
    isActive: true
  }
];

async function seedStores() {
  try {
    console.log('Conectando a la base de datos...');
    await client.connect();
    console.log('Conectado exitosamente');

    // Verificar si la tabla stores existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'stores'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('La tabla stores no existe. Asegúrate de que el backend esté corriendo y las migraciones se hayan ejecutado.');
      return;
    }

    console.log('Insertando tiendas de ejemplo...');

    for (const store of sampleStores) {
      // Verificar si la tienda ya existe
      const existingStore = await client.query(
        'SELECT id FROM stores WHERE store_number = $1',
        [store.storeNumber]
      );

      if (existingStore.rows.length === 0) {
        await client.query(`
          INSERT INTO stores (store_number, name, phone, description, image_url, category, floor, monthly_rent, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        `, [
          store.storeNumber,
          store.name,
          store.phone,
          store.description,
          store.imageUrl,
          store.category,
          store.floor,
          store.monthlyRent,
          store.isActive
        ]);
        console.log(`✅ Tienda creada: ${store.name} (${store.storeNumber})`);
      } else {
        console.log(`⏭️  Tienda ya existe: ${store.name} (${store.storeNumber})`);
      }
    }

    // Contar total de tiendas
    const countResult = await client.query('SELECT COUNT(*) FROM stores');
    console.log(`\n🎉 Total de tiendas en la base de datos: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error('Error ejecutando seed de tiendas:', error);
  } finally {
    await client.end();
    console.log('Conexión cerrada');
  }
}

seedStores(); 