import { useRestaurant } from '@/contexts/RestaurantContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChefHat, Check, CheckCircle2, RotateCcw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { MENU_ITEMS, INITIAL_TABLES } from '@/lib/data';
import { OrderItem } from '@/lib/types';
import { sortOrdersByCategory, getCategoryOrder } from '@/lib/orderUtils';

export default function KitchenView() {
  const { t } = useLanguage();
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  // Inicializar AudioContext
  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(ctx);
    return () => {
      ctx.close();
    };
  }, []);

  // Queries directas con datos propios (no del contexto)
  const { data: dbTables, refetch: refetchTables } = trpc.restaurant.getTables.useQuery(undefined, {
    refetchInterval: 3000, // Polling cada 3 segundos
  });
  const { data: dbOrders, refetch: refetchOrders } = trpc.restaurant.getAllOrders.useQuery(undefined, {
    refetchInterval: 3000,
  });
  
  // Construir tables con orders incluidos (igual que en RestaurantContext)
  const tables = INITIAL_TABLES.map(initialTable => {
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
  });
  
  // Mutation para actualizar estado de entrega
  const updateDeliveryMutation = trpc.restaurant.updateOrderDeliveryStatus.useMutation({
    onSuccess: async () => {
      // Forzar recarga inmediata de datos
      await refetchTables();
      await refetchOrders();
      console.log('[DELIVERED] Data refetched');
    },
  });

  // Obtener mesas activas (con pedidos) y ordenar por antigüedad
  const activeTables = tables
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
    });

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

  // Detectar nuevos pedidos de comida (no bebidas)
  useEffect(() => {
    // Categorías que NO son comida (no deben sonar)
    const nonFoodCategories = ['drinks', 'wines', 'coffees'];
    
    // Categorías que SÍ son comida (deben sonar)
    const foodCategories = ['starters', 'salads', 'tandoor', 'veg_curry', 'chicken_curry', 'fish_prawn_curry', 'lamb_curry', 'biryani', 'sides', 'desserts'];
    
    // Contar solo pedidos de comida pendientes (no entregados)
    const currentFoodOrderCount = activeTables.reduce((sum, table) => {
      const foodOrders = table.orders.filter(order => {
        const isFood = foodCategories.includes(order.menuItem.category);
        const isPending = !order.isDelivered;
        return isFood && isPending;
      });
      return sum + foodOrders.length;
    }, 0);
    
    // Log para debugging
    console.log('[SOUND] Check:', { 
      previousCount: previousOrderCount, 
      currentCount: currentFoodOrderCount,
      activeTables: activeTables.length,
      allOrders: activeTables.flatMap(t => t.orders).map(o => ({ 
        name: o.menuItem.name, 
        category: o.menuItem.category,
        isDelivered: o.isDelivered 
      }))
    });
    
    // Si hay más pedidos de comida que antes (nueva mesa O items adicionales en mesa existente)
    if (previousOrderCount > 0 && currentFoodOrderCount > previousOrderCount) {
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
    
    setPreviousOrderCount(currentFoodOrderCount);
  }, [activeTables, previousOrderCount, lastNotificationTime]);

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
    
    // Separar entregados y pendientes, ordenar por categoría y antigüedad
    const categorize = (items: any[]) => {
      const sorted = items.sort((a, b) => {
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
      
      const pending = sorted.filter(o => !o.isDelivered);
      const deliveredItems = sorted.filter(o => o.isDelivered);
      
      // Agrupar pedidos entregados del mismo item
      const deliveredGrouped = deliveredItems.reduce((acc: any[], order) => {
        const existing = acc.find(o => o.menuItem.id === order.menuItem.id);
        if (existing) {
          // Sumar la cantidad al pedido existente
          existing.quantity += order.quantity;
          // Guardar los IDs originales para el botón de toggle
          if (!existing.originalIds) {
            existing.originalIds = [Number(existing.id)];
          }
          existing.originalIds.push(Number(order.id));
        } else {
          // Primer pedido de este item
          acc.push({
            ...order,
            originalIds: [Number(order.id)] // Guardar el ID original
          });
        }
        return acc;
      }, []);
      
      return {
        pending,
        delivered: deliveredGrouped
      };
    };
    
    return {
      starters: categorize(starters),
      mains: categorize(mains),
      desserts: categorize(desserts),
      drinks: categorize(drinks)
    };
  };



  const TableCard = ({ table, tableCount }: { table: any; tableCount: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const categorized = categorizeTableOrders(table.orders);
    const hasPendingStarters = categorized.starters.pending.length > 0;
    const isFullyDelivered = table.isFullyDelivered;

    // Tamaños dinámicos según cantidad de mesas (optimizado para tablet 12.9" desktop)
    const sizes = {
      headerText: tableCount <= 2 ? 'text-3xl' : tableCount <= 4 ? 'text-2xl' : tableCount <= 6 ? 'text-xl' : tableCount <= 9 ? 'text-lg' : 'text-base',
      headerTextDelivered: tableCount <= 2 ? 'text-xl' : tableCount <= 4 ? 'text-lg' : 'text-base',
      pendingCount: tableCount <= 2 ? 'text-2xl' : tableCount <= 4 ? 'text-xl' : tableCount <= 6 ? 'text-lg' : tableCount <= 9 ? 'text-base' : 'text-sm',
      pendingCountDelivered: tableCount <= 2 ? 'text-lg' : tableCount <= 4 ? 'text-base' : 'text-sm',
      itemName: tableCount <= 2 ? 'text-lg' : tableCount <= 4 ? 'text-base' : tableCount <= 6 ? 'text-sm' : tableCount <= 9 ? 'text-xs' : 'text-[11px]',
      itemNameDelivered: tableCount <= 2 ? 'text-sm' : tableCount <= 4 ? 'text-xs' : 'text-[10px]',
      quantity: tableCount <= 2 ? 'text-xl' : tableCount <= 4 ? 'text-lg' : tableCount <= 6 ? 'text-base' : tableCount <= 9 ? 'text-sm' : 'text-xs',
      quantityDelivered: tableCount <= 2 ? 'text-base' : tableCount <= 4 ? 'text-sm' : 'text-xs',
      spiceIcon: tableCount <= 2 ? 'text-2xl' : tableCount <= 4 ? 'text-xl' : tableCount <= 6 ? 'text-lg' : tableCount <= 9 ? 'text-base' : 'text-sm',
      spiceText: tableCount <= 2 ? 'text-xs' : tableCount <= 4 ? 'text-[10px]' : 'text-[9px]',
      categoryTitle: tableCount <= 2 ? 'text-sm' : tableCount <= 4 ? 'text-xs' : 'text-[10px]',
      padding: tableCount <= 2 ? 'p-4' : tableCount <= 4 ? 'p-3' : tableCount <= 6 ? 'p-2' : 'p-1.5',
      itemPadding: tableCount <= 2 ? 'p-3' : tableCount <= 4 ? 'p-2' : tableCount <= 6 ? 'p-1.5' : 'p-1',
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
              <div className="flex items-start gap-2 bg-blue-600/20 px-3 py-1.5 rounded-md border border-blue-500/30">
                <span className="text-xl flex-shrink-0">📝</span>
                <span className="text-sm text-blue-300 italic break-words">
                  {order.notes}
                </span>
              </div>
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
          bg-slate-800 rounded-xl ${sizes.padding} border-4 transition-all duration-500 shadow-2xl overflow-y-auto relative
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

        {/* ENTRANTES - PRIORIDAD */}
        {(categorized.starters.pending.length > 0 || categorized.starters.delivered.length > 0) && (
          <div className="mb-6">
            <div className={`border-2 rounded-lg p-4 transition-all ${
              categorized.starters.pending.length > 0 
                ? 'bg-orange-500/20 border-orange-500' 
                : 'bg-slate-700/20 border-slate-600'
            }`}>
              <div className={`text-orange-400 font-bold ${sizes.categoryTitle} mb-2 flex items-center gap-2`}>
                <span>🔥</span>
                <span>ENTRANTES</span>
              </div>
              <div className="space-y-2">
                {categorized.starters.pending.map((order, idx) => (
                  <OrderItem key={`pending-${idx}`} order={order} isPending={true} />
                ))}
                {categorized.starters.delivered.map((order, idx) => (
                  <OrderItem key={`delivered-${idx}`} order={order} isPending={false} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PLATOS PRINCIPALES */}
        {(categorized.mains.pending.length > 0 || categorized.mains.delivered.length > 0) && (
          <div className="mb-6">
            <div className={`border-2 rounded-lg p-4 transition-all ${
              categorized.mains.pending.length > 0 
                ? 'bg-slate-700/50 border-slate-600' 
                : 'bg-slate-700/20 border-slate-700'
            }`}>
              <div className="text-slate-300 font-bold text-lg mb-3">
                🍛 PLATOS PRINCIPALES
              </div>
              <div className="space-y-2">
                {categorized.mains.pending.map((order, idx) => (
                  <OrderItem key={`pending-${idx}`} order={order} isPending={true} />
                ))}
                {categorized.mains.delivered.map((order, idx) => (
                  <OrderItem key={`delivered-${idx}`} order={order} isPending={false} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* POSTRES - PARA CHEF */}
        {(categorized.desserts.pending.length > 0 || categorized.desserts.delivered.length > 0) && (
          <div className="mb-6">
            <div className={`border-2 rounded-lg p-4 transition-all ${
              categorized.desserts.pending.length > 0 
                ? 'bg-slate-700/50 border-slate-600' 
                : 'bg-slate-700/20 border-slate-700'
            }`}>
              <div className="text-slate-300 font-bold text-lg mb-3">
                🍰 POSTRES
              </div>
              <div className="space-y-2">
                {categorized.desserts.pending.map((order, idx) => (
                  <OrderItem key={`pending-${idx}`} order={order} isPending={true} />
                ))}
                {categorized.desserts.delivered.map((order, idx) => (
                  <OrderItem key={`delivered-${idx}`} order={order} isPending={false} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BEBIDAS, CAFÉ & TÉ - MENOS VISIBLE (CAMARERO) */}
        {(categorized.drinks.pending.length > 0 || categorized.drinks.delivered.length > 0) && (
          <div className="mb-6 opacity-40">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-slate-500 font-bold text-sm mb-2">
                🥤 BEBIDAS, CAFÉ & TÉ (Camarero)
              </div>
              <div className="space-y-1">
                {categorized.drinks.pending.map((order, idx) => (
                  <OrderItem key={`pending-${idx}`} order={order} isPending={true} />
                ))}
                {categorized.drinks.delivered.map((order, idx) => (
                  <OrderItem key={`delivered-${idx}`} order={order} isPending={false} />
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
    );
  };

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

      <div className="container mx-auto px-3 py-3 h-[calc(100vh-100px)] overflow-hidden">
        {activeTables.length > 0 ? (
          <div className={`
            grid gap-3 h-full
            ${
              activeTables.length === 1 ? 'grid-cols-1' :
              activeTables.length === 2 ? 'grid-cols-2' :
              activeTables.length <= 4 ? 'grid-cols-2' :
              activeTables.length <= 6 ? 'grid-cols-3' :
              activeTables.length <= 9 ? 'grid-cols-3' :
              activeTables.length <= 12 ? 'grid-cols-4' :
              'grid-cols-4'
            }
            ${
              activeTables.length <= 2 ? 'grid-rows-1' :
              activeTables.length <= 4 ? 'grid-rows-2' :
              activeTables.length <= 6 ? 'grid-rows-2' :
              activeTables.length <= 9 ? 'grid-rows-3' :
              activeTables.length <= 12 ? 'grid-rows-3' :
              'grid-rows-4'
            }
          `}>
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

      {/* Botón de prueba de sonido */}
      <button
        onClick={playNotificationSound}
        className="fixed bottom-4 left-4 bg-slate-700/80 hover:bg-slate-600 text-slate-300 p-3 rounded-full shadow-lg transition-all active:scale-95 z-50"
        title="Probar sonido de notificación"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>
      </button>
    </div>
  );
}
