import { useRestaurant } from '@/contexts/RestaurantContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChefHat, Check, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function KitchenView() {
  const { tables } = useRestaurant();
  const { t } = useLanguage();
  // Almacenar qué platos específicos están entregados: "tableId-orderId"
  const [deliveredItems, setDeliveredItems] = useState<Set<string>>(new Set());
  const [previousOrderCount, setPreviousOrderCount] = useState(0);

  // Obtener mesas activas (con pedidos)
  const activeTables = tables
    .filter(table => table.orders.length > 0)
    .map(table => {
      // Calcular cuántos items están pendientes
      const pendingCount = table.orders.filter(
        order => !deliveredItems.has(`${table.id}-${order.id}`)
      ).length;
      
      return {
        ...table,
        pendingCount,
        isFullyDelivered: pendingCount === 0,
        oldestTimestamp: Date.now()
      };
    })
    .sort((a, b) => {
      // Primero: mesas con pedidos pendientes (brillan)
      // Después: mesas completamente entregadas (comprimidas)
      if (a.isFullyDelivered !== b.isFullyDelivered) {
        return a.isFullyDelivered ? 1 : -1;
      }
      // Dentro de cada grupo, ordenar por antigüedad
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

  const handleMarkItemAsDelivered = (tableId: string | number, orderId: string) => {
    setDeliveredItems(prev => new Set(prev).add(`${tableId}-${orderId}`));
  };

  const handleMarkAllAsDelivered = (tableId: string | number, orderIds: string[]) => {
    setDeliveredItems(prev => {
      const newSet = new Set(prev);
      orderIds.forEach(orderId => newSet.add(`${tableId}-${orderId}`));
      return newSet;
    });
  };

  // Categorizar items de una mesa
  const categorizeTableOrders = (tableId: string | number, orders: any[]) => {
    const starters = orders.filter(o => o.menuItem.category === 'starters');
    const mains = orders.filter(o => o.menuItem.category !== 'starters' && o.menuItem.category !== 'drinks');
    const drinks = orders.filter(o => o.menuItem.category === 'drinks');
    
    // Separar entregados y pendientes
    const categorize = (items: any[]) => ({
      pending: items.filter(o => !deliveredItems.has(`${tableId}-${o.id}`)),
      delivered: items.filter(o => deliveredItems.has(`${tableId}-${o.id}`))
    });
    
    return {
      starters: categorize(starters),
      mains: categorize(mains),
      drinks: categorize(drinks)
    };
  };

  const OrderItem = ({ order, tableId, isPending }: { order: any; tableId: string | number; isPending: boolean }) => {
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
          {!isDelivered && (
            <button
              onClick={() => handleMarkItemAsDelivered(tableId, order.id)}
              className="bg-green-600 hover:bg-green-700 active:scale-90 text-white p-2 rounded-lg transition-all"
              title="Marcar como entregado"
            >
              <Check className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const TableCard = ({ table }: { table: any }) => {
    const categorized = categorizeTableOrders(table.id, table.orders);
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
                  <OrderItem key={`pending-${idx}`} order={order} tableId={table.id} isPending={true} />
                ))}
                {categorized.starters.delivered.map((order, idx) => (
                  <OrderItem key={`delivered-${idx}`} order={order} tableId={table.id} isPending={false} />
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
                  <OrderItem key={`pending-${idx}`} order={order} tableId={table.id} isPending={true} />
                ))}
                {categorized.mains.delivered.map((order, idx) => (
                  <OrderItem key={`delivered-${idx}`} order={order} tableId={table.id} isPending={false} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BEBIDAS - MENOS VISIBLE */}
        {(categorized.drinks.pending.length > 0 || categorized.drinks.delivered.length > 0) && (
          <div className="mb-6 opacity-40">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-slate-500 font-bold text-sm mb-2">
                🥤 BEBIDAS (Camarero)
              </div>
              <div className="space-y-1">
                {categorized.drinks.pending.map((order, idx) => (
                  <OrderItem key={`pending-${idx}`} order={order} tableId={table.id} isPending={true} />
                ))}
                {categorized.drinks.delivered.map((order, idx) => (
                  <OrderItem key={`delivered-${idx}`} order={order} tableId={table.id} isPending={false} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BOTÓN DELIVERED TODO */}
        {!isFullyDelivered && (
          <button
            onClick={() => handleMarkAllAsDelivered(table.id, table.orders.map((o: any) => o.id))}
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
