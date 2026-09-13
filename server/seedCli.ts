import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from './config/db.js';
import { seedDatabase } from './utils/seedData.js';

async function run() {
  console.log('--- FAMAS Database Seeder ---');
  try {
    await connectDB();
    console.log('Force re-seeding database...');
    await seedDatabase(true);
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

run();
