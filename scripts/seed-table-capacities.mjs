/**
 * Script para inicializar las capacidades reales de las mesas del restaurante Indian Chef.
 * Mesas interiores: 0+ (2), 0- (4), 1 (4 = 2+2 juntas), 2 (4), 3 (4), 4 (4), 5 (4), 6 (4), 7 (4), 8 (2)
 * Terraza: T (4)
 */
import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const TABLE_CAPACITIES = {
  "0+": 2,   // Mesa pequeña zona baja (se junta con 0-)
  "0-": 4,   // Mesa mediana zona baja (se junta con 0+)
  "1":  4,   // Mesa flexible zona baja (2 mesas de 2 juntas)
  "2":  4,
  "3":  4,
  "4":  4,
  "5":  4,   // Zona alta (se junta con 6)
  "6":  4,   // Zona alta (se junta con 5 o con 8)
  "7":  4,
  "8":  2,   // Mesa aislada zona alta (se junta con 6)
  "T":  4,   // Terraza
  "TAKEAWAY": 0,
  "Personal": 0,
};

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  
  console.log("Actualizando capacidades de mesas...");
  
  for (const [tableId, capacity] of Object.entries(TABLE_CAPACITIES)) {
    const [result] = await conn.execute(
      "UPDATE restaurant_tables SET capacity = ? WHERE tableId = ?",
      [capacity, tableId]
    );
    if (result.affectedRows > 0) {
      console.log(`  ✓ Mesa ${tableId}: ${capacity} personas`);
    } else {
      console.log(`  - Mesa ${tableId}: no encontrada en BD (se creará automáticamente con capacity=${capacity})`);
    }
  }
  
  // Verificar resultado
  const [rows] = await conn.execute(
    "SELECT tableId, capacity, status FROM restaurant_tables ORDER BY tableId"
  );
  console.log("\nEstado actual de mesas:");
  console.table(rows);
  
  await conn.end();
  console.log("\n✅ Capacidades actualizadas correctamente.");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
