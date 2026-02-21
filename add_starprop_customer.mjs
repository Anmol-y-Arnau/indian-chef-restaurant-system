import { getDb } from "./server/db.js";
import { frequentCustomers } from "./drizzle/schema.js";

async function addStarProp() {
  const db = await getDb();
  
  if (!db) {
    console.error("❌ No se pudo conectar a la base de datos");
    process.exit(1);
  }

  try {
    await db.insert(frequentCustomers).values({
      name: "STAR PROP PATRIMONIAL, S.L.",
      nif: "B05380993",
      address: "C/ CASTELLAR, 6, 17491",
      city: "LLANÇA (GIRONA)",
    });
    
    console.log("✅ STAR PROP añadido a clientes frecuentes");
  } catch (error) {
    console.error("❌ Error al añadir cliente:", error.message);
  }
  
  process.exit(0);
}

addStarProp();
