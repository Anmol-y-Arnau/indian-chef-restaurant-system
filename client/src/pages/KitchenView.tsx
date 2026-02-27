import { useRestaurant } from '@/contexts/RestaurantContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChefHat, Check, CheckCircle2, RotateCcw, Settings } from 'lucide-react';
import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { trpc } from '@/lib/trpc';
import { MENU_ITEMS, INITIAL_TABLES } from '@/lib/data';
import { OrderItem } from '@/lib/types';
import { sortOrdersByCategory, getCategoryOrder } from '@/lib/orderUtils';
import { SoundSettingsDialog } from '@/components/SoundSettingsDialog';
import { useHaptic } from '@/hooks/useHaptic';

export default function KitchenView() {
  const { t } = useLanguage();
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isSoundSettingsOpen, setIsSoundSettingsOpen] = useState(false);
  const haptic = useHaptic();
  
  // Inicializar AudioContext
  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(ctx);
    return () => {
      ctx.close();
    };
  }, []);



  // Queries directas con datos propios (no del contexto)
  const utils = trpc.useUtils();
  
  const { data: dbTables = [] } = trpc.restaurant.getTables.useQuery(undefined, {
    refetchInterval: false, // Desactivar polling automático
  });
  const { data: dbOrders = [] } = trpc.restaurant.getAllOrders.useQuery(undefined, {
    refetchInterval: false, // Desactivar polling automático
  });
  
  // Polling manual sincronizado: invalidar AMBAS queries al mismo tiempo
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Invalidar ambas queries simultáneamente
      utils.restaurant.getTables.invalidate();
      utils.restaurant.getAllOrders.invalidate();
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [utils]);


  
  // Construir tables con orders incluidos (igual que en RestaurantContext)
  // MEMOIZADO para evitar reconstrucción constante
  const tables = useMemo(() => INITIAL_TABLES.map(initialTable => {
    const dbTable = dbTables?.find(t => t.tableId === String(initialTable.id));
    const tableOrders = (dbOrders || []).filter(order => String(order.tableId) === String(initialTable.id));

    // Convertir database orders a OrderItem format
    const orders: OrderItem[] = tableOrders.map(dbOrder => {
      const menuItem = MENU_ITEMS.find(item => item.id === dbOrder.itemId);
      return {
        id: String(dbOrder.id),
        menuItem: menuItem || {
          id: dbOrder.itemId,
          name: dbOrder.itemName,
          price: parseFloat(dbOrder.itemPrice),
          category: 'starters' as const,
          description: '',
          image: '',
        },
        quantity: dbOrder.quantity,
        isDelivered: dbOrder.isDelivered,
        spiceLevel: dbOrder.spiceLevel || undefined,
        notes: dbOrder.notes || undefined,
      };
    });

    return {
      ...initialTable,
      status: orders.length > 0 ? 'occupied' as const : 'free' as const,
      orders,
      startTime: orders.length > 0 ? new Date() : undefined,
    };
  }), [
    // Usar valores estables en lugar de referencias de arrays
    dbTables?.length,
    dbTables?.map(t => `${t.tableId}-${t.status}`).join(','),
    dbOrders?.length,
    dbOrders?.map(o => `${o.id}-${o.isDelivered}`).join(',')
  ]); // Solo recalcular cuando cambien los datos reales, no las referencias
  
  // Mutation para actualizar estado de entrega
  const updateDeliveryMutation = trpc.restaurant.updateOrderDeliveryStatus.useMutation({
    onSuccess: async () => {
      // Forzar recarga inmediata de datos
      await utils.restaurant.getTables.invalidate();
      await utils.restaurant.getAllOrders.invalidate();
      console.log('[DELIVERED] Data refetched');
    },
  });

  // Obtener mesas activas (con pedidos) y ordenar por antigüedad
  // MEMOIZADO para evitar recalcular y reordenar constantemente
  const activeTables = useMemo(() => tables
    .filter(table => table.orders.length > 0)
    .map(table => {
      // Calcular cuántos items están pendientes (isDelivered === 0)
      const pendingCount = table.orders.filter(order => !order.isDelivered).length;
      
      // Encontrar el pedido más antiguo de la mesa
      const oldestOrder = table.orders.reduce((oldest, current) => {
        const oldestTime = oldest.createdAt ? new Date(oldest.createdAt).getTime() : Date.now();
        const currentTime = current.createdAt ? new Date(current.createdAt).getTime() : Date.now();
        return currentTime < oldestTime ? current : oldest;
      }, table.orders[0]);
      
      return {
        ...table,
        pendingCount,
        isFullyDelivered: pendingCount === 0,
        oldestTimestamp: oldestOrder.createdAt ? new Date(oldestOrder.createdAt).getTime() : Date.now()
      };
    })
    .sort((a, b) => {
      // Primero: mesas con pedidos pendientes (brillan)
      // Después: mesas completamente entregadas (comprimidas)
      if (a.isFullyDelivered !== b.isFullyDelivered) {
        return a.isFullyDelivered ? 1 : -1;
      }
      // Dentro de cada grupo, ordenar por antigüedad (más antiguo primero)
      return a.oldestTimestamp - b.oldestTimestamp;
    }), [tables]); // Solo recalcular cuando cambien las mesas

  // Función para reproducir sonido de notificación (BIP fuerte y claro)
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Primer BIP - más fuerte y más largo
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Frecuencia más alta para mejor audibilidad (1200Hz)
      oscillator.frequency.value = 1200;
      oscillator.type = 'square'; // Onda cuadrada para sonido más penetrante
      
      // Volumen mucho más alto (0.8 en lugar de 0.3)
      gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      // Segundo BIP - aún más fuerte
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.frequency.value = 1400;
        oscillator2.type = 'square';
        
        gainNode2.gain.setValueAtTime(0.8, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.2);
      }, 200);
    } catch (error) {
      console.error('Error reproduciendo sonido:', error);
    }
  };

  // Calcular count de pedidos pendientes de forma memoizada
  const currentPendingOrderCount = useMemo(() => {
    // Cargar configuración de sonido desde localStorage
    const savedConfig = localStorage.getItem('kitchenSoundConfig');
    let soundEnabled = true;
    let selectedItems = new Set<string>();
    
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        soundEnabled = config.soundEnabled ?? true;
        selectedItems = new Set(config.selectedItems ?? []);
      } catch (e) {
        console.error('Error loading sound config:', e);
      }
    }
    
    // Si el sonido está desactivado globalmente, retornar 0
    if (!soundEnabled) {
      return 0;
    }
    
    // Contar solo pedidos configurados para sonar y que estén pendientes
    return activeTables.reduce((sum, table) => {
      const configuredOrders = table.orders.filter(order => {
        const isConfigured = selectedItems.size === 0 || selectedItems.has(order.menuItem.id);
        const isPending = !order.isDelivered;
        return isConfigured && isPending;
      });
      return sum + configuredOrders.length;
    }, 0);
  }, [
    // Usar valores primitivos estables en lugar de referencia de array
    activeTables.length,
    activeTables.map(t => `${t.id}:${t.orders.map(o => `${o.id}-${o.isDelivered}`).join(',')}`).join('|')
  ]);

  // Detectar nuevos pedidos según configuración de sonido
  useEffect(() => {
    // Si hay más pedidos de comida que antes (nueva mesa O items adicionales en mesa existente)
    if (previousOrderCount > 0 && currentPendingOrderCount > previousOrderCount) {
      const now = Date.now();
      const timeSinceLastNotification = now - lastNotificationTime;
      
      // Solo sonar si han pasado al menos 10 segundos (10000ms)
      if (timeSinceLastNotification >= 10000 || lastNotificationTime === 0) {
        console.log('[SOUND] 🔔 Nueva comida detectada! Reproduciendo sonido...');
        playNotificationSound();
        setLastNotificationTime(now);
      } else {
        console.log('[SOUND] 🔇 Throttled - esperando', Math.round((10000 - timeSinceLastNotification) / 1000), 'segundos');
      }
    }
    
    setPreviousOrderCount(currentPendingOrderCount);
  }, [currentPendingOrderCount, previousOrderCount, lastNotificationTime]);

  const handleToggleItemDelivery = useCallback(async (orderId: number, currentStatus: boolean | number) => {
    // Convertir currentStatus a boolean si es number (tinyint de DB)
    const isCurrentlyDelivered = Boolean(currentStatus);
    const newStatus = !isCurrentlyDelivered;
    
    console.log('[DELIVERED] Toggle item:', { orderId, currentStatus, isCurrentlyDelivered, newStatus });
    
    try {
      await updateDeliveryMutation.mutateAsync({
        orderId: Number(orderId),
        isDelivered: newStatus
      });
      
      // Vibración de éxito al marcar como entregado
      if (newStatus) {
        haptic.success();
      } else {
        haptic.light();
      }
      console.log('[DELIVERED] Success');
    } catch (error) {
      console.error('[DELIVERED] Error:', error);
    }
  }, [updateDeliveryMutation]);

  const handleMarkAllAsDelivered = useCallback(async (orderIds: number[]) => {
    console.log('[DELIVERED] Mark all as delivered:', orderIds);
    
    try {
      for (const orderId of orderIds) {
        await updateDeliveryMutation.mutateAsync({
          orderId: Number(orderId),
          isDelivered: true
        });
        haptic.light(); // Vibración por cada item marcado
      }
      console.log('[DELIVERED] All marked successfully');
    } catch (error) {
      console.error('[DELIVERED] Error marking all:', error);
    }
  }, [updateDeliveryMutation]);

  // Categorizar items de una mesa
  const categorizeTableOrders = (orders: any[]) => {
    const starters = orders.filter(o => o.menuItem.category === 'starters');
    
    // Postres van separados (para chef, brillante)
    const desserts = orders.filter(o => o.menuItem.category === 'desserts');
    
    // Bebidas, café y té van juntos al final (para camarero, menos visible)
    const drinks = orders.filter(o => 
      o.menuItem.category === 'drinks' || 
      o.menuItem.category === 'coffees' ||
      o.menuItem.category === 'coffee' ||
      o.menuItem.category === 'tea'
    );
    
    // Platos principales: todo lo que no es entrante, postre ni bebida/café/té
    const mains = orders.filter(o => 
      o.menuItem.category !== 'starters' && 
      o.menuItem.category !== 'drinks' &&
      o.menuItem.category !== 'desserts' &&
      o.menuItem.category !== 'coffees' &&
      o.menuItem.category !== 'coffee' &&
      o.menuItem.category !== 'tea'
    );
    
    // NO separar pending y delivered - mantener orden original para evitar re-renders
    const categorize = (items: any[]) => {
      // Ordenar por categoría y antigüedad UNA SOLA VEZ
      // Usar [...items] para hacer sort INMUTABLE (no mutar el array original)
      const sorted = [...items].sort((a, b) => {
        // Primero ordenar por categoría del menú
        const catA = getCategoryOrder(a.menuItem.category);
        const catB = getCategoryOrder(b.menuItem.category);
        if (catA !== catB) {
          return catA - catB;
        }
        // Luego por antigüedad dentro de la misma categoría
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime; // Más antiguo primero
      });
      
      // Devolver TODOS los items en su orden original, sin separarlos
      // La visualización (pending vs delivered) se maneja en el componente OrderItem
      return sorted;
    };
    
    return {
      starters: categorize(starters),
      mains: categorize(mains),
      desserts: categorize(desserts),
      drinks: categorize(drinks)
    };
  };



  const TableCard = memo(({ table, tableCount }: { table: any; tableCount: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const categorized = useMemo(() => categorizeTableOrders(table.orders), [table.orders]);
    const hasPendingStarters = categorized.starters.some((o: any) => !o.isDelivered);
    const isFullyDelivered = table.isFullyDelivered;

    // Contar items totales en esta mesa
    const totalItems = table.orders.length;
    
    // Tamaños dinámicos según cantidad de items en ESTA mesa (no total de mesas)
    const sizes = {
      headerText: totalItems <= 3 ? 'text-2xl' : totalItems <= 6 ? 'text-xl' : totalItems <= 10 ? 'text-lg' : 'text-base',
      headerTextDelivered: totalItems <= 3 ? 'text-lg' : totalItems <= 6 ? 'text-base' : 'text-sm',
      pendingCount: totalItems <= 3 ? 'text-xl' : totalItems <= 6 ? 'text-lg' : totalItems <= 10 ? 'text-base' : 'text-sm',
      pendingCountDelivered: totalItems <= 3 ? 'text-base' : totalItems <= 6 ? 'text-sm' : 'text-xs',
      itemName: totalItems <= 3 ? 'text-xl' : totalItems <= 6 ? 'text-lg' : totalItems <= 10 ? 'text-base' : 'text-sm',
      itemNameDelivered: totalItems <= 3 ? 'text-base' : totalItems <= 6 ? 'text-sm' : 'text-xs',
      quantity: totalItems <= 3 ? 'text-lg' : totalItems <= 6 ? 'text-base' : totalItems <= 10 ? 'text-sm' : 'text-xs',
      quantityDelivered: totalItems <= 3 ? 'text-base' : totalItems <= 6 ? 'text-sm' : 'text-xs',
      spiceIcon: totalItems <= 3 ? 'text-xl' : totalItems <= 6 ? 'text-lg' : totalItems <= 10 ? 'text-base' : 'text-sm',
      spiceText: totalItems <= 3 ? 'text-xs' : totalItems <= 6 ? 'text-[10px]' : 'text-[9px]',
      categoryTitle: totalItems <= 3 ? 'text-sm' : totalItems <= 6 ? 'text-xs' : 'text-[10px]',
      padding: totalItems <= 3 ? 'p-3' : totalItems <= 6 ? 'p-2' : totalItems <= 10 ? 'p-1.5' : 'p-1',
      itemPadding: totalItems <= 3 ? 'p-2' : totalItems <= 6 ? 'p-1.5' : totalItems <= 10 ? 'p-1' : 'p-0.5',
      gap: totalItems <= 3 ? 'gap-2' : totalItems <= 6 ? 'gap-1.5' : totalItems <= 10 ? 'gap-1' : 'gap-0.5',
    };

    // Componente OrderItem interno con acceso a sizes
    const OrderItem = ({ order, isPending }: { order: any; isPending: boolean }) => {
      const isDelivered = Boolean(order.isDelivered);
      
      return (
        <div 
          className={`
            flex justify-between items-center rounded ${sizes.itemPadding} transition-all duration-300
            ${isDelivered 
              ? 'bg-slate-900/30 opacity-50 scale-95' 
              : 'bg-slate-900/50 shadow-lg'
            }
          `}
        >
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-3">
              <span className={`text-white font-semibold ${isDelivered ? sizes.itemNameDelivered + ' line-through' : sizes.itemName}`}>
                {order.menuItem.name}
              </span>
              {isDelivered && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
            </div>
            {order.spiceLevel && (
              <div className="flex items-center gap-2 bg-orange-600/20 px-2 py-1 rounded-md border border-orange-500/30">
                <span className={`${sizes.spiceIcon} font-black text-orange-300`}>
                  {order.spiceLevel}
                </span>
                <span className={`${sizes.spiceText} font-bold text-orange-300`}>
                  {order.spiceLevel === '-' && 'NO PICANTE'}
                  {order.spiceLevel === '+-' && 'TOQUE PICANTE'}
                  {order.spiceLevel === '+' && 'PICANTE'}
                  {order.spiceLevel === '++' && 'MUY PICANTE'}
                </span>
              </div>
            )}
            {order.notes && (
              order.notes.includes('Entrante:') ? (
                // Formato especial para Menú del Día: destacar entrante y bebida claramente
                <div className="flex flex-col gap-1 bg-amber-600/20 px-3 py-2 rounded-md border border-amber-500/40">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">🍽️ Menú del Día</span>
                  {order.notes.split('|').map((note: string, idx: number) => {
                    const trimmed = note.trim();
                    const isEntrante = trimmed.startsWith('Entrante:');
                    const isBebida = trimmed.startsWith('Bebida:');
                    return (
                      <div key={idx} className={`flex items-center gap-2 px-2 py-1 rounded ${
                        isEntrante ? 'bg-green-700/30 border border-green-600/40' :
                        isBebida ? 'bg-blue-700/30 border border-blue-600/40' :
                        'bg-slate-700/30'
                      }`}>
                        <span className="text-base">{isEntrante ? '🥗' : isBebida ? '🥤' : '📝'}</span>
                        <span className={`font-semibold text-sm ${
                          isEntrante ? 'text-green-300' :
                          isBebida ? 'text-blue-300' :
                          'text-slate-300'
                        }`}>{trimmed}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-start gap-2 bg-blue-600/20 px-3 py-1.5 rounded-md border border-blue-500/30">
                  <span className="text-xl flex-shrink-0">📝</span>
                  <div className="text-sm text-blue-300 italic break-words">
                    {order.notes.includes('|') ? (
                      order.notes.split('|').map((note: string, idx: number) => (
                        <div key={idx} className="mb-0.5 last:mb-0">
                          {note.trim()}
                        </div>
                      ))
                    ) : (
                      order.notes
                    )}
                  </div>
                </div>
              )
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`font-bold ${isDelivered ? `${sizes.quantityDelivered} text-slate-500` : `${sizes.quantity} text-white`}`}>
              x{order.quantity}
            </span>
            <button
              onClick={() => handleToggleItemDelivery(order.id, isDelivered)}
              className={`p-2 rounded-lg transition-all ${
                isDelivered 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } active:scale-90 text-white`}
              title={isDelivered ? "Marcar como pendiente" : "Marcar como entregado"}
            >
              {isDelivered ? <RotateCcw className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            </button>
          </div>
        </div>
      );
    };

    // Si está completamente entregado y NO expandido, mostrar versión comprimida
    if (isFullyDelivered && !isExpanded) {
      return (
        <div 
          onClick={() => setIsExpanded(true)}
          className="bg-slate-800/30 rounded-lg p-2 border border-slate-700/50 cursor-pointer hover:bg-slate-800/50 transition-all flex items-center justify-between opacity-40 hover:opacity-60"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-slate-500 text-xs font-semibold">Mesa {table.name}</span>
          </div>
          <span className="text-slate-600 text-[10px] uppercase">Todo Entregado</span>
        </div>
      );
    }

    return (
      <div 
        className={`
          bg-slate-800 rounded-xl ${sizes.padding} border-4 transition-all duration-500 shadow-2xl relative flex flex-col h-full overflow-hidden
          ${isFullyDelivered 
            ? 'border-slate-700 opacity-70' 
            : 'border-slate-600'
          }
        `}
      >
        {/* Botón para comprimir si está entregado y expandido */}
        {isFullyDelivered && isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-slate-400 p-1 rounded text-xs z-10"
            title="Comprimir"
          >
            −
          </button>
        )}
        {/* HEADER - MESA */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-700">
          <div className="flex items-center gap-4">
            {hasPendingStarters && !isFullyDelivered && (
              <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                🔥 PRIORIDAD
              </div>
            )}
            {isFullyDelivered && (
              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                ✓ ENTREGADO
              </div>
            )}
            <h2 className={`font-bold text-orange-400 ${isFullyDelivered ? sizes.headerTextDelivered : sizes.headerText}`}>
              TABLE {table.name}
            </h2>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-xs">Pendientes</div>
            <div className={`font-bold ${isFullyDelivered ? `${sizes.pendingCountDelivered} text-green-500` : `${sizes.pendingCount} text-white`}`}>
              {table.pendingCount}/{table.orders.length}
            </div>
          </div>
        </div>

        {/* Contenedor scrollable para todas las categorías */}
        <div className="flex-1 overflow-y-auto">
          {/* ENTRANTES - PRIORIDAD */}
          {categorized.starters.length > 0 && (
          <div className="mb-6">
            <div className={`border-2 rounded-lg ${sizes.itemPadding} transition-all ${
              categorized.starters.some((o: any) => !o.isDelivered)
                ? 'bg-orange-500/20 border-orange-500' 
                : 'bg-slate-700/20 border-slate-600'
            }`}>
              <div className={`text-orange-400 font-bold ${sizes.categoryTitle} mb-2 flex items-center gap-2`}>
                <span>🔥</span>
                <span>ENTRANTES</span>
              </div>
              <div className="space-y-2">
                {categorized.starters.map((order: any) => (
                  <OrderItem key={`order-${order.id}`} order={order} isPending={!order.isDelivered} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PLATOS PRINCIPALES */}
        {categorized.mains.length > 0 && (
          <div className="mb-6">
            <div className={`border-2 rounded-lg ${sizes.itemPadding} transition-all ${
              categorized.mains.some((o: any) => !o.isDelivered)
                ? 'bg-slate-700/50 border-slate-600' 
                : 'bg-slate-700/20 border-slate-700'
            }`}>
              <div className={`text-slate-300 font-bold ${sizes.categoryTitle} mb-2 flex items-center gap-2`}>
                🍛 PLATOS PRINCIPALES
              </div>
              <div className="space-y-2">
                {categorized.mains.map((order: any) => (
                  <OrderItem key={`order-${order.id}`} order={order} isPending={!order.isDelivered} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* POSTRES - PARA CHEF */}
        {categorized.desserts.length > 0 && (
          <div className="mb-6">
            <div className={`border-2 rounded-lg ${sizes.itemPadding} transition-all ${
              categorized.desserts.some((o: any) => !o.isDelivered)
                ? 'bg-slate-700/50 border-slate-600' 
                : 'bg-slate-700/20 border-slate-700'
            }`}>
              <div className={`text-slate-300 font-bold ${sizes.categoryTitle} mb-2 flex items-center gap-2`}>
                🍰 POSTRES
              </div>
              <div className="space-y-2">
                {categorized.desserts.map((order: any) => (
                  <OrderItem key={`order-${order.id}`} order={order} isPending={!order.isDelivered} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BEBIDAS, CAFÉ & TÉ - MENOS VISIBLE (CAMARERO) */}
        {categorized.drinks.length > 0 && (
          <div className="mb-6 opacity-40">
            <div className={`bg-slate-800/50 border border-slate-700 rounded-lg ${sizes.itemPadding}`}>
              <div className="text-slate-500 font-bold text-sm mb-2">
                🥤 BEBIDAS, CAFÉ & TÉ (Camarero)
              </div>
              <div className="space-y-1">
                {categorized.drinks.map((order: any) => (
                  <OrderItem key={`order-${order.id}`} order={order} isPending={!order.isDelivered} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BOTÓN DELIVERED TODO */}
        {!isFullyDelivered && (
          <button
            onClick={() => handleMarkAllAsDelivered(table.orders.map((o: any) => o.id))}
            className="w-full bg-green-600 hover:bg-green-700 active:scale-95 text-white py-6 rounded-xl font-bold text-2xl transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            <Check className="w-8 h-8" />
            DELIVERED TODO
          </button>
        )}
        </div>
      </div>
    );
  }, (prevProps, nextProps) => {
    // Comparación personalizada: solo re-renderizar si cambian valores relevantes
    if (prevProps.table.id !== nextProps.table.id) return false;
    if (prevProps.tableCount !== nextProps.tableCount) return false;
    if (prevProps.table.orders.length !== nextProps.table.orders.length) return false;
    
    // Comparar estado de delivered de cada order
    const prevOrdersHash = prevProps.table.orders.map((o: any) => `${o.id}-${o.isDelivered}`).join(',');
    const nextOrdersHash = nextProps.table.orders.map((o: any) => `${o.id}-${o.isDelivered}`).join(',');
    
    return prevOrdersHash === nextOrdersHash; // true = NO re-renderizar
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header fijo */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-orange-600 to-orange-700 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">KITCHEN DISPLAY SYSTEM</h1>
                <p className="text-orange-100 text-sm">
                  {activeTables.filter(t => !t.isFullyDelivered).length} mesas activas · {' '}
                  {activeTables.filter(t => t.isFullyDelivered).length} completadas
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-orange-100 text-sm">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 py-3 h-[calc(100vh-100px)] overflow-y-auto">
        {activeTables.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 h-full" style={{ gridAutoRows: 'minmax(200px, auto)' }}>
            {activeTables.map(table => (
              <TableCard key={table.id} table={table} tableCount={activeTables.length} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ChefHat className="w-24 h-24 mx-auto text-slate-700 mb-4" />
            <h2 className="text-2xl font-bold text-slate-400 mb-2">No hay pedidos activos</h2>
            <p className="text-slate-500">Los nuevos pedidos aparecerán aquí automáticamente</p>
          </div>
        )}
      </div>

      {/* Botón de configuración de sonido */}
      <button
        onClick={() => setIsSoundSettingsOpen(true)}
        className="fixed bottom-4 left-4 bg-slate-700/80 hover:bg-slate-600 text-slate-300 p-3 rounded-full shadow-lg transition-all active:scale-95 z-50"
        title="Configurar notificaciones de sonido"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Diálogo de configuración de sonido */}
      <SoundSettingsDialog 
        isOpen={isSoundSettingsOpen}
        onClose={() => setIsSoundSettingsOpen(false)}
      />
    </div>
  );
}
