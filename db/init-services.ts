import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { services, bookings, users } from './schema';
import { eq } from 'drizzle-orm';

dotenv.config();

const initServices = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  try {
    // Get the first user as provider
    const [adminUser] = await db.select().from(users).limit(1);
    if (!adminUser) {
      throw new Error('No users found in the database');
    }

    const sampleServices = [
      {
        title: "City Walking Tour",
        description: "Explore the city's hidden gems with a local guide",
        price: "29.99",
        location: "City Center",
        providerId: adminUser.id,
        category: "Tours",
        images: [],
        availability: ["Monday", "Wednesday", "Friday"],
      },
      {
        title: "Food Tasting Experience",
        description: "Sample local delicacies and learn about food culture",
        price: "49.99",
        location: "Historic District",
        providerId: adminUser.id,
        category: "Food & Drinks",
        images: [],
        availability: ["Tuesday", "Thursday", "Saturday"],
      },
      {
        title: "Photography Workshop",
        description: "Learn photography techniques while exploring scenic spots",
        price: "79.99",
        location: "Various Locations",
        providerId: adminUser.id,
        category: "Workshops",
        images: [],
        availability: ["Saturday", "Sunday"],
      },
    ];

    // Clear existing bookings and services
    await db.delete(bookings);
    await db.delete(services);

    // Insert sample services
    for (const service of sampleServices) {
      await db.insert(services).values(service);
    }

    console.log('Services initialized with sample data');
  } catch (error) {
    console.error('Error initializing services:', error);
    process.exit(1);
  }

  await sql.end();
  process.exit(0);
};

initServices();
