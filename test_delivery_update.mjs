import { db } from './server/db.js';
import { orders } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

async function testUpdate() {
  try {
    const dbConn = await db();
    if (!dbConn) {
      console.log('No database connection');
      return;
    }
    
    // Get first order
    const allOrders = await dbConn.select().from(orders).limit(1);
    console.log('First order:', allOrders[0]);
    
    if (allOrders.length > 0) {
      const orderId = allOrders[0].id;
      console.log(`Updating order ${orderId}...`);
      
      await dbConn.update(orders)
        .set({ isDelivered: 1, updatedAt: new Date() })
        .where(eq(orders.id, orderId));
      
      console.log('Update successful!');
      
      // Verify
      const updated = await dbConn.select().from(orders).where(eq(orders.id, orderId));
      console.log('Updated order:', updated[0]);
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testUpdate();
