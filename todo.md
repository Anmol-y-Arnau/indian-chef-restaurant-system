# Indian Chef - Sistema de Gestión de Mesas

## Funcionalidades Completadas

- [x] Sistema de gestión de mesas con 100+ productos del menú
- [x] Toma de pedidos por mesa
- [x] Cálculo automático de totales
- [x] Generación de tiquets
- [x] Compartir pedidos por WhatsApp
- [x] Copiar pedido al portapapeles
- [x] Historial de ventas con recuperación de pedidos
- [x] Entrada rápida de pedidos por números (formato: "1, 2, 3" o "10x2")
- [x] Productos personalizados ("Varios") con selección de cantidad
- [x] Diseño responsive para móviles
- [x] Botones de acción fijos en la parte inferior
- [x] Mesas especiales "0+" y "0-"
- [x] Sistema multiidioma (Español, Inglés, Francés)
- [x] Selector de idioma con banderas
- [x] Interfaz completamente traducida
- [x] PWA (Progressive Web App) para uso offline
- [x] **Arquitectura full-stack con base de datos centralizada**
- [x] **Sincronización en tiempo real entre dispositivos (polling cada 3 segundos)**
- [x] **API endpoints con tRPC para gestión de mesas y pedidos**
- [x] **Tests automatizados para verificar funcionalidad**

## Pendiente

- [ ] Traducir todos los productos del menú a inglés y francés (actualmente solo la interfaz está traducida)
- [ ] Verificar sincronización multi-dispositivo en producción
- [ ] Optimizar imágenes del menú para mejor rendimiento
- [ ] Añadir indicadores visuales de sincronización en tiempo real
- [ ] Implementar notificaciones cuando otros dispositivos modifican pedidos

## Notas Técnicas

### Arquitectura
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express + tRPC
- **Base de datos**: MySQL/TiDB con Drizzle ORM
- **Sincronización**: Polling automático cada 3 segundos
- **PWA**: Capacidades offline con Service Worker

### Tablas de Base de Datos
1. `restaurant_tables`: Estado de cada mesa (libre, ocupada, reservada)
2. `orders`: Pedidos activos en cada mesa
3. `sales`: Historial de ventas completadas

### Sincronización en Tiempo Real
- Múltiples dispositivos pueden ver y modificar pedidos simultáneamente
- Los cambios se reflejan automáticamente en todos los dispositivos conectados
- Polling cada 3 segundos para actualizaciones de mesas y pedidos
- Polling cada 5 segundos para historial de ventas

## Bugs Reportados

- [x] Eliminar indicador lila que aparece en mesas vacías (0+, 0-, 1, 2, 3) - solo debería mostrarse en mesas con pedidos activos

## Mejoras UX Móvil en Progreso

- [x] Mover buscador, historial e idioma a la barra superior móvil (junto a menú y nombre de mesa)
- [x] Implementar hero dinámico que se oculta al hacer scroll (imagen y título Indian Chef)
- [x] Hacer la barra de categorías sticky cuando se hace scroll hacia abajo

- [x] Corregir z-index: números y precios de productos pasan por encima de la barra de categorías sticky

## Mejora de Imágenes del Menú

- [x] Revisar y actualizar todas las imágenes del menú para que coincidan con el producto real
- [x] Usar la misma imagen para productos similares (todos los naan, cervezas, cafés, etc.)
- [x] Asegurar que cada imagen representa correctamente el plato descrito

## Generación de Imágenes Únicas de Curry

- [x] Investigar cada plato de curry para entender sus características visuales específicas
- [x] Generar imágenes únicas con IA para cada curry (vegetariano, pollo, pescado/gambas, cordero)
- [x] Actualizar el menú con las nuevas imágenes específicas

## Generación de Imágenes Únicas - Entrantes, Ensaladas y Tandoor

- [x] Investigar características visuales de cada entrante (samosas, pakoras, etc.)
- [x] Investigar características visuales de cada ensalada
- [x] Investigar características visuales de cada plato tandoor
- [x] Generar imágenes únicas con IA para cada plato
- [x] Actualizar el menú con las nuevas imágenes específicas

## Optimización de Rendimiento

- [x] Comprimir todas las imágenes del menú para reducir peso y mejorar velocidad de carga (83% de reducción: 49MB → 8.3MB)

- [x] Implementar caché de imágenes con service worker para carga instantánea en visitas posteriores
- [x] Configurar estrategia de precaching para recursos estáticos

## Modo Vista de Cocina

- [x] Crear componente KitchenView para vista dedicada de cocina
- [x] Añadir botón "Modo Cocina" en menú deslizante móvil
- [x] Organizar pedidos por prioridad: entrantes arriba, platos principales medio, bebidas abajo
- [x] Mostrar pedidos ordenados de más antiguo a más reciente
- [x] Implementar botón "Entregado" para marcar pedidos completados
- [x] Diseño limpio enfocado solo en cocinar

- [x] Implementar notificación sonora cuando lleguen nuevos pedidos a la cocina

## Rediseño Modo Cocina KDS

- [x] Agrupar pedidos por mesa (todos los items de una mesa juntos)
- [x] Mesa arriba en grande y destacada
- [x] Texto de platos en letras grandes para ver desde lejos
- [x] Botón "Delivered" que elimina permanentemente la mesa completa
- [x] Organización: entrantes arriba, principales medio, bebidas abajo

## Seguimiento de Entrega por Plato Individual

- [x] Añadir botón pequeño al lado de cada plato para marcar como entregado individualmente
- [x] Estados visuales: platos pendientes brillan, platos entregados comprimidos y opacos
- [x] Mesas completadas no desaparecen, se van al final de la lista comprimidas
- [x] Botón "DELIVERED" general marca todos los platos como entregados
- [x] Ordenamiento dinámico: mesas con platos pendientes arriba, completadas abajo

## Bugs UX Móvil

- [x] Barra superior se oculta al hacer scroll - debe estar siempre visible
- [x] Vibración al buscar productos (scroll automático causa movimiento errático)
- [x] Botón "Varios / Personalizado" debe estar al final de la lista, no al principio

## Bugs Modo Cocina

- [x] Botón "Volver al Menú" no funciona - no se puede salir del modo cocina
- [x] Postres, cafés y té deben ir separados abajo como las bebidas (no son para cocinar)
- [x] Nuevos pedidos añadidos después de marcar "Entregado Todo" no aparecen como pendientes (se marcan automáticamente como entregados)
- [x] Estado de entrega debe persistir en base de datos, no solo en memoria local del navegador
- [x] Añadir toggle para deshacer entrega por error (pulsar plato entregado para volver a pendiente)
- [x] Ordenar pedidos por antigüedad (más antiguo primero) usando campo createdAt

## Ajustes Modo Cocina

- [x] Separar postres de bebidas - postres van en sección propia brillante para chef (entre mains y bebidas)
- [x] Bebidas, café y té van al final separados (solo para camarero)
- [x] Efecto prioridad (borde naranja) solo en sección de entrantes, no en toda la tarjeta
- [x] Eliminar animate-pulse que parpadea y duele a la vista
- [x] Cambiar "MESA" por "TABLE" para mejor comprensión de cocineros

- [x] Hacer botón "Volver al Menú" más sutil y menos obstructivo (más pequeño, menos contraste)

## Sistema de Pago Avanzado

- [x] Modal de pago al cerrar mesa con selección de método (Efectivo/Tarjeta/Mixto)
- [x] Opción para dividir cuenta entre X personas
- [x] En pago mixto, especificar cuántas personas pagan efectivo y cuántas tarjeta
- [x] Calcular y mostrar monto por persona según método de pago
- [x] Guardar método de pago en base de datos (tabla sales)
- [x] Mostrar resumen de pago antes de confirmar

## Bug Reportado

- [x] Botón individual de marcar como entregado en modo cocina no actualiza el estado (ejemplo: agua grande)

## Bug Crítico

- [x] NINGÚN botón de delivered funciona en modo cocina - Backend funciona correctamente (tests pasan)

- [x] Corregir error de accesibilidad: DialogContent requiere DialogTitle para lectores de pantalla

## Mejoras Historial de Ventas

- [x] Ordenar tickets de más reciente a más antiguo (invertir orden actual)
- [x] Añadir botón de calendario al lado del historial
- [x] Implementar filtro por fecha/rango de fechas
- [x] Vista de contabilidad con estadísticas:
  - Total del período seleccionado
  - Desglose: efectivo vs tarjeta
  - Número de tickets
  - Ticket promedio
  - Útil para cierre de caja
## Bug Reportado - Botones Delivered No Responden

- [x] Los botones de "delivered" en modo cocina no responden al hacer clic
- [x] Problema: KitchenView usaba datos del contexto que no se actualizaban inmediatamente
- [x] Solución: Crear queries propias en KitchenView con refetch() en lugar de invalidate()
- [x] Construir estructura de datos completa con menuItem desde MENU_ITEMS
- [x] Tests verificados: todos los tests de delivered.test.ts pasan correctamente


## Bug Reportado - Pedidos Duplicados Heredan Estado Delivered

- [ ] REABIERTO: El problema persiste en producción
- [ ] Ejemplo real: Mesa pide 4 plain naan → se entregan → mesa pide 1 más → en cocina aparecen 5 naan todos entregados
- [ ] La solución anterior no funcionó correctamente
- [ ] Necesita revisión profunda del flujo de addOrderToTable


## Nueva Funcionalidad - Botón Modo Cocina Visible

- [x] Añadir botón visible de "Modo Cocina" en la interfaz principal de ordenador
- [x] Posicionar el botón en un lugar accesible (header o barra superior)
- [x] Diseño coherente con el resto de la interfaz (naranja con icono ChefHat)
- [x] Añadidas traducciones en español, inglés y francés
- [x] Verificar que funciona correctamente en desktop


## Bug REABIERTO - Pedidos Duplicados Siguen Heredando Estado Delivered

- [x] El problema persiste: 4 plain naan entregados → se añade 1 más → aparecen 5 naan todos entregados
- [x] Causa: La lógica en el frontend usaba datos desactualizados del polling (3 segundos)
- [x] Solución: Mover la lógica al backend (restaurantDb.addOrder) para usar datos frescos de la DB
- [x] Backend ahora verifica si existe pedido pendiente antes de crear/actualizar
- [x] Tests creados y pasando: duplicate-orders-backend.test.ts (4/4 tests)
- [x] Verificado manualmente: 4 naan entregados + 1 nuevo = 2 pedidos separados en cocina


## Mejora UX - Agrupar Pedidos Entregados en Modo Cocina

- [x] Cuando hay múltiples pedidos del mismo item todos entregados, aparecen como líneas separadas
- [x] Ejemplo: 2 pedidos de "Plain Rice x1" entregados → deberían mostrarse como "Plain Rice x2"
- [x] Modificado categorizeTableOrders en KitchenView para agrupar pedidos entregados del mismo item
- [x] Los pedidos entregados del mismo item se agrupan sumando cantidades
- [x] Los pedidos pendientes se mantienen separados para que cada uno tenga su propio botón de entrega
- [x] Verificado: 2 Plain Rice entregados se muestran como "Plain Rice x2"


## Nueva Funcionalidad - Ordenar Pedidos por Categoría del Menú

- [x] Los pedidos actualmente se muestran en el orden en que fueron añadidos
- [x] Implementar ordenación según el orden de las categorías del menú
- [x] Orden deseado: Entrantes → Ensaladas → Tandoor → Currys (veg, pollo, pescado, cordero) → Biryani → Guarniciones → Vinos → Bebidas → Cafés → Postres
- [x] Creada función de utilidad sortOrdersByCategory en lib/orderUtils.ts
- [x] Aplicada ordenación en el panel lateral de la mesa (OrderPanel.tsx)
- [x] Aplicada ordenación en el modo cocina (KitchenView.tsx)
- [x] Aplicada ordenación en el ticket de impresión (handlePrint y getTicketText)
- [x] Tests creados y pasando: order-sorting.test.ts (5/5 tests)


## Nueva Funcionalidad - Modal de Personalización para Curry y Biryani

- [x] Al añadir platos de curry o biryani, mostrar modal de personalización
- [x] Modal incluye 4 botones para nivel de picante: - (no picante), +- (toque picante), + (picante), ++ (muy picante)
- [x] Campo de texto para observaciones adicionales implementado
- [x] Actualizado esquema de base de datos con campos spiceLevel y notes
- [x] Personalizaciones guardadas correctamente en la base de datos
- [x] Personalizaciones mostradas en el panel lateral con iconos 🌶️ y 📝
- [x] Personalizaciones mostradas en el modo cocina
- [x] Personalizaciones incluidas en los tickets de impresión
- [x] Verificado: modal funciona correctamente, datos se guardan y muestran en todas las vistas


## Nueva Funcionalidad - Notificación Sonora Inteligente en Modo Cocina

- [x] Añadir sonido cuando se añaden productos de comida a las comandas
- [x] El sonido NO suena para bebidas, vinos ni cafés (solo comida)
- [x] Implementar throttling: máximo 1 sonido cada 10 segundos
- [x] Aunque se añadan múltiples productos, solo suena una vez
- [x] Sonido discreto de dos tonos (800Hz + 1000Hz, 0.1s cada uno)
- [x] Throttling solo afecta al sonido, no a la funcionalidad normal
- [x] Sistema detecta nuevos pedidos de comida y reproduce sonido automáticamente


## Nueva Funcionalidad - Botón de Prueba de Sonido

- [x] Añadir botón discreto en esquina inferior izquierda del modo cocina
- [x] Botón reproduce el sonido de notificación al hacer clic
- [x] Permite probar el sonido cuantas veces se quiera
- [x] Diseño sutil con icono de altavoz, fondo semi-transparente
- [x] Posicionado con fixed bottom-4 left-4


## Corrección - Notificación Sonora Detecta Items Adicionales

- [x] El sonido debe sonar cuando se añaden items a mesas existentes, no solo mesas nuevas
- [x] Ejemplo: Mesa 1 tiene 2 platos → se añade 1 naan → debe sonar
- [x] Modificada la lógica para contar solo pedidos pendientes de comida
- [x] Mantener el throttling de 10 segundos
- [x] Añadido log de consola para debugging


## Mejora - Sonido Más Alto y Audible

- [x] Aumentar el volumen del sonido de notificación (de 0.3 a 0.8)
- [x] Cambiar a un "bip" más claro y penetrante (onda cuadrada)
- [x] Ajustar frecuencias para mejor audibilidad (1200Hz y 1400Hz)
- [x] Duración aumentada a 0.2s por bip para mayor claridad


## Bug Reportado - Sonido Solo Funciona en Guarniciones

- [x] El sonido solo se activa con guarniciones, no con otras categorías de comida
- [x] Debe funcionar para: entrantes, ensaladas, tandoor, todos los currys, biryani, postres, guarniciones
- [x] NO debe sonar para: bebidas, vinos, cafés
- [x] Cambiado de lista negativa a lista positiva de categorías
- [x] Añadidos logs detallados para debugging en consola
- [x] Lista explícita: starters, salads, tandoor, veg_curry, chicken_curry, fish_prawn_curry, lamb_curry, biryani, sides, desserts


## Ampliar Modal de Personalización

- [x] Modal debe aparecer para entrantes (starters)
- [x] Modal debe aparecer para todos los currys (ya implementado)
- [x] Modal debe aparecer para biryani (ya implementado)
- [x] Modal debe aparecer para refrescos (drinks)
- [x] Modal debe aparecer para lassi
- [x] Modal debe aparecer para chai (coffees)
- [x] Verificar que el nivel de picante y notas se guarden correctamente
- [x] Verificar que aparezcan en panel lateral, modo cocina y tickets

## Mejorar UX del Modal de Personalización

- [x] Añadir icono de lápiz en cada tarjeta de producto (esquina superior derecha)
- [x] Clic normal en la tarjeta: añadir producto directamente SIN modal (rápido)
- [x] Clic en el icono de lápiz: abrir modal de personalización
- [x] Aplicar a todas las categorías: entrantes, currys, biryani, bebidas
- [x] Prevenir propagación del evento del lápiz al click de la tarjeta
- [x] Probar que funciona correctamente en móvil y desktop


## Mejorar Indicadores de Picante

- [x] Hacer indicadores de picante más grandes y visibles (como iconos)
- [x] Añadir opción "Sin especificar" o "N/A" para cuando no se quiere indicar nivel de picante
- [x] Útil para bebidas o cuando solo se quieren añadir notas sin picante
- [x] Actualizar visualización en panel lateral (OrderPanel)
- [x] Actualizar visualización en modo cocina (KitchenView)
- [ ] Actualizar visualización en tickets impresos
- [x] Probar que se ve claramente para el chef


## Arreglar Visualización Móvil de Indicadores

- [x] Verificar que indicadores de picante se vean en móvil en OrderPanel
- [x] Verificar que notas se vean en móvil en OrderPanel
- [x] Verificar que indicadores de picante se vean en móvil en KitchenView
- [x] Verificar que notas se vean en móvil en KitchenView
- [x] Ajustar CSS responsive si es necesario
- [ ] Probar en viewport móvil (375px width)


## Añadir Selector de Cantidad en Modal de Personalización

- [x] Añadir campo de cantidad en CustomizationModal
- [x] Permitir seleccionar cantidad (botones +/- o input numérico)
- [x] Actualizar la función onConfirm para incluir la cantidad
- [x] Actualizar Home.tsx para manejar la cantidad del modal
- [x] Probar que funciona correctamente (ej: 2 chais sin leche)


## Cambiar Iconos de Picante a Símbolos de Texto

- [x] Cambiar emojis (👌🌶️🔥) por símbolos de texto (-, +-, +, ++)
- [x] Hacer los símbolos grandes y visibles
- [x] Actualizar CustomizationModal
- [x] Actualizar OrderPanel
- [x] Actualizar KitchenView
- [x] Probar que se vean claramente
