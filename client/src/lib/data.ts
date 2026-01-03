import { Category, MenuItem, Table } from "./types";

export const CATEGORIES: Category[] = [
  { id: 'starters', label: 'Entrantes y Chaats', icon: '🥟' },
  { id: 'salads', label: 'Ensaladas', icon: '🥗' },
  { id: 'tandoor', label: 'Especial Tandoor', icon: '🔥' },
  { id: 'veg_curry', label: 'Curry Vegetariano', icon: '🥦' },
  { id: 'chicken_curry', label: 'Curry de Pollo', icon: '🍗' },
  { id: 'biryani', label: 'Biryani (Arroces)', icon: '🍚' },
  { id: 'sides', label: 'Guarniciones (Arroz/Pan)', icon: '🫓' },
  { id: 'wines', label: 'Vinos', icon: '🍷' },
  { id: 'drinks', label: 'Bebidas', icon: '🥤' },
  { id: 'coffees', label: 'Cafés', icon: '☕' },
  { id: 'desserts', label: 'Postres', icon: '🍰' },
];

export const MENU_ITEMS: MenuItem[] = [
  // VEGETARIAN STARTERS AND CHAATS
  {
    id: 'st1',
    name: 'Chaat Samosa',
    description: 'Samosas casera al estilo de la vieja Delhi. (2 UN)',
    price: 6.90,
    category: 'starters',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'st2',
    name: 'Mix Vege Pakora',
    description: 'Seis piezas de Pakora con cebolla, patatas, espinacas, mezcladas con especias molidas. Servido con salsa de tamarindo. (6 UN)',
    price: 6.90,
    category: 'starters',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'st3',
    name: 'Amritsar Paneer Pakora',
    description: 'Queso natural elaborado con queso creado en el norte de la India, Amritsar. Con tempura de harina de garbanzo y arroz. (6 UN)',
    price: 9.90,
    category: 'starters',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'st4',
    name: 'Royal king para dos personas',
    description: 'Surtido variado entrante para dos personas.',
    price: 15.90,
    category: 'starters',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'st5',
    name: 'Royal Prawn Pakora',
    description: 'Gambas en tempura, rebozado con harina de garbanzos y lenteja, servido con indian piri piri sauce.',
    price: 12.90,
    category: 'starters',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1971&auto=format&fit=crop'
  },
  {
    id: 'st6',
    name: 'Fish Pakora',
    description: 'Pescado frito, elaborado con la forma de madraz, rebozado con harina de garbanzos y arroz. (6 UN)',
    price: 10.90,
    category: 'starters',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'st7',
    name: 'Murg Pakora',
    description: 'Tiras de pollo rebozadas marinadas con especias y harina de garbanzos, frito, crujiente. Servido con ensalada. (6 UN)',
    price: 9.90,
    category: 'starters',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1971&auto=format&fit=crop'
  },

  // SALADS
  {
    id: 'sl1',
    name: 'Indian Prawns Salad',
    description: 'Ensalada de temporada, con gambas en la tempura, con harina de garbanzos y arroz. Servida con vinagreta de mango y frutos secos.',
    price: 12.90,
    category: 'salads',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'sl2',
    name: 'Crispy Chicken Salad',
    description: 'Brotes verde de temporada, verduras confitadas y pollo, cocinado con el tandoor. Servido con salsa blanca de yogur.',
    price: 8.90,
    category: 'salads',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1780&auto=format&fit=crop'
  },
  {
    id: 'sl3',
    name: 'Mix Green Salad',
    description: 'Ensalada verde.',
    price: 5.90,
    category: 'salads',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop'
  },

  // SPECIAL TANDOOR
  {
    id: 'td1',
    name: 'Murg Tandoori',
    description: 'Pollo con especias naturales y preparado con tandoori horno.',
    price: 11.90,
    category: 'tandoor',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=2150&auto=format&fit=crop'
  },
  {
    id: 'td2',
    name: 'Tandoori Paneer Tikka',
    description: 'Queso natural, elaborado con la antigüedad de los mongoles de la india, en tandoor.',
    price: 14.90,
    category: 'tandoor',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'td3',
    name: 'Tandori Fish Tikka',
    description: 'Un pescado tierno marinado en un tandoori masala indio clásico y crujiente a la perfección.',
    price: 15.90,
    category: 'tandoor',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=2150&auto=format&fit=crop'
  },
  {
    id: 'td4',
    name: 'Murg Tikka',
    description: 'Pierna de pollo con especias naturales y preparado con tandoori horno.',
    price: 11.90,
    category: 'tandoor',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=2150&auto=format&fit=crop'
  },
  {
    id: 'td5',
    name: 'Sugerencias del chef',
    description: 'Tandoori mix grill para dos personas.',
    price: 30.00,
    category: 'tandoor',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'td6',
    name: 'Prawn Tandoori',
    description: 'Plato del Tandoori de gambas.',
    price: 11.90,
    category: 'tandoor',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1971&auto=format&fit=crop'
  },

  // VEG AND VEGAN CURRY
  {
    id: 'vc1',
    name: 'Sabzi bhaji',
    description: 'Verduras mixtas de la temporada, con queso natural de la india. Cocinado con la manera del chef.',
    price: 9.90,
    category: 'veg_curry',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1606471191009-63994c53433b?q=80&w=2127&auto=format&fit=crop'
  },
  {
    id: 'vc2',
    name: 'Bhaji Mix',
    description: 'Verduras mixtas de la temporada, cocinado con la manera del chef.',
    price: 8.90,
    category: 'veg_curry',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1606471191009-63994c53433b?q=80&w=2127&auto=format&fit=crop'
  },
  {
    id: 'vc3',
    name: 'Mutter Paneer',
    description: 'Un guiso de queso natural con guisantes del campo, acompañada de salsa curry y servido con cilantro fresco.',
    price: 9.90,
    category: 'veg_curry',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'vc4',
    name: 'Palak Paneer',
    description: 'Queso Natural cocinado con espinacas frescas al estilo Patiala.',
    price: 10.90,
    category: 'veg_curry',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1606471191009-63994c53433b?q=80&w=2127&auto=format&fit=crop'
  },
  {
    id: 'vc5',
    name: 'Paneer Burji',
    description: 'Queso rallado salteado con especias, especialidad Indian Chef.',
    price: 15.90,
    category: 'veg_curry',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'vc6',
    name: 'Dal Makhni',
    description: 'Lentejas negras guisadas con mantequilla y nata.',
    price: 9.90,
    category: 'veg_curry',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'vc7',
    name: 'Dal Tadka',
    description: 'Lentejas con especias naturales y preparado con tandoori horno.',
    price: 9.90,
    category: 'veg_curry',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'vc8',
    name: 'Chana Masala',
    description: 'Garbanzos de la casa, en salsas de cebolla y tomate, agridulce.',
    price: 9.90,
    category: 'veg_curry',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?q=80&w=2070&auto=format&fit=crop'
  },

  // CHICKEN CURRY
  {
    id: 'cc1',
    name: 'Murg Curry',
    description: 'Pollo picado, cocinado con cebolla, tomate y comino en polvo. (Preferente picante)',
    price: 11.90,
    category: 'chicken_curry',
    isVeg: false,
    isSpicy: true,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1971&auto=format&fit=crop'
  },
  {
    id: 'cc2',
    name: 'Murg Korma',
    description: 'Pollo en cubitos cocinado con cebolla, frutas secos y salsa rica en crema.',
    price: 11.90,
    category: 'chicken_curry',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1971&auto=format&fit=crop'
  },
  {
    id: 'cc3',
    name: 'Murg Rogan Josh',
    description: 'Pollo picado, con pimientos verdes, rojos, jeera, jengibres y ajo. (Preferente picante)',
    price: 11.90,
    category: 'chicken_curry',
    isVeg: false,
    isSpicy: true,
    image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'cc4',
    name: 'Murg Tikka Masala',
    description: 'El pollo tikka masala es un plato de curry que consiste en pollo tikka y una espesa salsa de naranja hecha con puré de tomate, yogur, jengibre y una mezcla de especias llamada masala. (Preferente picante)',
    price: 11.90,
    category: 'chicken_curry',
    isVeg: false,
    isSpicy: true,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1971&auto=format&fit=crop'
  },
  {
    id: 'cc5',
    name: 'Murg Karahi',
    description: 'Es un plato de pollo, picante preferente, ahumado y lleno de sabor, con una espesa salsa, cebolla y un pimiento asado crujiente.',
    price: 11.90,
    category: 'chicken_curry',
    isVeg: false,
    isSpicy: true,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1971&auto=format&fit=crop'
  },
  {
    id: 'cc6',
    name: 'Murg Butter',
    description: 'Un plato clásico donde el pollo se hace a la manera Tandoori, se cuece a fuego lento en una salsa de tomate picante (preferente al gusto), aromática, mantecosa, y cremosa.',
    price: 11.90,
    category: 'chicken_curry',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=1968&auto=format&fit=crop'
  },
  {
    id: 'cc7',
    name: 'Murg Vindaloo',
    description: 'El vindaloo es denominado a veces como el rey de los currys por su fuerza en el picante. Te proponemos probar esta receta de curry de pollo picante.',
    price: 12.90,
    category: 'chicken_curry',
    isVeg: false,
    isSpicy: true,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1971&auto=format&fit=crop'
  },

  // BIRYANI (ARROCES)
  {
    id: 'bi1',
    name: 'Mix Veg Biryani',
    description: 'Plato clásico de la india cocinando a fuego lento con arroz Basmati salteado y frito con verdura fresca, tomate, jengibre, cardamomo, azafrán y selectas especias.',
    price: 10.90,
    category: 'biryani',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=2010&auto=format&fit=crop'
  },
  {
    id: 'bi2',
    name: 'Mix Biryani',
    description: 'Nuestro plato especial con Arroz basmati y la mezcla de carne, pollo, corderito, gambas y especias aromáticas.',
    price: 15.90,
    category: 'biryani',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=2010&auto=format&fit=crop'
  },
  {
    id: 'bi3',
    name: 'Murg Biryani',
    description: 'Arroz Basmati con pollo, menta fresca, cilantro fresco, pasta de ajo, jengibre, cúrcuma, cebolla y especias.',
    price: 12.90,
    category: 'biryani',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=2010&auto=format&fit=crop'
  },
  {
    id: 'bi4',
    name: 'Lamb Biryani',
    description: 'Arroz Basmati con corderito fresco, menta fresca, cilantro fresco, pasta de ajo, jengibre, cúrcuma, cebolla y especias.',
    price: 14.90,
    category: 'biryani',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=2010&auto=format&fit=crop'
  },
  {
    id: 'bi5',
    name: 'Gamba Biryani',
    description: 'Arroz Basmati con gambas, tomate, jengibre y azafrán, condimentado con especias aromáticas.',
    price: 15.90,
    category: 'biryani',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=2010&auto=format&fit=crop'
  },
  {
    id: 'bi6',
    name: 'Fish Biryani',
    description: 'Fish biryani es un plato de arroz en capas elaborado con pescado, arroz basmati, especias y hierbas.',
    price: 15.90,
    category: 'biryani',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=2010&auto=format&fit=crop'
  },

  // GUARNICIONES (ARROZ)
  {
    id: 'sd1',
    name: 'Plain Rice',
    description: 'Arroz Basmati blanco con aromas agradables y rico en nutrientes cultivado en las montañas del Himalaya.',
    price: 3.90,
    category: 'sides',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=1925&auto=format&fit=crop'
  },
  {
    id: 'sd2',
    name: 'Pulao Rice',
    description: 'Arroz Basmati aromatizado con especias como el cardamomo, clavo, comino y hoja de laurel.',
    price: 4.90,
    category: 'sides',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=1925&auto=format&fit=crop'
  },
  {
    id: 'sd3',
    name: 'Jeera Rice',
    description: 'El arroz jeera es un plato indio que consiste en arroz y semillas de comino.',
    price: 4.90,
    category: 'sides',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=1925&auto=format&fit=crop'
  },
  {
    id: 'sd4',
    name: 'Egg Rice',
    description: 'El arroz muy popular que se prepara con masales indias y termina con un poco de salsa de soya para darle sabor.',
    price: 5.90,
    category: 'sides',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=1925&auto=format&fit=crop'
  },
  {
    id: 'sd5',
    name: 'Lahori jarda\'s Rice',
    description: 'Es un plato tradicional de arroz dulce hervido, originario del subcontinente indio, elaborado con azafrán, leche y azúcar, y aromatizado con cardamomo, pasas, pistachos o almendras.',
    price: 5.90,
    category: 'sides',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=1925&auto=format&fit=crop'
  },

  // GUARNICIONES (PAN)
  {
    id: 'pn1',
    name: 'Plain Naan',
    description: 'Pan de harina de trigo cocinado en horno Tandoor.',
    price: 3.90,
    category: 'sides',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=80&w=1976&auto=format&fit=crop'
  },
  {
    id: 'pn2',
    name: 'Garlic Naan',
    description: 'Pan de harina de trigo con rodajas de ajo y cilantro.',
    price: 4.90,
    category: 'sides',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80&w=1974&auto=format&fit=crop'
  },
  {
    id: 'pn3',
    name: 'Aloo Naan',
    description: 'Pan relleno de patatas con una textura crujiente y sutil.',
    price: 4.90,
    category: 'sides',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=80&w=1976&auto=format&fit=crop'
  },
  {
    id: 'pn4',
    name: 'Cheese Naan',
    description: 'Pan relleno de queso natural.',
    price: 4.90,
    category: 'sides',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=80&w=1976&auto=format&fit=crop'
  },
  {
    id: 'pn5',
    name: 'Kirma Naan',
    description: 'Pan relleno de carne picada y algunas especias con predominancia de comino y cúrcuma.',
    price: 4.90,
    category: 'sides',
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=80&w=1976&auto=format&fit=crop'
  },
  {
    id: 'pn6',
    name: 'Kulcha Naan',
    description: '',
    price: 4.90,
    category: 'sides',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=80&w=1976&auto=format&fit=crop'
  },
  {
    id: 'pn7',
    name: 'Butter Naan',
    description: 'Pan de harina de trigo con un toque de mantequilla.',
    price: 4.90,
    category: 'sides',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=80&w=1976&auto=format&fit=crop'
  },
  {
    id: 'pn8',
    name: 'Kashmiri Naan',
    description: 'Pan de harina de trigo con especias y frutos secos.',
    price: 4.90,
    category: 'sides',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=80&w=1976&auto=format&fit=crop'
  },

  // VINOS
  {
    id: 'wn1',
    name: 'Bufar i Fer Ampollas Negre',
    description: 'Tinto',
    price: 12.00,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn2',
    name: 'Cecios',
    description: 'Tinto',
    price: 15.00,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn3',
    name: 'Pasarell',
    description: 'Tinto',
    price: 17.00,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn4',
    name: 'Parica Criança',
    description: 'Tinto',
    price: 16.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn5',
    name: 'Marques de Cáceres Negre',
    description: 'Tinto',
    price: 18.00,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn6',
    name: 'Viña Pomal',
    description: 'Tinto',
    price: 26.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn7',
    name: 'Marqués de Murrieta',
    description: 'Tinto',
    price: 31.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn8',
    name: 'Sangre de Toro',
    description: 'Tinto',
    price: 13.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn9',
    name: 'Valdubón Roble',
    description: 'Tinto',
    price: 17.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn10',
    name: 'El Coto',
    description: 'Tinto',
    price: 15.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn11',
    name: 'Torres de Casta',
    description: 'Rosé & Riesling',
    price: 12.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1559563362-c667ba5f5480?q=80&w=2002&auto=format&fit=crop'
  },
  {
    id: 'wn12',
    name: 'Bufar i Fer Ampolles Rosado',
    description: 'Rosé & Riesling',
    price: 12.00,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1559563362-c667ba5f5480?q=80&w=2002&auto=format&fit=crop'
  },
  {
    id: 'wn13',
    name: 'Daina',
    description: 'Rosé & Riesling',
    price: 15.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1559563362-c667ba5f5480?q=80&w=2002&auto=format&fit=crop'
  },
  {
    id: 'wn14',
    name: 'Marqués de Cáceres Rosado',
    description: 'Rosé & Riesling',
    price: 15.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1559563362-c667ba5f5480?q=80&w=2002&auto=format&fit=crop'
  },
  {
    id: 'wn15',
    name: 'Bufar i Fer Ampollas',
    description: 'Blanco',
    price: 12.00,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn16',
    name: 'Mabre',
    description: 'Blanco',
    price: 17.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn17',
    name: 'Marqués De Cáceres Blanco',
    description: 'Blanco',
    price: 16.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn18',
    name: 'Viña Sol',
    description: 'Blanco',
    price: 14.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn19',
    name: 'El Coto',
    description: 'Blanco',
    price: 15.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
];

export const INITIAL_TABLES: Table[] = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  name: `Mesa ${i}`,
  status: 'free',
  orders: [],
  guests: 0
}));

// BEBIDAS
MENU_ITEMS.push(
  {
    id: 'dr1',
    name: 'Refresco',
    description: 'Coca-Cola, Fanta, Sprite, etc.',
    price: 3.50,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'dr2',
    name: 'Caña',
    description: 'Cerveza de barril',
    price: 3.00,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'dr3',
    name: 'Estrella (Botella)',
    description: 'Cerveza Estrella Galicia',
    price: 3.50,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'dr4',
    name: 'Cobra',
    description: 'Cerveza India Premium',
    price: 4.00,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'dr5',
    name: 'Agua Pequeña',
    description: 'Agua mineral 33cl',
    price: 3.00,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=1888&auto=format&fit=crop'
  },
  {
    id: 'dr6',
    name: 'Agua Grande',
    description: 'Agua mineral 1L',
    price: 4.00,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=1888&auto=format&fit=crop'
  },
  {
    id: 'dr7',
    name: 'Copa de Vino',
    description: 'Vino de la casa (Tinto/Blanco/Rosado)',
    price: 3.50,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  }
);

// CAFÉS
MENU_ITEMS.push(
  {
    id: 'cf1',
    name: 'Café Solo',
    description: 'Espresso',
    price: 1.80,
    category: 'coffees',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1887&auto=format&fit=crop'
  },
  {
    id: 'cf2',
    name: 'Cortado',
    description: 'Espresso con un poco de leche',
    price: 2.00,
    category: 'coffees',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1887&auto=format&fit=crop'
  },
  {
    id: 'cf3',
    name: 'Café con Leche',
    description: 'Café con leche grande',
    price: 2.50,
    category: 'coffees',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1887&auto=format&fit=crop'
  },
  {
    id: 'cf4',
    name: 'Carajillo',
    description: 'Café con licor (Brandy/Whisky/Ron)',
    price: 4.50,
    category: 'coffees',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1887&auto=format&fit=crop'
  }
);

// POSTRES
MENU_ITEMS.push(
  {
    id: 'ds1',
    name: 'Kesar Kheer',
    description: 'Arroz cocinado con leche y azafrán, servido con helado de vainilla.',
    price: 4.90,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'ds2',
    name: 'Mix Indian Sweet',
    description: 'Surtido de pasteles de la india, cocinado especialmente por el chef.',
    price: 8.90,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1589119908995-c6837fa14848?q=80&w=2080&auto=format&fit=crop'
  },
  {
    id: 'ds3',
    name: 'Haridwari Gulab jamun',
    description: 'Gulab jamun caliente.',
    price: 4.90,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1589119908995-c6837fa14848?q=80&w=2080&auto=format&fit=crop'
  },
  {
    id: 'ds4',
    name: 'Bikaneri Sponge Rashgula',
    description: 'Postre de leche requesón natural indio, en almíbar de azúcar.',
    price: 5.90,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1589119908995-c6837fa14848?q=80&w=2080&auto=format&fit=crop'
  },
  {
    id: 'ds5',
    name: 'JTH Badami Halwa',
    description: 'Es una rica receta clásica de postre de zanahoria india hecha con harina de almendras, leche y azúcar.',
    price: 5.90,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1514517220017-8ce97a34a7b6?q=80&w=1974&auto=format&fit=crop'
  }
);
