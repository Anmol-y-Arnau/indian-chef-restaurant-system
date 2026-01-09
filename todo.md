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
