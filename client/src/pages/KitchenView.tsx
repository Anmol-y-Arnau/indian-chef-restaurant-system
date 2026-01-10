import { useRestaurant } from '@/contexts/RestaurantContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChefHat, Check, CheckCircle2, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export default function KitchenView() {
  const { tables } = useRestaurant();
  const { t } = useLanguage();
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  
  // Mutation para actualizar estado de entrega
  const updateDeliveryMutation = trpc.restaurant.updateOrderDeliveryStatus.useMutation();

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

  // Función para reproducir sonido de notificación
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
      
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';
        
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.1);
      }, 150);
    } catch (error) {
      console.error('Error reproduciendo sonido:', error);
    }
  };

  // Detectar nuevas mesas con pedidos
  useEffect(() => {
    const currentOrderCount = activeTables.reduce((sum, table) => sum + table.orders.length, 0);
    
    if (previousOrderCount > 0 && currentOrderCount > previousOrderCount) {
      playNotificationSound();
    }
    
    setPreviousOrderCount(currentOrderCount);
  }, [activeTables.length]);

  const handleToggleItemDelivery = async (orderId: number, currentStatus: boolean) => {
    // Toggle: si está entregado, vuelve a pendiente; si está pendiente, marca como entregado
    await updateDeliveryMutation.mutateAsync({
      orderId,
      isDelivered: !currentStatus
    });
  };

  const handleMarkAllAsDelivered = async (orderIds: number[]) => {
    // Marcar todos los pedidos de la mesa como entregados
    for (const orderId of orderIds) {
      await updateDeliveryMutation.mutateAsync({
        orderId,
        isDelivered: true
      });
    }
  };

  // Categorizar items de una mesa
  const categorizeTableOrders = (orders: any[]) => {
    const starters = orders.filter(o => o.menuItem.category === 'starters');
    // Postres, cafés, té y bebidas van juntos (no son para cocinar)
    const drinksAndDesserts = orders.filter(o => 
      o.menuItem.category === 'drinks' || 
      o.menuItem.category === 'desserts' ||
      o.menuItem.category === 'coffee' ||
      o.menuItem.category === 'tea'
    );
    // Platos principales: todo lo que no es entrante ni bebida/postre/café/té
    const mains = orders.filter(o => 
      o.menuItem.category !== 'starters' && 
      o.menuItem.category !== 'drinks' &&
      o.menuItem.category !== 'desserts' &&
      o.menuItem.category !== 'coffee' &&
      o.menuItem.category !== 'tea'
    );
    
    // Separar entregados y pendientes, ordenar por antigüedad
    const categorize = (items: any[]) => {
      const sorted = items.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime; // Más antiguo primero
      });
      
      return {
        pending: sorted.filter(o => !o.isDelivered),
        delivered: sorted.filter(o => o.isDelivered)
      };
    };
    
    return {
      starters: categorize(starters),
      mains: categorize(mains),
      drinks: categorize(drinksAndDesserts)
    };
  };

  const OrderItem = ({ order, isPending }: { order: any; isPending: boolean }) => {
    const isDelivered = !isPending;
    
    return (
      <div 
        className={`
          flex justify-between items-center rounded p-3 transition-all duration-300
          ${isDelivered 
            ? 'bg-slate-900/30 opacity-50 scale-95' 
            : 'bg-slate-900/50 shadow-lg'
          }
        `}
      >
        <div className="flex items-center gap-3 flex-1">
          <span className={`text-white font-semibold ${isDelivered ? 'text-lg line-through' : 'text-2xl'}`}>
            {order.menuItem.name}
          </span>
          {isDelivered && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-bold ${isDelivered ? 'text-xl text-slate-500' : 'text-3xl text-white'}`}>
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

  const TableCard = ({ table }: { table: any }) => {
    const categorized = categorizeTableOrders(table.orders);
    const hasPendingStarters = categorized.starters.pending.length > 0;
    const isFullyDelivered = table.isFullyDelivered;

    return (
      <div 
        className={`
          bg-slate-800 rounded-xl p-6 border-4 transition-all duration-500 shadow-2xl
          ${isFullyDelivered 
            ? 'border-slate-700 opacity-60 scale-95' 
            : hasPendingStarters 
              ? 'border-orange-500 ring-4 ring-orange-500/30 animate-pulse' 
              : 'border-slate-600'
          }
        `}
      >
        {/* HEADER - MESA */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-700">
          <div className="flex items-center gap-4">
            {hasPendingStarters && !isFullyDelivered && (
              <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                🔥 PRIORIDAD
              </div>
            )}
            {isFullyDelivered && (
              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                ✓ ENTREGADO
              </div>
            )}
            <h2 className={`font-bold text-orange-400 ${isFullyDelivered ? 'text-3xl' : 'text-5xl'}`}>
              {table.name}
            </h2>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-sm">Pendientes</div>
            <div className={`font-bold ${isFullyDelivered ? 'text-2xl text-green-500' : 'text-4xl text-white'}`}>
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
              <div className="text-orange-400 font-bold text-lg mb-3 flex items-center gap-2">
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

        {/* BEBIDAS, POSTRES, CAFÉ & TÉ - MENOS VISIBLE */}
        {(categorized.drinks.pending.length > 0 || categorized.drinks.delivered.length > 0) && (
          <div className="mb-6 opacity-40">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-slate-500 font-bold text-sm mb-2">
                🥤 BEBIDAS, POSTRES, CAFÉ & TÉ (Camarero)
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

      <div className="container mx-auto px-4 py-6">
        {activeTables.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeTables.map(table => (
              <TableCard key={table.id} table={table} />
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
    </div>
  );
}
