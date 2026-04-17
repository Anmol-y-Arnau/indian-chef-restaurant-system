/**
 * Script para limpiar datos de prueba de la BD real.
 * Los tests de integración se conectan a la BD real y pueden dejar datos basura.
 * Ejecutar con: pnpm tsx scripts/cleanup-test-data.mjs
 */
import { createConnection } from 'mysql2/promise';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('No DATABASE_URL found in environment');
  process.exit(1);
}

const conn = await createConnection(DB_URL);

console.log('Connecting to database...');

// Fetch recent sales
const [rows] = await conn.execute(
  `SELECT id, tableId, total, items, createdAt FROM sales ORDER BY createdAt DESC LIMIT 200`
);

console.log(`Found ${rows.length} sales total`);

// Test item names that only appear in tests
const TEST_ITEM_NAMES = new Set([
  'Test Item', 'Another Item', 'Item to Delete', 'Item 1', 'Item 2',
  'Multi Item 1', 'Multi Item 2', 'Special Item', 'Another Special',
]);

// Test table IDs used in tests (not real tables)
const TEST_TABLE_IDS = new Set(['test-table']);

const testSales = [];
for (const row of rows) {
  let items = [];
  try {
    items = typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []);
  } catch(e) {}
  
  const isTestTable = TEST_TABLE_IDS.has(row.tableId);
  const hasTestItems = items.some(item => {
    const name = item?.menuItem?.name || item?.name || '';
    return TEST_ITEM_NAMES.has(name);
  });
  
  if (isTestTable || hasTestItems) {
    testSales.push({ 
      id: row.id, 
      tableId: row.tableId, 
      total: row.total, 
      items: items.map(i => i?.menuItem?.name || i?.name || '?').join(', '),
      createdAt: row.createdAt
    });
  }
}

console.log(`\nTest sales found (${testSales.length}):`);
testSales.forEach(s => console.log(`  ID ${s.id}: Mesa "${s.tableId}" - ${s.total}€ - Items: ${s.items} - ${s.createdAt}`));

if (testSales.length > 0) {
  const ids = testSales.map(s => s.id);
  const placeholders = ids.map(() => '?').join(',');
  const [result] = await conn.execute(`DELETE FROM sales WHERE id IN (${placeholders})`, ids);
  console.log(`\n✅ Deleted ${result.affectedRows} test sales`);
} else {
  console.log('\n✅ No test sales found to delete');
}

// Clean up leftover test orders
const [orderResult] = await conn.execute(
  `DELETE FROM orders WHERE tableId = 'test-table'`
);
console.log(`✅ Deleted ${orderResult.affectedRows} test orders from test-table`);

await conn.end();
console.log('\nCleanup complete!');
