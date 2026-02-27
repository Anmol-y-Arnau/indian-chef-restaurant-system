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


#### Rediseñar Modo Cocina con Layout Adaptativo (Dashboard)
- [x] Eliminar scroll vertical en KitchenView
- [x] Implementar grid adaptativo tipo Kanban/Tetris
- [x] Tarjetas de mesas se organizan automáticamente (lado a lado, arriba/abajo)
- [x] Tamaño dinámico: 2 mesas = tarjetas grandes, 10 mesas = tarjetas pequeñas
- [x] Texto escalable según número de mesas activas
- [x] Todo visible en pantalla de 12.9" sin scroll
- [x] Probar con 1, 2, 5, 10 mesas activas
- [x] Optimizar para tablet (no se toca, solo visualización)
- [x] Mesas completamente entregadas se comprimen al mínimo
- [x] Solo mostrar "Mesa X - TODO ENTREGADO" en gris y pequeño
- [x] Expandible al hacer clic para ver detalles
- [x] Cocineros se enfocan en mesas con pedidos pendientes


## Optimizar Modo Cocina para Tablet 12.9" en Modo Desktop

- [x] Revisar viewport actual de tablet 12.9" en modo desktop (aprox. 1366x1024 o 1024x768)
- [x] Ajustar grid para aprovechar mejor el espacio horizontal
- [x] Optimizar tamaños de texto para que sean legibles pero no excesivamente grandes
- [x] Reducir padding y gaps para que quepan más mesas sin scroll
- [x] Probar con diferentes cantidades de mesas (2, 4, 6, 8, 10)
- [x] Asegurar que todo sea visible sin scroll en viewport de tablet desktop


## Rediseñar Tarjetas del Modo Cocina con Altura Adaptativa

- [x] Eliminar altura fija de las tarjetas (h-full)
- [x] Implementar grid de columnas con auto-rows (altura automática)
- [x] Eliminar scroll interno de las tarjetas (overflow-y-auto)
- [x] Tarjetas se adaptan al contenido: 2 items = pequeña, 10 items = grande
- [x] Layout fluido tipo masonry/columnas
- [x] Todo el contenido visible sin scroll interno
- [x] Grid responsive: 1 columna (móvil), 2-4 columnas (tablet/desktop)
- [x] Probar con pedidos de diferentes tamaños (1 item, 5 items, 10 items)
- [x] Mantener colores, botones y diseño visual actual


## Rediseñar Modo Cocina con Grid Fijo y Texto Escalable

- [x] Grid fijo de 4 columnas (cada tarjeta = 1/4 del ancho)
- [x] Altura fija para todas las tarjetas (misma altura con h-full)
- [x] Texto escalable dinámicamente según cantidad de items por mesa
- [x] 2-3 items = texto grande, 10+ items = texto pequeño
- [x] Contenido con scroll interno en cada tarjeta (overflow-y-auto)
- [x] Dashboard de cocina profesional optimizado para tablet 12.9"
- [x] Grid siempre 4 columnas independiente del número de mesas
- [x] Si hay más de 4 mesas, se muestran en filas adicionales
- [x] Probar con diferentes cantidades de items (2, 5, 10, 15)


## Añadir Número de Versión en Página Principal

- [x] Mostrar número de versión al lado del título "Indian Chef"
- [x] Formato: "Indian Chef v1.0" 
- [x] Ubicación: Header de la página principal (Home) y panel de mesas
- [x] Estilo discreto pero visible (gris, font-mono)


## Actualizar Número de Versión a v6.8

- [x] Cambiar v1.0 a v6.8 en header principal
- [x] Cambiar v1.0 a v6.8 en panel de mesas
- [x] Basado en análisis de 64 checkpoints del historial


## Ajustar Tamaño de Fuente y Separación en Modo Cocina

- [x] Aumentar tamaño de fuente de nombres de productos (Pulao Rice, Murg Tikka, etc.)
- [x] Reducir gap entre tarjetas de mesas (de gap-3 a gap-2)
- [x] Mantener dimensiones de tarjetas iguales
- [x] Aprovechar mejor el espacio disponible


## Ocultar Indicadores de Picante y Notas en Panel de Pedidos Móvil

- [x] Ocultar indicadores de picante en OrderPanel
- [x] Ocultar notas/observaciones en OrderPanel
- [x] Mantener visibles en KitchenView para el chef
- [x] Solo el chef necesita ver esta información, no el camarero


## Actualizar Número de Versión a v7.91

- [x] v6.8 → v7.8 (grid fijo de 4 columnas - cambio grande +1.0)
- [x] v7.8 → v7.81 (fuentes más grandes y gap reducido - cambio pequeño +0.01)
- [x] v7.81 → v7.91 (ocultar indicadores en móvil - cambio mediano +0.1)
- [x] Actualizar en Home.tsx


## Cambiar Método de Pago de Mesas Cerradas

- [x] Añadir botón "Cambiar pago" en historial de ventas
- [x] Reabrir modal de pago con datos actuales de la mesa cerrada
- [x] Permitir modificar método de pago (efectivo, tarjeta, mixto)
- [x] Actualizar registro en base de datos
- [x] Mostrar confirmación de cambio exitoso
- [x] Útil para corregir errores o cambios de último momento


## Actualizar Número de Versión a v8.01

- [x] v7.91 → v8.01 (cambiar método de pago de mesas cerradas - cambio mediano +0.1)
- [x] Actualizar en Home.tsx


## Añadir Personalización a "Varios / Personalizado"

- [x] Modificar CustomItemDialog para incluir selector de nivel de picante
- [x] Añadir campo de observaciones en CustomItemDialog
- [x] Mantener campo de nombre personalizado
- [x] Mantener campo de precio personalizado
- [x] Guardar nivel de picante y observaciones junto con el producto personalizado
- [x] Mostrar nivel de picante y observaciones en OrderPanel y KitchenView
- [x] Actualizar versión a v8.02 (cambio pequeño +0.01)


## Bug Reportado - Modal de Personalización Cortado en Móvil

- [x] Los botones de abajo del modal de personalización no se pueden pulsar en móvil
- [x] El modal es demasiado alto y queda cortado por el teclado del navegador
- [x] Reducir tamaños de elementos (botones de picante, textarea, padding)
- [x] Hacer el modal scrollable si es necesario (max-h-[85vh] overflow-y-auto)
- [x] Aplicar corrección a CustomizationModal
- [x] Aplicar corrección a CustomItemDialog
- [x] Actualizar versión a v8.03 (cambio pequeño +0.01)


## Menú de Configuración de Sonido en Modo Cocina

- [x] Convertir botón de prueba de sonido en botón de configuración
- [x] Crear componente SoundSettingsDialog con modal
- [x] Toggle global para activar/desactivar sonido completamente
- [x] Checkboxes por categoría (entrantes, currys, biryani, etc.)
- [x] Categorías expandibles para ver platos individuales
- [x] Checkboxes individuales por cada plato del menú
- [x] Lógica de selección: categoría seleccionada = todos los platos seleccionados
- [x] Persistencia en localStorage para mantener configuración entre sesiones
- [x] Actualizar lógica de sonido en KitchenView para respetar configuración
- [x] Icono de configuración (Settings) en lugar de altavoz
- [x] Actualizar versión a v8.1 (cambio mediano +0.1)


## Ampliar Menú de Configuración de Sonido - Todas las Categorías

- [x] Incluir TODAS las categorías en SoundSettingsDialog (no solo comida)
- [x] Añadir bebidas (drinks) al menú de configuración
- [x] Añadir vinos (wines) al menú de configuración
- [x] Añadir cafés (coffees) al menú de configuración
- [x] Permitir selección individual de cada producto de bebidas/vinos/cafés
- [x] Actualizar versión a v8.11 (cambio pequeño +0.01)


## Nueva Categoría: Menú del Día

- [x] Crear nueva categoría "menu_del_dia" en CATEGORIES
- [x] Añadir icono apropiado para menú del día (🍽️)
- [x] Crear producto "Menú del Día" en MENU_ITEMS
- [x] Precio: 15.90€
- [x] Crear componente MenuDelDiaDialog para personalizar el menú
- [x] Selector de entrante: Samosa, Veg Pakora o Chicken Pakora
- [x] Selector de bebida: Coca Cola, Fanta, Sprite, Agua
- [x] Principal incluido automáticamente: Butter Chicken, Dal Makhni, Jeera Rice, Garlic Naan y ensalada
- [x] Postre/café NO incluido inicialmente (se añade después cuando el cliente decida)
- [x] Mostrar en pedido: "Menú del Día - Entrante: X, Bebida: Y"
- [x] Integrar MenuDelDiaDialog en Home.tsx
- [x] Generar imagen representativa del menú del día
- [x] Añadir traducciones en español e inglés
- [x] Actualizar versión a v8.2 (cambio mediano +0.1)


## Bugs Reportados - Problemas de Z-Index y Posicionamiento en Móvil

- [x] Modal de "Cambiar pago" aparece detrás del modal "Historial de Ventas"
- [x] Después de cerrar el historial, las categorías del menú aparecen superpuestas sobre el contenido
- [x] Las categorías flotantes interfieren con el contenido de la página
- [x] Ajustar z-index del modal de pago para que esté por encima del historial (z-[100])
- [x] Corregir posicionamiento de las categorías en móvil (reducido z-index de z-30 a z-10)
- [x] Ajustar dimensiones del modal de pago en móvil (max-h-[90vh] overflow-y-auto, padding reducido)
- [x] Actualizar versión a v8.21 (cambio pequeño +0.01)


## Impresión Bluetooth Directa y Ticket Profesional Mejorado

- [x] Crear servicio de impresión Bluetooth con Web Bluetooth API
- [x] Detectar y conectar automáticamente con impresora Bluetooth
- [x] Guardar conexión de impresora en localStorage
- [x] Implementar comandos ESC/POS para impresoras térmicas (58mm/80mm)
- [x] Diseñar formato de ticket profesional con:
  - [x] Logo/nombre "INDIAN CHEF" en fuente grande (doble tamaño, negrita, centrado)
  - [x] Datos fiscales: AJIT & RANJIT, S.L.
  - [x] NIF: B24897415
  - [x] Dirección: C/ Lasauca, 18 Bs - 17600 Figueres (Girona)
  - [x] Número de ticket único (autoincremental en localStorage)
  - [x] Mesa y fecha/hora
  - [x] Items del pedido con precios alineados
  - [x] Nivel de picante y observaciones por item
  - [x] Total destacado (fuente grande, negrita)
  - [x] Mensaje de despedida
- [x] Convertir símbolo € a "EUR" para compatibilidad
- [x] Implementar tamaños de fuente variados (grande, normal, pequeña)
- [x] Añadir líneas separadoras con caracteres ASCII (-, =)
- [x] Integrar botón de impresión en OrderPanel
- [x] Manejar errores de conexión Bluetooth con toasts informativos
- [x] Actualizar versión a v8.3 (cambio mediano +0.1)


## Bug Reportado - Impresora Bluetooth No Conecta

- [x] Error "Error al imprimir. Verifica la conexión Bluetooth"
- [x] Los UUIDs específicos no coinciden con la impresora del usuario
- [x] Modificar código para aceptar CUALQUIER dispositivo Bluetooth (acceptAllDevices: true)
- [x] Eliminar filtros de servicios específicos en requestDevice
- [x] Probar múltiples UUIDs de servicios comunes de impresoras térmicas (4 servicios)
- [x] Implementar detección automática de servicio y característica correctos (bucle de prueba)
- [x] Añadir logs en consola para debugging (Found service/characteristic)
- [x] Actualizar versión a v8.31 (cambio pequeño +0.01)


## Bug Crítico - Modo Cocina: Scroll Vuelve Arriba Automáticamente

- [x] Al hacer scroll hacia abajo en modo cocina, la vista vuelve arriba automáticamente
- [x] Imposible acceder a pedidos en la parte inferior de la pantalla
- [x] Solo se puede ver contenido inferior por medio segundo antes de que vuelva arriba
- [x] Impide pulsar botón "Delivered" en pedidos que están abajo
- [x] Problema causado por actualizaciones constantes del componente (refetchInterval: 3000ms)
- [x] Implementar preservación de posición de scroll durante actualizaciones (useRef con scrollTop)
- [x] Desactivar auto-scroll cuando el usuario está navegando manualmente
- [x] Guardar y restaurar scrollTop en cada actualización (useEffect con deps [dbTables, dbOrders])
- [x] Cambiar overflow-hidden a overflow-y-auto en contenedor principal
- [x] Actualizar versión a v8.32 (cambio pequeño +0.01)


## Bug Crítico Persistente - Scroll Sube Instantáneamente (Intento 2)

- [x] La solución anterior con useRef NO funcionó
- [x] El scroll sube instantáneamente cada vez que se llega abajo
- [x] No es cada 3 segundos, es TODO EL RATO
- [x] Problema causado por re-renders constantes de componentes hijos (TableCard)
- [x] Implementar React.memo en TableCard para prevenir re-renders innecesarios
- [x] Estabilizar keys del map (ya usa table.id)
- [x] Eliminar console.log problemáticos que causan re-renders
- [x] Simplificar grid layout: cambiar gridAutoRows de '1fr' a 'minmax(200px, auto)'
- [x] Usar useMemo para categorizeTableOrders dentro de TableCard
- [x] Reiniciar servidor para limpiar caché de Vite
- [x] Actualizar versión a v8.33 (cambio pequeño +0.01)


## Bug Crítico Persistente - Scroll Sigue Subiendo (Intento 3 - Diagnóstico Correcto)

- [x] Video analizado frame por frame: el problema NO es el refetchInterval
- [x] Causa raíz: elementos dentro de TableCard se reordenan constantemente cuando cambian estados
- [x] Ejemplo: "Plain Rice" marcado como entregado cambia de posición → re-render → scroll reset
- [x] Solución: estabilizar orden de elementos para que NO se reordenen al marcar como entregado
- [x] Mantener posición original de items, solo cambiar visualización (opacidad, color)
- [x] Eliminar lógica que separaba pending/delivered en arrays diferentes
- [x] Usar ID único del pedido como key en lugar de índice (key={`order-${order.id}`})
- [x] Actualizar versión a v8.34 (cambio pequeño +0.01)


## Bug Reportado - Impresión Bluetooth Incompleta

- [x] El ticket impreso solo muestra los últimos 4-5 items del pedido
- [x] Faltan los primeros items de la lista (Murg Butter, Royal king, Lamb Curry, Naans, Murg Tikka)
- [x] Total impreso (99.10€) no coincide con total real (94.20€)
- [x] Problema: Buffer de impresora térmica se desborda o comandos se envían demasiado rápido
- [x] Solución implementada:
  - Reducido tamaño de chunk de 512 a 256 bytes
  - Aumentado delay entre chunks de 50ms a 100ms
  - Ticket dividido en 4 secciones separadas (header, fiscal, items, total)
  - Items enviados en lotes de 3 con pausas de 300ms entre lotes
  - Pausas de 200ms entre secciones principales
- [x] Actualizar versión a v8.35 (cambio pequeño +0.01)


## Bug Persistente - Scroll Sigue Saltando en Modo Cocina Desktop

- [x] A pesar de la solución anterior (keys estables), el scroll sigue saltando hacia arriba
- [x] Usuario usa tablet en modo desktop de Chrome
- [x] Problema ocurre tanto al marcar items como al expandir mesas completadas
- [x] Causa real encontrada: useEffect que restauraba savedScrollPosition cada vez que cambiaban dbTables/dbOrders (cada 3s)
- [x] Este useEffect forzaba container.scrollTop = savedScrollPosition.current en medio de re-renders
- [x] Solución implementada: eliminado completamente el useEffect problemático y refs innecesarios
- [x] Con keys estables, React mantiene el scroll naturalmente sin intervención manual
- [x] Actualizar versión a v8.36 (cambio pequeño +0.01)


## Bug CRÍTICO - Scroll Sigue Subiendo Inmediatamente

- [x] El scroll sigue saltando hacia arriba INMEDIATAMENTE al soltar el dedo
- [x] A veces sube incluso ANTES de soltar el dedo
- [x] A veces se queda 1 segundo abajo antes de subir
- [x] Problema NO resuelto con las soluciones anteriores (keys estables + eliminar useEffect)
- [x] Análisis profundo completado - 5 causas identificadas:
  1. activeTables se recalcula en CADA render sin memoización
  2. tables se reconstruye completamente en cada render
  3. categorizeTableOrders usa .sort() MUTABLE
  4. table.orders referencia cambia constantemente
  5. useEffect de notificaciones depende de activeTables
- [x] Soluciones implementadas:
  - Memoizado tables con useMemo([dbTables, dbOrders])
  - Memoizado activeTables con useMemo([tables])
  - Cambiado .sort() a [...items].sort() (inmutable)
- [x] Actualizar versión a v8.37 (cambio pequeño +0.01)


## URGENTE - Scroll TODAVÍA salta después de memoizaciones

- [ ] Confirmado: Después de hacer scroll hacia abajo, esperar 5s, el scroll vuelve arriba automáticamente
- [ ] Las memoizaciones de tables y activeTables NO resolvieron el problema
- [ ] Posibles causas adicionales a investigar:
  - Refetch de tRPC cada 3s que invalida queries
  - TableCard memo() no está funcionando correctamente
  - El contenedor scrollable se está re-renderizando completamente
  - Hay algún código oculto que resetea scroll position
- [ ] Necesito revisar: refetchInterval en useQuery, memo de TableCard, y cualquier lógica de scroll restoration


## CRÍTICO - Scroll TODAVÍA persiste después de TODAS las optimizaciones

- [x] Usuario probó en tablet con nueva versión - el scroll SIGUE saltando hacia arriba
- [x] Ya NO aparecen logs de [SOUND] Check en consola (buena señal - useEffect de sonido ya no se ejecuta constantemente)
- [x] Optimizaciones ya implementadas que NO resolvieron el problema:
  1. Keys estables basadas en ID único (key={`order-${order.id}`})
  2. Eliminado useEffect que restauraba savedScrollPosition
  3. Memoizado `tables` con dependencias estables
  4. Memoizado `activeTables` con dependencias estables
  5. Memoizado `currentPendingOrderCount` con dependencias estables
  6. Sort inmutable ([...items].sort())
  7. Añadida comparación personalizada al memo() de TableCard
- [x] Patrón observado por usuario: "cada 3 veces, sube instantáneamente 2 veces seguidas"
- [x] Causa REAL encontrada: DOS queries separadas (dbTables y dbOrders) con refetchInterval: 3000
- [x] Ambas queries se ejecutan con milisegundos de diferencia → dos re-renders casi simultáneos
- [x] Cada 3 ciclos se sincronizan → "dos saltos seguidos"
- [x] Solución implementada: Desactivado refetchInterval y creado polling manual sincronizado
- [x] Ahora un único setInterval invalida AMBAS queries simultáneamente cada 3s
- [x] Actualizar versión a v8.38 (cambio pequeño +0.01)


## Bug CRÍTICO - No aparecen pedidos en modo cocina

- [ ] Después de implementar polling sincronizado (v8.38), el modo cocina no muestra ningún pedido
- [ ] La pantalla de modo cocina está vacía
- [ ] Posible causa: error en la lógica de invalidate de queries
- [ ] Posible causa: nombres incorrectos de procedures en trpc.useUtils()
- [ ] Posible causa: queries no se están ejecutando correctamente
- [ ] Revisar console.log para ver errores de tRPC
- [ ] Verificar que dbTables y dbOrders se estén cargando correctamente
- [ ] Actualizar versión a v8.39 (cambio pequeño +0.01)


## URGENTE - Modo cocina NO muestra pedidos (v8.38)

- [x] Usuario reporta que NO aparece NADA en el menú de cocina después de rollback a v8.38
- [x] Problema: queries usan nombres incorrectos (trpc.tables.getAll y trpc.orders.getAll NO EXISTEN)
- [x] Los procedures correctos son: trpc.restaurant.getTables y trpc.restaurant.getAllOrders
- [x] Solución: corregido nombres de queries en KitchenView.tsx líneas 32-37
- [x] También corregido nombres en invalidate del polling sincronizado líneas 43-44
- [x] Servidor reiniciado para limpiar cache de Babel
- [x] Verificado que modo cocina ahora muestra pedidos correctamente
- [x] Actualizar versión a v8.39 (fix crítico +0.01)


## Nueva Funcionalidad - ASCII Art del Taj Mahal en Ticket

- [ ] Añadir ASCII art del Taj Mahal al principio del ticket térmico
- [ ] Posicionar el art encima o junto al título "INDIAN CHEF"
- [ ] Ajustar tamaño y formato para que se vea bien en impresora térmica de 58mm
- [ ] Probar que no cause problemas de buffer overflow
- [x] Actualizar versión a v8.40 (mejora visual +0.01)


## Nueva Funcionalidad - Logo en Ticket Térmico

- [x] Generar logo moderno y simple con elefantes y Taj Mahal
- [x] Usar colores vibrantes indios: lila, magenta, naranja, rojo, dorado
- [x] Crear 4 opciones diferentes para que el usuario elija
- [x] Usuario eligió opción 2 (diseño geométrico minimalista)
- [x] Añadir texto "INDIAN CHEF" abajo con fuente que concuerde
- [x] Generar logo CON texto "INDIAN CHEF" con fondo transparente
- [x] Generar logo SIN texto con fondo transparente
- [x] Guardar ambas versiones en /client/public/ (indian-chef-logo.png e indian-chef-logo-icon.png)
- [x] Optimizar imagen para impresora térmica (alto contraste, 200px ancho)
- [x] Integrar logo en ticket de impresión Bluetooth
- [x] Posicionar logo centrado arriba antes del título "INDIAN CHEF"
- [x] Implementar conversión de imagen PNG a bitmap ESC/POS
- [x] Actualizar versión a v8.40 (mejora visual +0.01)


## Rebrand Completo - Colores del Logo

- [x] Actualizar paleta de colores CSS con colores del logo (magenta, naranja, rojo, morado)
- [x] Crear gradientes vibrantes para fondos y elementos destacados
- [x] Actualizar colores de botones primarios y secundarios
- [x] Actualizar colores de categorías del menú
- [x] Actualizar colores de tarjetas de productos (MenuCard con gradientes y glow effects)
- [x] Actualizar colores de botones en OrderPanel
- [x] Añadir logo al header principal
- [x] Añadir logo al sidebar desktop y móvil
- [x] Mejorar efectos visuales (sombras, bordes, transiciones con glow effects)
- [x] Verificar contraste y accesibilidad con nuevos colores
- [x] Actualizar versión a v8.5 (rebrand completo +0.1)


## Fix Logo en Tickets Térmicos

- [x] Revisar implementación actual de printTicket en bluetoothPrinter.ts
- [x] Verificar que la función imageToEscPos esté funcionando correctamente
- [x] Añadir logs de depuración para diagnosticar problemas
- [x] Añadir mensajes de error visibles para el usuario
- [x] Asegurar que el logo aparezca centrado en el ticket
- [x] Reemplazar logo PNG por ASCII art proporcionado por usuario
- [x] Actualizar versión a v8.51 (logo ASCII en tickets +0.01)


## Revertir Logo ASCII en Tickets

- [x] Eliminar código de logo ASCII (caracteres Unicode no compatibles)
- [x] Dejar ticket en formato original sin logo
- [x] Actualizar versión a v8.52 (revertir logo ASCII +0.01)


## Fix Fecha de Registro de Ventas en Cierres

**Problema:** Cuando un cliente pide antes de medianoche pero paga después, el sistema registra la venta al día siguiente.

**Solución:** Registrar ventas con la fecha del primer pedido de la mesa, no la fecha de cobro.

- [x] Añadir campo `serviceDate` a tabla sales en schema
- [x] Aplicar migración de base de datos (pnpm db:push)
- [x] Modificar función de cobro para calcular serviceDate desde el pedido más antiguo
- [x] Actualizar addSale para usar serviceDate
- [x] Actualizar vista de cierres para mostrar ventas según serviceDate (orderHistory usa serviceDate)
- [x] Probar escenario: pedido 22:00, pago 01:00 → debe registrarse al día anterior (test pasado)
- [x] Actualizar versión a v8.6 (fix fecha registro ventas +0.1)


## Sección de Estadísticas Semanales - v8.7

Nueva sección con gráficos y análisis de ventas.

- [x] Crear componente StatsView.tsx con layout responsive
- [x] Implementar gráfico de ventas semanales (gráfico de barras diarias)
- [x] Implementar top 10 platos más vendidos (lista con barras de progreso)
- [x] Añadir comparativa de métodos de pago (barras horizontales)
- [ ] Calcular y mostrar horarios pico de ventas (opcional para futura mejora)
- [x] Añadir filtros por rango de fechas (última semana, mes implementados)
- [x] Integrar botón de acceso en header principal (móvil y desktop)
- [x] Estilizar con colores del brand (gradientes magenta-naranja aplicados)
- [x] Probar diseño responsive en móvil y tablet
- [x] Crear test de cálculos de estadísticas (5 tests pasados)
- [x] Actualizar versión a v8.7 (estadísticas semanales +0.1)


## Fix Scroll Mesas + Sistema Takeaway v8.8

### Fix Scroll Sidebar Mesas
- [x] Arreglar scroll vertical en sidebar desktop para ver todas las mesas (añadido h-full overflow-hidden)
- [ ] Verificar que funciona correctamente en diferentes resoluciones

### Sistema Takeaway
- [x] Añadir botón "TAKEAWAY" en sidebar (móvil y desktop)
- [x] TAKEAWAY funciona exactamente como una mesa normal (múltiples pedidos simultáneos)
- [x] Eliminar modal PickupTimeModal (no necesario)
- [x] Eliminar campo pickupTime de base de datos (no necesario)
- [x] Verificar que TAKEAWAY aparece correctamente en modo cocina
- [x] Verificar flujo completo: añadir items → cobrar → imprimir ticket → marcar delivered

- [x] Actualizar versión a v8.8 (scroll fix + takeaway simplificado +0.1)

## Bug Reportado - Scroll Sidebar Desktop No Funciona

- [x] El scroll vertical en el sidebar de mesas desktop no funciona correctamente
- [x] No se pueden ver todas las mesas (TAKEAWAY queda fuera de vista)
- [x] Revisar clases de Tailwind en el sidebar desktop
- [x] Implementar scroll funcional con ScrollArea o overflow-y-auto
- [x] Verificar que todas las mesas son visibles y accesibles
- [x] Actualizar versión a v8.8.1 (scroll sidebar fix +0.01)


## División Personalizada de Cuenta

- [x] Analizar modal de pago actual (PaymentModal.tsx)
- [x] Diseñar UI para asignar platos a personas específicas
- [x] Añadir botón "Dividir Personalizado" en modal de pago
- [x] Crear vista de asignación de platos por persona (CustomSplitModal)
- [x] Permitir seleccionar qué platos paga cada persona
- [x] Calcular subtotales por persona automáticamente
- [x] Mostrar resumen de quién paga qué
- [x] Actualizar backend para procesar pagos divididos personalizados
- [x] Probar flujo completo: seleccionar platos → asignar personas → cobrar
- [x] Actualizar versión a v8.9 (división personalizada de cuenta +0.1)


## Mejoras en Contabilidad (v8.10)
- [x] Analizar página de contabilidad actual (StatsView.tsx)
- [x] Añadir cálculo de "Promedio por Comensal" (además del promedio por mesa)
- [x] Mostrar ambos promedios: por mesa y por comensal
- [x] Crear función para generar texto de contabilidad formateado (generateWhatsAppMessage)
- [x] Añadir botón "Compartir por WhatsApp" en página de contabilidad
- [x] Incluir todos los detalles: ventas totales, número de mesas, comensales, promedios, métodos de pago, top 5 platos, ventas diarias
- [x] Probar compartir por WhatsApp y verificar formato
- [x] Actualizar versión a v8.10 (mejoras contabilidad + WhatsApp share +0.1)


## Mejoras en HistoryDialog - Compartir Registro del Día (v8.11)
- [x] Analizar HistoryDialog.tsx para entender estructura actual
- [x] Añadir cálculo de "Promedio por Comensal" en la sección de contabilidad del día
- [x] Mostrar "Promedio por Mesa" y "Promedio por Comensal" en el resumen del día
- [x] Crear función para generar mensaje de WhatsApp con detalles del día seleccionado
- [x] Añadir botón "Compartir por WhatsApp" en HistoryDialog
- [x] Incluir en el mensaje: fecha, ventas totales, número de mesas, comensales, promedios, métodos de pago, lista de ventas
- [x] Probar compartir registro del día por WhatsApp
- [x] Actualizar versión a v8.11 (compartir registro diario por WhatsApp +0.01)


## Mejoras Múltiples (v9.0)

### Botón Eliminar en Historial
- [x] Añadir botón "Eliminar" al lado de "Recuperar" en HistoryDialog
- [x] Implementar confirmación antes de eliminar
- [x] Eliminar venta de la base de datos permanentemente (deleteSale)
- [x] Actualizar lista de ventas después de eliminar

### Quitar Indicadores de Picante en Tickets
- [x] Revisar código de generación de tickets (OrderPanel.tsx)
- [x] Eliminar líneas "Picante: +", "Picante: +-", etc. del ticket impreso
- [ ] Verificar que el ticket se imprime correctamente sin indicadores

#### Arreglar Responsive Móvil en HistoryDialog
- [x] Revisar diseño del HistoryDialog en móvil
- [x] Ajustar ancho de columnas para que no se recorten (w-[95vw])
- [x] Añadir flex-wrap a botones para que se adapten
- [ ] Verificar que se ve correctamente en pantallas pequeñasas### Eliminar Primer Botón TAKEAWAY
- [x] Revisar sidebar móvil en Home.tsx
- [x] Eliminar primer botón TAKEAWAY (el que tiene letra grande)
- [x] Dejar solo el botón TAKEAWAY del final (tamaño normal)
- [x] Verificar que solo aparece un botón TAKEAWAY en móvil

### Modal de Tiempo para TAKEAWAY
- [x] Crear TakeawayTimeModal.tsx para preguntar minutos
- [x] Añadir campo pickupTime a la tabla tables en el contexto
- [x] Integrar modal en Home.tsx para abrir al hacer clic en TAKEAWAY
- [ ] Guardar tiempo de recogida al seleccionar TAKEAWAY (pendiente backend)
- [ ] Mostrar cuenta regresiva en modo cocina para TAKEAWAY
- [ ] Actualizar cuenta regresiva cada minuto
- [ ] Añadir alerta visual cuando el tiempo se agota
- [ ] Probar flujo completo: seleccionar TAKEAWAY → ingresar tiempo → ver cuenta regresiva

- [x] Actualizar versión a v9.0 (mejoras múltiples +0.89)


## Bug: Botón TAKEAWAY Duplicado (v9.0.1)
- [x] Buscar todos los botones TAKEAWAY en Home.tsx (móvil y desktop)
- [x] Eliminar el botón TAKEAWAY duplicado (filtrar del loop de mesas)
- [x] Dejar solo el botón TAKEAWAY del final (el que tiene el modal de tiempo)
- [x] Añadir TAKEAWAY al final de INITIAL_TABLES para mantener funcionalidad
- [x] Filtrar TAKEAWAY del loop de mesas en sidebar móvil y desktop
- [x] Verificar en móvil que solo hay un botón TAKEAWAY (filtrado correctamente)
- [x] Verificar en desktop que solo hay un botón TAKEAWAY (al final del sidebar)
- [x] Actualizar versión a v9.0.1 (fix botón duplicado +0.01)


## Bug: Botón TAKEAWAY no aparece en móvil (v9.0.2)
- [x] Revisar sidebar móvil en Home.tsx
- [x] Añadir botón TAKEAWAY al final del grid de mesas en móvil
- [x] Botón abre modal de tiempo y cierra sidebar correctamente
- [x] Actualizar versión a v9.0.2 (fix TAKEAWAY móvil +0.01)


## Bug: Botón TAKEAWAY móvil en posición incorrecta (v9.0.3)
- [x] Mover botón TAKEAWAY dentro del ScrollArea en sidebar móvil
- [x] Posicionar al final del grid de mesas (después de mesa 10) con col-span-3
- [x] Debe hacer scroll para verlo, igual que en desktop
- [x] Actualizar versión a v9.0.3 (fix posición TAKEAWAY móvil +0.01)


## Nueva Funcionalidad: Generar PDF de Ticket para WhatsApp (v9.1)
- [x] Crear endpoint tRPC para generar PDF de ticket con datos de la empresa
- [x] Implementar generación de PDF con jspdf en el backend
- [x] Modificar OrderPanel para generar PDF en lugar de texto al compartir por WhatsApp
- [x] PDF debe incluir: logo, nombre empresa, NIF, dirección, mesa, fecha, items, total
- [x] Subir PDF generado a S3 y obtener URL pública
- [x] Abrir WhatsApp con enlace al PDF en lugar de texto plano
- [x] Sincronizar número de ticket entre impresión y PDF (mismo número consecutivo)
- [x] Guardar número de ticket por mesa al imprimir
- [x] Usar mismo número al generar PDF para WhatsApp
- [x] Tests creados y pasando (4/4 tests)
- [x] Actualizar versión a v9.1 (PDF tickets para WhatsApp +0.1)


## Bug Crítico: Hooks Order en OrderPanel (v9.1.1)
- [x] Error: "Rendered more hooks than during the previous render"
- [x] Causa: useMutation llamado después de early return (viola Rules of Hooks)
- [x] Solución: Mover generatePDFMutation antes de cualquier return condicional
- [x] Verificado: App funciona correctamente sin errores de hooks
- [x] Actualizar versión a v9.1.1 (fix hooks order +0.01)


## Bug: PDF no se genera correctamente (v9.2)
- [x] PDF subido a S3 no es válido (enlace da error 404 o archivo corrupto)
- [x] Verificado: PDF se genera correctamente y es válido
- [x] Probar generación de PDF localmente

## Nueva Funcionalidad: Código QR para descarga de ticket (v9.2)
- [x] Cambiar flujo de WhatsApp a código QR
- [x] Generar código QR con enlace al PDF
- [x] Mostrar QR en modal para que cliente escanee
- [x] Cliente escanea QR y descarga PDF del ticket
- [x] Mantener número de ticket sincronizado
- [x] Instalar librería qrcode para generación de QR
- [x] Crear componente QRCodeModal con diseño profesional
- [x] Botón de descarga directa del PDF en el modal
- [x] Actualizar versión a v9.2 (QR para tickets +0.1)


## Bug: QR Code no se genera visualmente (v9.2.1)
- [x] El canvas del QR aparece en blanco
- [x] Revisar useEffect y dependencias
- [x] Añadido timeout de 100ms para asegurar que canvas esté montado
- [x] Añadidos logs para debugging
- [x] Verificar que QRCode.toCanvas funciona correctamente
- [x] Asegurar colores negro (#000000) sobre blanco (#FFFFFF) visibles
- [x] Actualizar versión a v9.2.1 (fix QR display +0.01)


## Bugs: Agrupación incorrecta en Modo Cocina (v9.2.2)
- [x] Bug 1: Contador de cantidades no se actualiza correctamente (2 + 1 no suma 3)
- [x] Bug 2: Nivel de picante se agrupa mal (1 picante + 2 normales = muestra "3 picantes")
- [x] Bug 3: Notas se agrupan incorrectamente (3 refrescos con notas diferentes solo muestra 1 nota)
- [x] Revisar lógica de agrupación en restaurantDb.ts addOrder()
- [x] Items ahora se agrupan SOLO si tienen exactamente los mismos atributos (itemId + spiceLevel + notes)
- [x] Si un item tiene spiceLevel diferente, se crea un grupo separado
- [x] Si un item tiene notes diferentes, se crea un grupo separado
- [x] Items entregados NO se agrupan con pendientes
- [x] Tests creados y pasando (5/5 tests)
- [x] Actualizar versión a v9.2.2 (fix kitchen grouping +0.01)


## Bugs: Imágenes faltantes y alto consumo de RAM (v9.2.3)
- [x] Algunas fotos no se muestran después de mover a S3 (solo imágenes grandes fueron movidas)
- [x] Identificar qué imágenes faltan y actualizar referencias (chef-icon y menú están en local)
- [x] Alto consumo de RAM en el navegador
- [x] Diagnosticar causas del consumo excesivo de memoria (polling cada 3s era el problema)
- [x] Optimizar re-renders innecesarios (añadido useMemo en RestaurantContext)
- [x] Revisar si hay memory leaks en componentes (no encontrados)
- [x] Optimizar carga de imágenes (lazy loading añadido a MenuCard)
- [x] Reducir polling de 3s a 10s (tablas y pedidos) y 15s (ventas)
- [x] Crear MenuCardMemo con React.memo para evitar re-renders
- [x] Actualizar versión a v9.2.3 (fix images + RAM optimization +0.01)


## Nueva Funcionalidad: Haptic Feedback (Vibración) (v9.3)
- [x] Crear hook personalizado `useHaptic` para gestionar vibraciones
- [x] Implementar diferentes patrones de vibración (light: 10ms, selection: 5ms, medium: 20ms, heavy: 50ms, success: [10,50,10], error: 100ms)
- [x] Añadir vibración suave al añadir items al pedido
- [x] Añadir vibración media al eliminar items del pedido
- [x] Añadir vibración de éxito al completar pago/cerrar mesa (patrón success)
- [x] Añadir vibración muy corta al cambiar de mesa activa (5ms)
- [x] Añadir vibración muy corta al cambiar de categoría en el menú (5ms)
- [x] Añadir vibración de éxito al marcar pedido como entregado en cocina
- [x] Añadir vibración suave al confirmar personalización de items
- [x] Detectar soporte de Vibration API y manejar gracefully si no está disponible
- [x] Actualizar versión a v9.3 (haptic feedback +0.1)


## Bug: No se muestran ventas del día 30 en contabilidad (v9.3.1)
- [x] El menú de contabilidad no muestra el día 30 del mes pasado
- [x] Solo aparecen ventas desde el día 31 en adelante
- [x] Verificar si las ventas del día 30 se guardaron en la base de datos (SÍ, 14 ventas encontradas)
- [x] Revisar filtro de fechas en el componente de historial
- [x] Problema encontrado: conversión a ISO string causaba cambio de zona horaria
- [x] Solución: Pasar objeto Date directamente sin convertir a string
- [x] Cambiar tipo de OrderHistoryItem.date de string a string | Date
- [x] Actualizar RestaurantContext para pasar Date en lugar de toISOString()
- [x] Actualizar versión a v9.3.1 (fix accounting date filter +0.01)


## Bug: Menú del día no muestra detalles en modo cocina (v9.3.2)
- [x] Cuando se añade "Menú del día" con opciones personalizadas (entrante, bebida, postre/café)
- [x] En modo cocina solo aparece "Menú del día" sin detalles
- [x] Debe mostrar qué entrante escogió el cliente
- [x] Debe mostrar qué bebida escogió
- [x] Debe mostrar si escogió postre o café (nota informativa en el modal)
- [x] Revisar cómo se guardan las notas del menú del día en MenuDelDiaDialog
- [x] Modificado para guardar opciones en campo notes con formato "Entrante: X | Bebida: Y"
- [x] Modificar KitchenView para parsear y mostrar detalles estructurados
- [x] KitchenView ahora divide notas con "|" en líneas separadas para mejor legibilidad
- [x] Actualizar versión a v9.3.2 (fix menu details in kitchen +0.01)


## Nueva Funcionalidad: Calculadora de cambio en pago efectivo (v9.4.0)
- [x] Añadir campo "Cantidad recibida" en modal de pago en efectivo
- [x] Calcular automáticamente el cambio a devolver
- [x] Mostrar cambio en grande y destacado (texto 4xl en verde: "41.50€")
- [x] Aplicar también a pago mixto cuando la parte en efectivo necesita cambio
- [x] Validar que la cantidad recibida sea mayor o igual al total en efectivo
- [x] Mostrar alerta si la cantidad es insuficiente
- [x] Diseño con fondo verde y borde destacado para visibilidad
- [x] Actualizar versión a v9.4.0 (calculadora de cambio +0.1)

## Sistema de Clientes Frecuentes para Facturación

- [x] Crear tabla en base de datos para clientes frecuentes (nombre, NIF, dirección, ciudad)
- [x] Añadir botón "Clientes" en el menú principal (junto a Historial)
- [x] Crear modal/página de gestión de clientes con lista de clientes guardados
- [x] Implementar formulario para añadir nuevo cliente
- [x] Implementar edición de clientes existentes
- [x] Implementar eliminación de clientes
- [ ] En modal de factura, añadir selector de cliente frecuente
- [ ] Al seleccionar cliente frecuente, auto-rellenar campos de factura
- [ ] Permitir edición manual de datos aunque se seleccione cliente frecuente

## Factura Pendiente

- [x] Generar factura para STAR PROP PATRIMONIAL, S.L. (NIF: B05380993) con pedido del 21/2/2026

## Cambios en el Menú

- [x] Añadir "Tandoori Pulpo" (22.90€) en sección Tandoori
- [x] Mover "Copa de Vino" de categoría Bebidas a categoría Vinos

## Cambios en el Menú (v9.5.2)

- [x] Añadir "Infusiones" (2.50€) en sección Bebidas

## Cambios en el Menú (v9.5.3)

- [x] Crear nueva sección "Copas" (licores y cócteles)
- [x] Mover Chupito de Bebidas a Copas
- [x] Añadir Copa de Baileys (5.00€), Copa de Ratafia (4.50€), Copa de Licor (4.50€), Cubata (7.00€), Copa de Cava (4.00€) en sección Copas
- [x] Añadir Café Solo con Hielo (2.20€) y Cortado con Hielo (2.20€) en sección Cafés

## Revisión numeración e imágenes (v9.6.0)

- [x] Corregir numeración completa del menú (secuencial, sin decimales ni saltos)
- [x] Generar imágenes IA para: Tandoori Pulpo, Infusiones, Copa de Baileys, Copa de Ratafia, Copa de Licor, Cubata, Copa de Cava, Café Solo con Hielo, Cortado con Hielo, Chupito

## Edición de precio en platos (v9.6.1)

- [x] Añadir campo de edición de precio en el modal del lápiz de cada plato

## Menú del Día mejorado (v9.6.2)

- [x] Al pulsar el Menú del Día directamente (sin lápiz) abrir el selector de entrante y bebida
- [x] En modo cocina mostrar el detalle completo: "Menú del Día - Entrante: X / Bebida: Y"

## Imagen Menú del Día (v9.6.3)

- [x] Generar y añadir imagen al Menú del Día

## Nuevas cervezas en Bebidas (v9.6.4)

- [x] Añadir Free Damm, Damm Lemon y Voll Damm al mismo precio que Estrella Botella

## Fix traducción categoría Copas (v9.6.5)

- [x] Añadir clave "categories.spirits" en el archivo de traducciones
