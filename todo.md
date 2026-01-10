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
