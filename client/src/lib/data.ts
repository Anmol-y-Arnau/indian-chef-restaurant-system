import type { Category, MenuItem, Table } from "./types";

export const CATEGORIES: Category[] = [
  { id: 'menu_del_dia', label: 'Menú del Día', icon: '🍽️' },
  { id: 'starters', label: 'Entrantes y Chaats', icon: '🥟' },
  { id: 'salads', label: 'Ensaladas', icon: '🥗' },
  { id: 'tandoor', label: 'Especial Tandoor', icon: '🔥' },
  { id: 'veg_curry', label: 'Curry Vegetariano', icon: '🥦' },
  { id: 'chicken_curry', label: 'Curry de Pollo', icon: '🍗' },
  { id: 'fish_prawn_curry', label: 'Pescado y Gambas', icon: '🦐' },
  { id: 'lamb_curry', label: 'Curry Cordero', icon: '🍖' },
  { id: 'biryani', label: 'Biryani (Arroces)', icon: '🍚' },
  { id: 'sides', label: 'Guarniciones (Arroz/Pan)', icon: '🫓' },
  { id: 'wines', label: 'Vinos', icon: '🍷' },
  { id: 'drinks', label: 'Bebidas', icon: '🥤' },
  { id: 'beers', label: 'Cervezas', icon: '🍺' },
  { id: 'spirits', label: 'Copas', icon: '🥃' },
  { id: 'coffees', label: 'Cafés', icon: '☕' },
  { id: 'desserts', label: 'Postres', icon: '🍰' },
];

export const MENU_ITEMS: MenuItem[] = [
  // MENÚ DEL DÍA
  {
    id: 'menu1',
    number: 0,
    name: 'Menú del Día',
    description: 'Entrante a elegir + Butter Chicken, Dal Makhni, Jeera Rice, Garlic Naan y ensalada + Bebida a elegir. (Postre o café se añade después)',
    price: 15.90,
    category: 'menu_del_dia',
    isVeg: false,
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/99644924/WzNUPpTsWu5Uc4xnu9Kr5J/menu-del-dia-GNhXB6JfXghk6xKhYa3yZ3.webp'
  },

  // VEGETARIAN STARTERS AND CHAATS
  {
    id: 'st1',
    number: 1,
    name: 'Chaat Samosa',
    description: 'Samosas casera al estilo de la vieja Delhi. (2 UN)',
    price: 6.90,
    category: 'starters',
    isVeg: true,
    image: '/images/menu/chaat_samosa.jpg'
  },
  {
    id: 'st2',
    number: 2,
    name: 'Mix Vege Pakora',
    description: 'Seis piezas de Pakora con cebolla, patatas, espinacas, mezcladas con especias molidas. Servido con salsa de tamarindo. (6 UN)',
    price: 6.90,
    category: 'starters',
    isVeg: true,
    image: '/images/menu/mix_vege_pakora.jpg'
  },
  {
    id: 'st3',
    number: 3,
    name: 'Amritsar Paneer Pakora',
    description: 'Queso natural elaborado con queso creado en el norte de la India, Amritsar. Con tempura de harina de garbanzo y arroz. (6 UN)',
    price: 9.90,
    category: 'starters',
    isVeg: true,
    image: '/images/menu/paneer_pakora.jpg'
  },
  {
    id: 'st4',
    number: 4,
    name: 'Royal king para dos personas',
    description: 'Surtido variado entrante para dos personas.',
    price: 15.90,
    category: 'starters',
    isVeg: false,
    image: '/images/menu/mixed_grill.jpg'
  },
  {
    id: 'st5',
    number: 5,
    name: 'Royal Prawn Pakora',
    description: 'Gambas en tempura, rebozado con harina de garbanzos y lenteja, servido con indian piri piri sauce.',
    price: 12.90,
    category: 'starters',
    isVeg: false,
    image: '/images/menu/prawn_pakora.jpg'
  },
  {
    id: 'st6',
    number: 6,
    name: 'Fish Pakora',
    description: 'Pescado frito, elaborado con la forma de madraz, rebozado con harina de garbanzos y arroz. (6 UN)',
    price: 10.90,
    category: 'starters',
    isVeg: false,
    image: '/images/menu/fish_pakora.jpg'
  },
  {
    id: 'st7',
    number: 7,
    name: 'Murg Pakora',
    description: 'Tiras de pollo rebozadas marinadas con especias y harina de garbanzos, frito, crujiente. Servido con ensalada. (6 UN)',
    price: 9.90,
    category: 'starters',
    isVeg: false,
    image: '/images/menu/chicken_pakora.jpg'
  },

  // SALADS
  {
    id: 'sl1',
    number: 8,
    name: 'Indian Prawns Salad',
    description: 'Ensalada de temporada, con gambas en la tempura, con harina de garbanzos y arroz. Servida con vinagreta de mango y frutos secos.',
    price: 12.90,
    category: 'salads',
    isVeg: false,
    image: '/images/menu/indian_prawns_salad.jpg'
  },
  {
    id: 'sl2',
    number: 9,
    name: 'Crispy Chicken Salad',
    description: 'Brotes verde de temporada, verduras confitadas y pollo, cocinado con el tandoor. Servido con salsa blanca de yogur.',
    price: 8.90,
    category: 'salads',
    isVeg: false,
    image: '/images/menu/crispy_chicken_salad.jpg'
  },
  {
    id: 'sl3',
    number: 10,
    name: 'Mix Green Salad',
    description: 'Ensalada verde.',
    price: 5.90,
    category: 'salads',
    isVeg: true,
    image: '/images/menu/dt4omQQMmAaG.jpg'
  },

  // SPECIAL TANDOOR
  {
    id: 'td1',
    number: 11,
    name: 'Murg Tandoori',
    description: 'Pollo con especias naturales y preparado con tandoori horno.',
    price: 11.90,
    category: 'tandoor',
    isVeg: false,
    image: '/images/menu/murg_tandoori.jpg'
  },
  {
    id: 'td2',
    number: 12,
    name: 'Tandoori Paneer Tikka',
    description: 'Queso natural, elaborado con la antigüedad de los mongoles de la india, en tandoor.',
    price: 14.90,
    category: 'tandoor',
    isVeg: true,
    image: '/images/menu/tandoori_paneer_tikka.jpg'
  },
  {
    id: 'td3',
    number: 13,
    name: 'Tandori Fish Tikka',
    description: 'Un pescado tierno marinado en un tandoori masala indio clásico y crujiente a la perfección.',
    price: 15.90,
    category: 'tandoor',
    isVeg: false,
    image: '/images/menu/fish_tikka.jpg'
  },
  {
    id: 'td4',
    number: 14,
    name: 'Murg Tikka',
    description: 'Pierna de pollo con especias naturales y preparado con tandoori horno.',
    price: 11.90,
    category: 'tandoor',
    isVeg: false,
    image: '/images/menu/chicken_tikka.jpg'
  },
  {
    id: 'td5',
    number: 15,
    name: 'Sugerencias del chef',
    description: 'Tandoori mix grill para dos personas.',
    price: 30.00,
    category: 'tandoor',
    isVeg: false,
    image: '/images/menu/mixed_grill.jpg'
  },
  {
    id: 'td6',
    number: 16,
    name: 'Prawn Tandoori',
    description: 'Plato del Tandoori de gambas.',
    price: 11.90,
    category: 'tandoor',
    isVeg: false,
    image: '/images/menu/prawn_tandoori.jpg'
  },
  {
    id: 'td7',
    number: 17,
    name: 'Tandoori Pulpo',
    description: 'Pulpo marinado con especias indias y cocinado en horno tandoor.',
    price: 22.90,
    category: 'tandoor',
    isVeg: false,
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/SYwVFuDKYlfTZDfs.png'
  },

  // VEG AND VEGAN CURRY
  {
    id: 'vc1',
    number: 18,
    name: 'Sabzi bhaji',
    description: 'Verduras mixtas de la temporada, con queso natural de la india. Cocinado con la manera del chef.',
    price: 9.90,
    category: 'veg_curry',
    isVeg: true,
    image: '/images/menu/sabzi_bhaji.jpg'
  },
  {
    id: 'vc2',
    number: 19,
    name: 'Bhaji Mix',
    description: 'Verduras mixtas de la temporada, cocinado con la manera del chef.',
    price: 8.90,
    category: 'veg_curry',
    isVeg: true,
    image: '/images/menu/sabzi_bhaji.jpg'
  },
  {
    id: 'vc3',
    number: 20,
    name: 'Mutter Paneer',
    description: 'Un guiso de queso natural con guisantes del campo, acompañada de salsa curry y servido con cilantro fresco.',
    price: 9.90,
    category: 'veg_curry',
    isVeg: true,
    image: '/images/menu/mutter_paneer.jpg'
  },
  {
    id: 'vc4',
    number: 21,
    name: 'Palak Paneer',
    description: 'Queso Natural cocinado con espinacas frescas al estilo Patiala.',
    price: 10.90,
    category: 'veg_curry',
    isVeg: true,
    image: '/images/menu/palak_paneer.jpg'
  },
  {
    id: 'vc5',
    number: 22,
    name: 'Paneer Burji',
    description: 'Queso rallado salteado con especias, especialidad Indian Chef.',
    price: 15.90,
    category: 'veg_curry',
    isVeg: true,
    image: '/images/menu/paneer_burji.jpg'
  },
  {
    id: 'vc6',
    number: 23,
    name: 'Dal Makhni',
    description: 'Lentejas negras guisadas con mantequilla y nata.',
    price: 9.90,
    category: 'veg_curry',
    isVeg: true,
    image: '/images/menu/dal_makhani.jpg'
  },
  {
    id: 'vc7',
    number: 24,
    name: 'Dal Tadka',
    description: 'Lentejas con especias naturales y preparado con tandoori horno.',
    price: 9.90,
    category: 'veg_curry',
    isVeg: true,
    image: '/images/menu/dal_tadka.jpg'
  },
  {
    id: 'vc8',
    number: 25,
    name: 'Chana Masala',
    description: 'Garbanzos de la casa, en salsas de cebolla y tomate, agridulce.',
    price: 9.90,
    category: 'veg_curry',
    isVeg: true,
    image: '/images/menu/chana_masala.jpg'
  },

  // CHICKEN CURRY
  {
    id: 'cc1',
    number: 26,
    name: 'Murg Curry',
    description: 'Pollo picado, cocinado con cebolla, tomate y comino en polvo. (Preferente picante)',
    price: 11.90,
    category: 'chicken_curry',
    isVeg: false,
    isSpicy: true,
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/BKhusaIKMITJSoHX.png'
  },
  {
    id: 'cc2',
    number: 27,
    name: 'Murg Korma',
    description: 'Pollo en cubitos cocinado con cebolla, frutas secos y salsa rica en crema.',
    price: 11.90,
    category: 'chicken_curry',
    isVeg: false,
    image: '/images/menu/murg_korma.jpg'
  },
  {
    id: 'cc3',
    number: 28,
    name: 'Murg Rogan Josh',
    description: 'Pollo picado, con pimientos verdes, rojos, jeera, jengibres y ajo. (Preferente picante)',
    price: 11.90,
    category: 'chicken_curry',
    isVeg: false,
    isSpicy: true,
    image: '/images/menu/murg_rogan_josh.jpg'
  },
  {
    id: 'cc4',
    number: 29,
    name: 'Murg Tikka Masala',
    description: 'El pollo tikka masala es un plato de curry que consiste en pollo tikka y una espesa salsa de naranja hecha con puré de tomate, yogur, jengibre y una mezcla de especias llamada masala. (Preferente picante)',
    price: 11.90,
    category: 'chicken_curry',
    isVeg: false,
    isSpicy: true,
    image: '/images/menu/murg_tikka_masala.jpg'
  },
  {
    id: 'cc5',
    number: 30,
    name: 'Murg Karahi',
    description: 'Es un plato de pollo, picante preferente, ahumado y lleno de sabor, con una espesa salsa, cebolla y un pimiento asado crujiente.',
    price: 11.90,
    category: 'chicken_curry',
    isVeg: false,
    isSpicy: true,
    image: '/images/menu/murg_karahi.jpg'
  },
  {
    id: 'cc6',
    number: 31,
    name: 'Murg Butter',
    description: 'Un plato clásico donde el pollo se hace a la manera Tandoori, se cuece a fuego lento en una salsa de tomate picante (preferente al gusto), aromática, mantecosa, y cremosa.',
    price: 11.90,
    category: 'chicken_curry',
    isVeg: false,
    image: '/images/menu/butter_chicken.jpg'
  },
  {
    id: 'cc7',
    number: 32,
    name: 'Murg Vindaloo',
    description: 'El vindaloo es denominado a veces como el rey de los currys por su fuerza en el picante. Te proponemos probar esta receta de curry de pollo picante.',
    price: 12.90,
    category: 'chicken_curry',
    isVeg: false,
    isSpicy: true,
    image: '/images/menu/murg_vindaloo.jpg'
  },

  // FISH & PRAWN CURRY
  {
    id: 'fish_curry',
    number: 33,
    name: 'Fish Curry',
    description: 'Pescado fresco con salsa de tomate, especias y hierbas.',
    price: 14.90,
    category: 'fish_prawn_curry',
    image: '/images/menu/fish_curry.jpg'
  },
  {
    id: 'fish_vandalo',
    number: 34,
    name: 'Fish Vandalo',
    description: 'El plato que se origina en la región costera de Goa. La salsa intensa con sabor a curry de la pasta vindaloo casera le da a esta receta de curry de pescado su sabor picante y ácido.',
    price: 13.90,
    category: 'fish_prawn_curry',
    image: '/images/menu/fish_vandalo.jpg',
    isSpicy: true
  },
  {
    id: 'gamba_curry',
    number: 35,
    name: 'Gamba Curry',
    description: 'Gambas preparadas en salsa de aromáticas especias, tomate y jengibre.',
    price: 15.90,
    category: 'fish_prawn_curry',
    image: '/images/menu/gamba_curry.jpg'
  },
  {
    id: 'gamba_korma',
    number: 36,
    name: 'Gamba Korma',
    description: 'Gambas en curry de sabor suave preparado con salsa de yogur, azafrán, almendras y coco.',
    price: 15.90,
    category: 'fish_prawn_curry',
    image: '/images/menu/gamba_korma.jpg'
  },

  // LAMB CURRY
  {
    id: 'lamb_curry',
    number: 37,
    name: 'Lamb Curry',
    description: 'Este auténtico curry indio de cabrito está elaborado con paletilla de cabrito se cuece a fuego lento con especias aromáticas, cebollas caramelizadas y yogur griego hasta que esté tierno. (Preferent picante)',
    price: 15.90,
    category: 'lamb_curry',
    image: '/images/menu/lamb_curry.jpg',
    isSpicy: true
  },
  {
    id: 'lamb_rogan_josh',
    number: 38,
    name: 'Lamb Rogan Josh',
    description: 'Deliciosos estofado de cabrito al curry con jengibre, tomate, cilantro fresco y pimentón dulce. (Preferente picante)',
    price: 15.90,
    category: 'lamb_curry',
    image: '/images/menu/lamb_rogan_josh.jpg',
    isSpicy: true
  },
  {
    id: 'lamb_karahi',
    number: 39,
    name: 'Lamb Karahi',
    description: 'Cabrito troceado cocinado con cebolla, pimientos y frutos secos. (Preferente picante)',
    price: 16.90,
    category: 'lamb_curry',
    image: '/images/menu/lamb_karahi.jpg',
    isSpicy: true
  },

  // BIRYANI (ARROCES)
  {
    id: 'bi1',
    number: 40,
    name: 'Mix Veg Biryani',
    description: 'Plato clásico de la india cocinando a fuego lento con arroz Basmati salteado y frito con verdura fresca, tomate, jengibre, cardamomo, azafrán y selectas especias.',
    price: 10.90,
    category: 'biryani',
    isVeg: true,
    image: '/images/menu/TQe8u2sibGiG.jpg'
  },
  {
    id: 'bi2',
    number: 41,
    name: 'Mix Biryani',
    description: 'Nuestro plato especial con Arroz basmati y la mezcla de carne, pollo, corderito, gambas y especias aromáticas.',
    price: 15.90,
    category: 'biryani',
    isVeg: false,
    image: '/images/menu/TQe8u2sibGiG.jpg'
  },
  {
    id: 'bi3',
    number: 42,
    name: 'Murg Biryani',
    description: 'Arroz Basmati con pollo, menta fresca, cilantro fresco, pasta de ajo, jengibre, cúrcuma, cebolla y especias.',
    price: 12.90,
    category: 'biryani',
    isVeg: false,
    image: '/images/menu/TQe8u2sibGiG.jpg'
  },
  {
    id: 'bi4',
    number: 43,
    name: 'Lamb Biryani',
    description: 'Arroz Basmati con corderito fresco, menta fresca, cilantro fresco, pasta de ajo, jengibre, cúrcuma, cebolla y especias.',
    price: 14.90,
    category: 'biryani',
    isVeg: false,
    image: '/images/menu/TQe8u2sibGiG.jpg'
  },
  {
    id: 'bi5',
    number: 44,
    name: 'Gamba Biryani',
    description: 'Arroz Basmati con gambas, tomate, jengibre y azafrán, condimentado con especias aromáticas.',
    price: 15.90,
    category: 'biryani',
    isVeg: false,
    image: '/images/menu/TQe8u2sibGiG.jpg'
  },
  {
    id: 'bi6',
    number: 45,
    name: 'Fish Biryani',
    description: 'Fish biryani es un plato de arroz en capas elaborado con pescado, arroz basmati, especias y hierbas.',
    price: 15.90,
    category: 'biryani',
    isVeg: false,
    image: '/images/menu/TQe8u2sibGiG.jpg'
  },

  // GUARNICIONES (ARROZ)
  {
    id: 'sd1',
    number: 46,
    name: 'Plain Rice',
    description: 'Arroz Basmati blanco con aromas agradables y rico en nutrientes cultivado en las montañas del Himalaya.',
    price: 3.90,
    category: 'sides',
    isVeg: true,
    image: '/images/menu/kMSjnBlbuR3p.jpg'
  },
  {
    id: 'sd2',
    number: 47,
    name: 'Pulao Rice',
    description: 'Arroz Basmati aromatizado con especias como el cardamomo, clavo, comino y hoja de laurel.',
    price: 4.90,
    category: 'sides',
    isVeg: true,
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/sKDzYwWgGEvOUSiz.png'
  },
  {
    id: 'sd3',
    number: 48,
    name: 'Jeera Rice',
    description: 'El arroz jeera es un plato indio que consiste en arroz y semillas de comino.',
    price: 4.90,
    category: 'sides',
    isVeg: true,
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/zJhqszzuFWFYZHTI.png'
  },
  {
    id: 'sd4',
    number: 49,
    name: 'Egg Rice',
    description: 'El arroz muy popular que se prepara con masales indias y termina con un poco de salsa de soya para darle sabor.',
    price: 5.90,
    category: 'sides',
    isVeg: false,
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/glQeiuShEhXEkKHW.png'
  },
  {
    id: 'sd5',
    number: 50,
    name: "Lahori jarda's Rice",
    description: 'Es un plato tradicional de arroz dulce hervido, originario del subcontinente indio, elaborado con azafrán, leche y azúcar, y aromatizado con cardamomo, pasas, pistachos o almendras.',
    price: 5.90,
    category: 'sides',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=1925&auto=format&fit=crop'
  },

  // GUARNICIONES (PAN)
  {
    id: 'pn1',
    number: 51,
    name: 'Plain Naan',
    description: 'Pan de harina de trigo cocinado en horno Tandoor.',
    price: 3.90,
    category: 'sides',
    isVeg: true,
    image: '/images/menu/CUgKMafxMSwp.jpg'
  },
  {
    id: 'pn2',
    number: 52,
    name: 'Garlic Naan',
    description: 'Pan de harina de trigo con rodajas de ajo y cilantro.',
    price: 4.90,
    category: 'sides',
    isVeg: true,
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/tpdKlcxlBMCdsYNj.png'
  },
  {
    id: 'pn3',
    number: 53,
    name: 'Aloo Naan',
    description: 'Pan relleno de patatas con una textura crujiente y sutil.',
    price: 4.90,
    category: 'sides',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?q=80&w=1976&auto=format&fit=crop'
  },
  {
    id: 'pn4',
    number: 54,
    name: 'Cheese Naan',
    description: 'Pan relleno de queso natural.',
    price: 4.90,
    category: 'sides',
    isVeg: true,
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/zoqoeexOMMVvBDfa.png'
  },
  {
    id: 'pn5',
    number: 55,
    name: 'Kirma Naan',
    description: 'Pan relleno de carne picada y algunas especias con predominancia de comino y cúrcuma.',
    price: 4.90,
    category: 'sides',
    isVeg: false,
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/SBGPHAubJkvudtOO.png'
  },
  {
    id: 'pn6',
    number: 56,
    name: 'Kulcha Naan',
    description: '',
    price: 4.90,
    category: 'sides',
    isVeg: true,
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/fWyTpXkYigWaueZr.png'
  },
  {
    id: 'pn7',
    number: 57,
    name: 'Butter Naan',
    description: 'Pan de harina de trigo con un toque de mantequilla.',
    price: 4.90,
    category: 'sides',
    isVeg: true,
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/NRuplGeVsNKipCqw.png'
  },
  {
    id: 'pn8',
    number: 58,
    name: 'Kashmiri Naan',
    description: 'Pan de harina de trigo con especias y frutos secos.',
    price: 4.90,
    category: 'sides',
    isVeg: true,
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/zPMwjzBNWMIecdaV.png'
  },

  // VINOS
  {
    id: 'wn1',
    number: 59,
    name: 'Bufar i Fer Ampollas Negre',
    description: 'Tinto',
    price: 12.00,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn2',
    number: 60,
    name: 'Cecios',
    description: 'Tinto',
    price: 15.00,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn3',
    number: 61,
    name: 'Pasarell',
    description: 'Tinto',
    price: 17.00,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn4',
    number: 62,
    name: 'Parica Criança',
    description: 'Tinto',
    price: 16.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn5',
    number: 63,
    name: 'Marques de Cáceres Negre',
    description: 'Tinto',
    price: 18.00,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn6',
    number: 64,
    name: 'Viña Pomal',
    description: 'Tinto',
    price: 26.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn7',
    number: 65,
    name: 'Marqués de Murrieta',
    description: 'Tinto',
    price: 31.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn8',
    number: 66,
    name: 'Sangre de Toro',
    description: 'Tinto',
    price: 13.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn9',
    number: 67,
    name: 'Valdubón Roble',
    description: 'Tinto',
    price: 17.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn10',
    number: 68,
    name: 'El Coto',
    description: 'Tinto',
    price: 15.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn11',
    number: 69,
    name: 'Torres de Casta',
    description: 'Rosé & Riesling',
    price: 12.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1559563362-c667ba5f5480?q=80&w=2002&auto=format&fit=crop'
  },
  {
    id: 'wn12',
    number: 70,
    name: 'Bufar i Fer Ampolles Rosado',
    description: 'Rosé & Riesling',
    price: 12.00,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1559563362-c667ba5f5480?q=80&w=2002&auto=format&fit=crop'
  },
  {
    id: 'wn13',
    number: 71,
    name: 'Daina',
    description: 'Rosé & Riesling',
    price: 15.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1559563362-c667ba5f5480?q=80&w=2002&auto=format&fit=crop'
  },
  {
    id: 'wn14',
    number: 72,
    name: 'Marqués de Cáceres Rosado',
    description: 'Rosé & Riesling',
    price: 15.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1559563362-c667ba5f5480?q=80&w=2002&auto=format&fit=crop'
  },
  {
    id: 'wn15',
    number: 73,
    name: 'Bufar i Fer Ampollas',
    description: 'Blanco',
    price: 12.00,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn16',
    number: 74,
    name: 'Mabre',
    description: 'Blanco',
    price: 17.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn17',
    number: 75,
    name: 'Marqués De Cáceres Blanco',
    description: 'Blanco',
    price: 16.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn18',
    number: 76,
    name: 'Viña Sol',
    description: 'Blanco',
    price: 14.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn19',
    number: 77,
    name: 'El Coto',
    description: 'Blanco',
    price: 15.90,
    category: 'wines',
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'wn_copa',
    number: 78,
    name: 'Copa de Vino',
    description: 'Vino de la casa (Tinto/Blanco/Rosado)',
    price: 3.50,
    category: 'wines',
    isVeg: true,
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/zqKDiaHHCOZUHvCF.png'
  },
];

export const INITIAL_TABLES: Table[] = [
  { id: '0+', name: 'Mesa 0+', status: 'free', orders: [], guests: 0 },
  { id: '0-', name: 'Mesa 0-', status: 'free', orders: [], guests: 0 },
  ...Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Mesa ${i + 1}`,
    status: 'free' as const,
    orders: [],
    guests: 0
  })),
  { id: 'TAKEAWAY', name: 'TAKEAWAY', status: 'free', orders: [], guests: 0 },
];

// BEBIDAS
MENU_ITEMS.push(
  {
    id: 'dr1',
    number: 79,
    name: 'Refresco',
    description: 'Coca-Cola, Fanta, Sprite, etc.',
    price: 3.50,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'dr15',
    number: 80,
    name: 'Agua con Gas',
    description: 'Agua mineral con gas',
    price: 3.50,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=1888&auto=format&fit=crop'
  },
  {
    id: 'dr16',
    number: 81,
    name: 'Coca-Cola',
    description: 'Refresco de cola',
    price: 3.50,
    category: 'drinks',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/hXcLyxFbamSPXGZv.png'
  },
  {
    id: 'dr17',
    number: 82,
    name: 'Coca-Cola Zero',
    description: 'Refresco de cola sin azúcar',
    price: 3.50,
    category: 'drinks',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/hXcLyxFbamSPXGZv.png'
  },
  {
    id: 'dr18',
    number: 83,
    name: 'Nestea',
    description: 'Té helado con limón',
    price: 3.50,
    category: 'drinks',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/hXcLyxFbamSPXGZv.png'
  },
  {
    id: 'dr19',
    number: 84,
    name: 'Fanta Naranja',
    description: 'Refresco de naranja',
    price: 3.50,
    category: 'drinks',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/hXcLyxFbamSPXGZv.png'
  },
  {
    id: 'dr20',
    number: 85,
    name: 'Fanta Limón',
    description: 'Refresco de limón',
    price: 3.50,
    category: 'drinks',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/hXcLyxFbamSPXGZv.png'
  },
  {
    id: 'dr21',
    number: 86,
    name: 'Aquarius Naranja',
    description: 'Bebida isotónica de naranja',
    price: 3.50,
    category: 'drinks',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/hXcLyxFbamSPXGZv.png'
  },
  {
    id: 'dr22',
    number: 87,
    name: 'Aquarius Limón',
    description: 'Bebida isotónica de limón',
    price: 3.50,
    category: 'drinks',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/KOVqamOZikCGxGhN.png'
  },
  {
    id: 'dr23',
    number: 88,
    name: 'Schweppes Tónica',
    description: 'Tónica Schweppes',
    price: 3.50,
    category: 'drinks',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/lYwmRRVZdJIaiAww.png'
  },
  {
    id: 'dr24',
    number: 89,
    name: 'Sprite',
    description: 'Refresco de limón y lima',
    price: 3.50,
    category: 'drinks',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/lvAgSdKKUKGhRjiU.png'
  },
  {
    id: 'dr2',
    number: 98,
    name: 'Caña',
    description: 'Cerveza de barril',
    price: 3.00,
    category: 'beers',
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'dr25',
    number: 99,
    name: 'Jarra',
    description: 'Cerveza de barril 50cl',
    price: 5.50,
    category: 'beers',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/tPEFRmluOHGeNWrU.png'
  },
  {
    id: 'dr3',
    number: 100,
    name: 'Estrella (Botella)',
    description: 'Cerveza Estrella Galicia',
    price: 3.50,
    category: 'beers',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'dr12',
    number: 101,
    name: 'Free Damm',
    description: 'Cerveza sin alcohol tostada',
    price: 3.50,
    category: 'beers',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/SEXdlwDjlJXDnEJs.png'
  },
  {
    id: 'dr13',
    number: 102,
    name: 'Damm Lemon',
    description: 'Clara con limón',
    price: 3.50,
    category: 'beers',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/rgdIdTsclbpPXSHd.png'
  },
  {
    id: 'dr14',
    number: 103,
    name: 'Voll Damm',
    description: 'Cerveza doble malta',
    price: 3.50,
    category: 'beers',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/aCXUbCUPPmOAyfJP.png'
  },
  {
    id: 'dr4',
    number: 104,
    name: 'Cobra',
    description: 'Cerveza India Premium',
    price: 4.00,
    category: 'beers',
    image: '/images/menu/uC7Dx3XnvFWj.jpg'
  },
  {
    id: 'dr5',
    number: 105,
    name: 'Agua Pequeña',
    description: 'Agua mineral 33cl',
    price: 3.00,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=1888&auto=format&fit=crop'
  },
  {
    id: 'dr6',
    number: 106,
    name: 'Agua Grande',
    description: 'Agua mineral 1L',
    price: 4.00,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=1888&auto=format&fit=crop'
  },
  {
    id: 'dr8',
    number: 107,
    name: 'Mango Lassi',
    description: 'Bebida tradicional de yogur y mango',
    price: 4.50,
    category: 'drinks',
    image: '/images/menu/dYIQBU0DunUn.jpg'
  },
  {
    id: 'dr9',
    number: 108,
    name: 'Indian Chai',
    description: 'Té indio con especias y leche',
    price: 2.50,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=1974&auto=format&fit=crop'
  },
  {
    id: 'dr11',
    number: 109,
    name: 'Infusiones',
    description: 'Manzanilla, menta, tila, etc.',
    price: 2.50,
    category: 'drinks',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/oKrTjQgTbhYqhmPd.png'
  }
);

// COPAS
MENU_ITEMS.push(
  {
    id: 'dr10',
    number: 110,
    name: 'Chupito',
    description: 'Licor de hierbas, crema, etc.',
    price: 2.50,
    category: 'spirits',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/hFhRjnTYwkctXwkp.png'
  },
  {
    id: 'sp1',
    number: 111,
    name: 'Copa de Baileys',
    description: 'Licor de crema irlandesa',
    price: 5.00,
    category: 'spirits',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/nDYrGeRoCdloaUKf.png'
  },
  {
    id: 'sp2',
    number: 112,
    name: 'Copa de Ratafia',
    description: 'Licor de hierbas catalán',
    price: 4.50,
    category: 'spirits',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/EXMEFQzUWJMMWrlk.png'
  },
  {
    id: 'sp3',
    number: 113,
    name: 'Copa de Licor',
    description: 'Licor a elegir (Brandy, Whisky, Ron, etc.)',
    price: 4.50,
    category: 'spirits',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/XJuFzAlEjfscPddS.png'
  },
  {
    id: 'sp4',
    number: 114,
    name: 'Cubata',
    description: 'Combinado a elegir (Gin, Ron, Vodka, Whisky...)',
    price: 7.00,
    category: 'spirits',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/OIerlJtWzvwWsDtH.png'
  },
  {
    id: 'sp5',
    number: 115,
    name: 'Copa de Cava',
    description: 'Cava brut o semiseco',
    price: 4.00,
    category: 'spirits',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/zqKDiaHHCOZUHvCF.png'
  }
);

// CAFÉS
MENU_ITEMS.push(
  {
    id: 'cf1',
    number: 116,
    name: 'Café Solo',
    description: 'Espresso',
    price: 1.80,
    category: 'coffees',
    image: '/images/menu/NdmVjKVEDhZc.jpg'
  },
  {
    id: 'cf2',
    number: 117,
    name: 'Cortado',
    description: 'Espresso con un poco de leche',
    price: 2.00,
    category: 'coffees',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1887&auto=format&fit=crop'
  },
  {
    id: 'cf3',
    number: 118,
    name: 'Café con Leche',
    description: 'Café con leche grande',
    price: 2.50,
    category: 'coffees',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/fQCDMXgQZfdzyemW.png'
  },
  {
    id: 'cf4',
    number: 119,
    name: 'Carajillo',
    description: 'Café con licor (Brandy/Whisky/Ron)',
    price: 4.50,
    category: 'coffees',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/NkZLJjwYGFfCqyQu.png'
  },
  {
    id: 'cf5',
    number: 120,
    name: 'Café Solo con Hielo',
    description: 'Espresso servido con hielo',
    price: 2.20,
    category: 'coffees',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/WnnivcFGWfvkOIED.png'
  },
  {
    id: 'cf6',
    number: 121,
    name: 'Cortado con Hielo',
    description: 'Cortado servido con hielo',
    price: 2.20,
    category: 'coffees',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/lllbpMJKqiELQHSx.png'
  }
);

// POSTRES
MENU_ITEMS.push(
  {
    id: 'ds1',
    number: 122,
    name: 'Kesar Kheer',
    description: 'Arroz cocinado con leche y azafrán, servido con helado de vainilla.',
    price: 4.90,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'ds2',
    number: 123,
    name: 'Mix Indian Sweet',
    description: 'Surtido de pasteles de la india, cocinado especialmente por el chef.',
    price: 8.90,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1589119908995-c6837fa14848?q=80&w=2080&auto=format&fit=crop'
  },
  {
    id: 'ds3',
    number: 124,
    name: 'Haridwari Gulab jamun',
    description: 'Gulab jamun caliente.',
    price: 4.90,
    category: 'desserts',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/NUmaucLVQhFQRjJZ.png'
  },
  {
    id: 'ds4',
    number: 125,
    name: 'Bikaneri Sponge Rashgula',
    description: 'Postre de leche requesón natural indio, en almíbar de azúcar.',
    price: 5.90,
    category: 'desserts',
    image: 'https://files.manuscdn.com/user_upload_by_module/session_file/99644924/BInFKpOgrqrDcPFr.png'
  },
  {
    id: 'ds5',
    number: 126,
    name: 'JTH Badami Halwa',
    description: 'Es una rica receta clásica de postre de zanahoria india hecha con harina de almendras, leche y azúcar.',
    price: 5.90,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1514517220017-8ce97a34a7b6?q=80&w=1974&auto=format&fit=crop'
  }
);
