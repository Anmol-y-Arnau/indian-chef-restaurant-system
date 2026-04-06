import { useState, useEffect, useCallback, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { MENU_ITEMS, INITIAL_TABLES } from '@/lib/data';
import { OrderItem } from '@/lib/types';
import { Check, RotateCcw, Flame, CheckCircle2 } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';

// Categorías que maneja el cocinero del tandoor
const TANDOOR_CATEGORIES = [
  'starters',
  'tandoor',
  'breads',
  'salads',
  'desserts',
  'drinks',    // solo chai, mango lassi, lassi
  'coffees',
];

// Items de bebidas indias que maneja el tandoor
const INDIAN_DRINKS = ['Mango Lassi', 'Lassi', 'Indian Chai', 'Chai'];

// Etiquetas visuales por categoría
const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string; border: string; badge: string }> = {
  starters:  { label: 'ENTRANTES',       emoji: '🥗', color: 'bg-orange-950/80',  border: 'border-orange-500',  badge: 'bg-orange-500' },
  tandoor:   { label: 'TANDOOR',         emoji: '🔥', color: 'bg-red-950/80',     border: 'border-red-500',     badge: 'bg-red-500' },
  breads:    { label: 'NAAN & PAN',      emoji: '🫓', color: 'bg-amber-950/80',   border: 'border-amber-500',   badge: 'bg-amber-500' },
  salads:    { label: 'ENSALADAS',       emoji: '🥬', color: 'bg-green-950/80',   border: 'border-green-500',   badge: 'bg-green-500' },
  desserts:  { label: 'POSTRES',         emoji: '🍮', color: 'bg-purple-950/80',  border: 'border-purple-500',  badge: 'bg-purple-500' },
  indianDrinks: { label: 'BEBIDAS INDIAS', emoji: '🥛', color: 'bg-cyan-950/80',  border: 'border-cyan-500',    badge: 'bg-cyan-500' },
};

// Orden de visualización
const CATEGORY_ORDER = ['starters', 'tandoor', 'breads', 'salads', 'desserts', 'indianDrinks'];

function getTimeDiff(createdAt: string | Date | null | undefined): string {
  if (!createdAt) return '';
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (diff < 1) return 'ahora';
  if (diff === 1) return 'hace 1 min';
  return `hace ${diff} min`;
}

export default function TandoorView() {
  const haptic = useHaptic();
  const utils = trpc.useUtils();

  const { data: dbOrders = [] } = trpc.restaurant.getAllOrders.useQuery(undefined, {
    refetchInterval: false,
  });

  // Polling manual cada 3 segundos
  useEffect(() => {
    const id = setInterval(() => {
      utils.restaurant.getAllOrders.invalidate();
    }, 3000);
    return () => clearInterval(id);
  }, [utils]);

  const updateDeliveryMutation = trpc.restaurant.updateOrderDeliveryStatus.useMutation({
    onSuccess: () => {
      utils.restaurant.getAllOrders.invalidate();
    },
  });

  const handleToggle = useCallback(async (orderId: number, isDelivered: boolean) => {
    try {
      await updateDeliveryMutation.mutateAsync({ orderId, isDelivered: !isDelivered });
      haptic.success();
    } catch (e) {
      console.error(e);
    }
  }, [updateDeliveryMutation, haptic]);

  // Construir orders con info de mesa y menuItem
  const allOrders = useMemo(() => {
    return (dbOrders || []).map(dbOrder => {
      const menuItem = MENU_ITEMS.find(item => item.id === dbOrder.itemId);
      const table = INITIAL_TABLES.find(t => String(t.id) === String(dbOrder.tableId));
      return {
        id: Number(dbOrder.id),
        tableId: String(dbOrder.tableId),
        tableName: table ? `Mesa ${table.id}` : `Mesa ${dbOrder.tableId}`,
        menuItem: menuItem || {
          id: dbOrder.itemId,
          name: dbOrder.itemName,
          price: parseFloat(dbOrder.itemPrice),
          category: 'starters' as const,
          description: '',
          image: '',
        },
        quantity: dbOrder.quantity,
        isDelivered: Boolean(dbOrder.isDelivered),
        notes: dbOrder.notes || undefined,
        spiceLevel: dbOrder.spiceLevel || undefined,
        createdAt: dbOrder.createdAt,
      };
    });
  }, [dbOrders?.length, dbOrders?.map(o => `${o.id}-${o.isDelivered}`).join(',')]);

  // Filtrar solo los pedidos que maneja el tandoor
  const tandoorOrders = useMemo(() => {
    return allOrders.filter(order => {
      const cat = order.menuItem.category;
      if (TANDOOR_CATEGORIES.includes(cat)) {
        // Para bebidas, solo las indias
        if (cat === 'drinks' || cat === 'coffees' || cat === 'beers') {
          return INDIAN_DRINKS.some(d => order.menuItem.name.toLowerCase().includes(d.toLowerCase()));
        }
        return true;
      }
      return false;
    });
  }, [allOrders]);

  // Agrupar por categoría visual → por nombre de plato → por mesa
  const grouped = useMemo(() => {
    const result: Record<string, Record<string, { orders: typeof tandoorOrders; totalQty: number; pendingQty: number }>> = {};

    for (const order of tandoorOrders) {
      // Determinar categoría visual
      const rawCat = order.menuItem.category;
      let vizCat: string = rawCat;
      if (rawCat === 'drinks' || rawCat === 'coffees' || rawCat === 'beers') {
        vizCat = 'indianDrinks';
      }

      if (!result[vizCat]) result[vizCat] = {};
      const itemName = order.menuItem.name;
      if (!result[vizCat][itemName]) {
        result[vizCat][itemName] = { orders: [], totalQty: 0, pendingQty: 0 };
      }
      result[vizCat][itemName].orders.push(order);
      result[vizCat][itemName].totalQty += order.quantity;
      if (!order.isDelivered) result[vizCat][itemName].pendingQty += order.quantity;
    }

    // Ordenar orders dentro de cada plato por mesa y antigüedad
    for (const cat of Object.keys(result)) {
      for (const item of Object.keys(result[cat])) {
        result[cat][item].orders.sort((a, b) => {
          // Pendientes primero
          if (a.isDelivered !== b.isDelivered) return a.isDelivered ? 1 : -1;
          // Luego por antigüedad
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return aTime - bTime;
        });
      }
    }

    return result;
  }, [tandoorOrders]);

  const pendingTotal = useMemo(() =>
    tandoorOrders.filter(o => !o.isDelivered).reduce((s, o) => s + o.quantity, 0),
    [tandoorOrders]
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-orange-900/50 px-3 py-2 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <span className="font-bold text-orange-300 text-base tracking-wide">TANDOOR</span>
        </div>
        {pendingTotal > 0 ? (
          <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {pendingTotal} pendiente{pendingTotal !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="bg-green-700 text-green-200 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Todo listo
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="px-2 py-3 space-y-4">
        {CATEGORY_ORDER.map(cat => {
          const catItems = grouped[cat];
          if (!catItems || Object.keys(catItems).length === 0) return null;
          const cfg = CATEGORY_CONFIG[cat];

          // Contar pendientes en esta categoría
          const catPending = Object.values(catItems).reduce((s, v) => s + v.pendingQty, 0);

          return (
            <div key={cat} className={`rounded-xl border-2 ${cfg.border} overflow-hidden`}>
              {/* Cabecera de categoría */}
              <div className={`${cfg.color} px-3 py-2 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cfg.emoji}</span>
                  <span className="font-black text-sm tracking-widest text-white">{cfg.label}</span>
                </div>
                {catPending > 0 && (
                  <span className={`${cfg.badge} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
                    ×{catPending}
                  </span>
                )}
              </div>

              {/* Items de esta categoría */}
              <div className="divide-y divide-gray-800/60">
                {Object.entries(catItems).map(([itemName, data]) => {
                  const allDone = data.pendingQty === 0;

                  return (
                    <div
                      key={itemName}
                      className={`px-3 py-2 transition-all ${allDone ? 'opacity-40' : ''}`}
                    >
                      {/* Nombre del plato + total */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {allDone && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                          <span className={`font-bold ${allDone ? 'text-gray-500 line-through text-sm' : 'text-white text-base'}`}>
                            {itemName}
                          </span>
                        </div>
                        <span className={`font-black text-lg ${allDone ? 'text-gray-600' : 'text-orange-400'}`}>
                          ×{data.totalQty}
                        </span>
                      </div>

                      {/* Desglose por mesa */}
                      <div className="space-y-1 pl-1">
                        {data.orders.map(order => {
                          const done = order.isDelivered;
                          return (
                            <div
                              key={order.id}
                              className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition-all ${
                                done
                                  ? 'bg-gray-800/30'
                                  : 'bg-gray-800/70 border border-gray-700/50'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {/* Mesa */}
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                                  done ? 'bg-gray-700 text-gray-500' : 'bg-gray-700 text-gray-200'
                                }`}>
                                  {order.tableName}
                                </span>
                                {/* Cantidad */}
                                <span className={`font-black text-sm flex-shrink-0 ${done ? 'text-gray-600' : 'text-white'}`}>
                                  ×{order.quantity}
                                </span>
                                {/* Tiempo */}
                                <span className="text-gray-500 text-[10px] flex-shrink-0">
                                  {getTimeDiff(order.createdAt)}
                                </span>
                                {/* Notas / picante */}
                                {order.spiceLevel && !done && (
                                  <span className="text-orange-300 text-xs font-bold bg-orange-900/40 px-1.5 py-0.5 rounded flex-shrink-0">
                                    {order.spiceLevel === '-' ? 'NO PICANTE' :
                                     order.spiceLevel === '+-' ? 'TOQUE' :
                                     order.spiceLevel === '+' ? 'PICANTE' :
                                     order.spiceLevel === '++' ? 'MUY PICANTE' : order.spiceLevel}
                                  </span>
                                )}
                                {order.notes && !done && (
                                  <span className="text-blue-300 text-[10px] italic truncate">
                                    {order.notes.replace(/\|/g, ' · ')}
                                  </span>
                                )}
                              </div>
                              {/* Botón marcar */}
                              <button
                                onClick={() => handleToggle(order.id, order.isDelivered)}
                                className={`ml-2 flex-shrink-0 p-1.5 rounded-lg transition-all active:scale-90 ${
                                  done
                                    ? 'bg-orange-800/60 hover:bg-orange-700 text-orange-300'
                                    : 'bg-green-600 hover:bg-green-500 text-white'
                                }`}
                                title={done ? 'Desmarcar' : 'Marcar como hecho'}
                              >
                                {done
                                  ? <RotateCcw className="w-4 h-4" />
                                  : <Check className="w-4 h-4" />
                                }
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {tandoorOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Flame className="w-16 h-16 text-orange-800 mb-4" />
            <p className="text-gray-500 text-lg font-semibold">Sin pedidos pendientes</p>
            <p className="text-gray-700 text-sm mt-1">El tandoor está libre 🔥</p>
          </div>
        )}
      </div>
    </div>
  );
}
