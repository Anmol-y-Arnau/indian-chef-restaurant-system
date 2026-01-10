import { getDb } from './server/db.js';
import { orders } from './drizzle/schema.js';

async function checkSchema() {
  try {
    const db = await getDb();
    if (!db) {
      console.log('No database connection');
      process.exit(1);
    }
    
    // Check if table exists and get structure
    const result = await db.execute('DESCRIBE orders');
    console.log('Orders table structure:');
    console.log(result);
    
    // Try to get one order
    const oneOrder = await db.select().from(orders).limit(1);
    console.log('\nSample order:');
    console.log(oneOrder[0]);
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkSchema();
