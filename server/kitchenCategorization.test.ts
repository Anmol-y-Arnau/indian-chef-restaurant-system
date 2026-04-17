import { describe, expect, it } from "vitest";

// ─── Tests para la lógica de categorización de cocina ────────────────────────
// Replicamos la lógica de KitchenView.tsx para testearla de forma aislada

const DRINK_CATEGORIES = new Set([
  'drinks', 'coffees', 'coffee', 'tea', 'beers', 'wines', 'spirits'
]);

function categorizeOrders(orders: Array<{ menuItem: { category: string } }>) {
  const starters = orders.filter(o => o.menuItem.category === 'starters');
  const desserts = orders.filter(o => o.menuItem.category === 'desserts');
  const custom = orders.filter(o => o.menuItem.category === 'custom');
  const drinks = orders.filter(o => DRINK_CATEGORIES.has(o.menuItem.category));
  const mains = orders.filter(o =>
    o.menuItem.category !== 'starters' &&
    o.menuItem.category !== 'desserts' &&
    o.menuItem.category !== 'custom' &&
    !DRINK_CATEGORIES.has(o.menuItem.category)
  );
  return { starters, mains, desserts, drinks, custom };
}

// ─── Tests para la lógica de normalización de nombres ────────────────────────
// Replicamos la lógica de restaurantDb.ts

function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function areSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const wordsA = new Set(a.split(' ').filter(w => w.length > 2));
  const wordsB = new Set(b.split(' ').filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return false;
  let common = 0;
  wordsA.forEach(w => { if (wordsB.has(w)) common++; });
  const similarity = common / Math.max(wordsA.size, wordsB.size);
  return similarity >= 0.6;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("categorizeOrders - sección Varios separada", () => {
  it("los platos custom van a la sección 'custom', no a 'starters'", () => {
    const orders = [
      { menuItem: { category: 'custom' } },
      { menuItem: { category: 'starters' } },
    ];
    const result = categorizeOrders(orders);
    expect(result.custom).toHaveLength(1);
    expect(result.starters).toHaveLength(1);
    expect(result.mains).toHaveLength(0);
  });

  it("los platos custom no aparecen en mains", () => {
    const orders = [
      { menuItem: { category: 'custom' } },
      { menuItem: { category: 'chicken_curry' } },
    ];
    const result = categorizeOrders(orders);
    expect(result.custom).toHaveLength(1);
    expect(result.mains).toHaveLength(1);
  });

  it("si no hay platos custom, la sección custom está vacía", () => {
    const orders = [
      { menuItem: { category: 'starters' } },
      { menuItem: { category: 'chicken_curry' } },
    ];
    const result = categorizeOrders(orders);
    expect(result.custom).toHaveLength(0);
  });
});

describe("categorizeOrders - bebidas van a su sección correcta", () => {
  it("'beers' va a drinks, no a mains", () => {
    const orders = [{ menuItem: { category: 'beers' } }];
    const result = categorizeOrders(orders);
    expect(result.drinks).toHaveLength(1);
    expect(result.mains).toHaveLength(0);
  });

  it("'wines' va a drinks, no a mains", () => {
    const orders = [{ menuItem: { category: 'wines' } }];
    const result = categorizeOrders(orders);
    expect(result.drinks).toHaveLength(1);
    expect(result.mains).toHaveLength(0);
  });

  it("'spirits' va a drinks, no a mains", () => {
    const orders = [{ menuItem: { category: 'spirits' } }];
    const result = categorizeOrders(orders);
    expect(result.drinks).toHaveLength(1);
    expect(result.mains).toHaveLength(0);
  });

  it("'coffees' va a drinks, no a mains", () => {
    const orders = [{ menuItem: { category: 'coffees' } }];
    const result = categorizeOrders(orders);
    expect(result.drinks).toHaveLength(1);
    expect(result.mains).toHaveLength(0);
  });

  it("'drinks' va a drinks, no a mains", () => {
    const orders = [{ menuItem: { category: 'drinks' } }];
    const result = categorizeOrders(orders);
    expect(result.drinks).toHaveLength(1);
    expect(result.mains).toHaveLength(0);
  });

  it("'sides' (arroz, naan) va a mains, no a drinks", () => {
    const orders = [{ menuItem: { category: 'sides' } }];
    const result = categorizeOrders(orders);
    expect(result.mains).toHaveLength(1);
    expect(result.drinks).toHaveLength(0);
  });

  it("categorización mixta correcta", () => {
    const orders = [
      { menuItem: { category: 'starters' } },
      { menuItem: { category: 'chicken_curry' } },
      { menuItem: { category: 'custom' } },
      { menuItem: { category: 'beers' } },
      { menuItem: { category: 'wines' } },
      { menuItem: { category: 'desserts' } },
    ];
    const result = categorizeOrders(orders);
    expect(result.starters).toHaveLength(1);
    expect(result.mains).toHaveLength(1);
    expect(result.custom).toHaveLength(1);
    expect(result.drinks).toHaveLength(2);
    expect(result.desserts).toHaveLength(1);
  });
});

describe("normalizeItemName - normalización para detección de frecuentes", () => {
  it("convierte a minúsculas", () => {
    expect(normalizeItemName("POLLO TIKKA")).toBe("pollo tikka");
  });

  it("elimina acentos", () => {
    expect(normalizeItemName("Pollo Asado con Ñoquis")).toBe("pollo asado con noquis");
  });

  it("elimina caracteres especiales", () => {
    // Los caracteres especiales se eliminan y los espacios resultantes se normalizan
    expect(normalizeItemName("Pollo & Arroz (especial)")).toBe("pollo arroz especial");
  });

  it("normaliza espacios múltiples", () => {
    expect(normalizeItemName("Pollo   Tikka   Masala")).toBe("pollo tikka masala");
  });

  it("elimina espacios al inicio y al final", () => {
    expect(normalizeItemName("  Pollo Tikka  ")).toBe("pollo tikka");
  });
});

describe("areSimilar - detección de platos similares", () => {
  it("detecta nombres idénticos como similares", () => {
    expect(areSimilar("pollo tikka", "pollo tikka")).toBe(true);
  });

  it("detecta cuando uno contiene al otro", () => {
    expect(areSimilar("pollo", "pollo tikka masala")).toBe(true);
    expect(areSimilar("pollo tikka masala", "pollo")).toBe(true);
  });

  it("detecta similitud por palabras comunes (>60%)", () => {
    expect(areSimilar("pollo tikka masala", "pollo tikka")).toBe(true);
  });

  it("rechaza nombres completamente distintos", () => {
    expect(areSimilar("pollo tikka", "arroz basmati")).toBe(false);
  });

  it("rechaza nombres con pocas palabras en común (<60%)", () => {
    // "pollo curry" vs "arroz curry naan" → 1/3 palabras en común = 33%
    expect(areSimilar("pollo curry", "arroz curry naan")).toBe(false);
  });
});
