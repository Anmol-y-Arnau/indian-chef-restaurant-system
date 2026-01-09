import { useRestaurant } from '@/contexts/RestaurantContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChefHat, Clock, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function KitchenView() {
  const { tables } = useRestaurant();
  const { t } = useLanguage();
  const [completedOrders, setCompletedOrders] = useState<Set<string>>(new Set());

  // Obtener todos los pedidos activos de todas las mesas
  const allOrders = tables.flatMap(table => 
    table.orders.map(order => ({
      ...order,
      tableId: table.id,
      tableName: table.name,
      timestamp: Date.now() // Usar timestamp actual por ahora
    }))
  );

  // Categorizar pedidos
  const starters = allOrders.filter(order => 
    order.menuItem.category === 'starters' && !completedOrders.has(`${order.tableId}-${order.id}`)
  );
  
  const mains = allOrders.filter(order => 
    order.menuItem.category !== 'starters' && order.menuItem.category !== 'drinks' && !completedOrders.has(`${order.tableId}-${order.id}`)
  );
  
  const drinks = allOrders.filter(order => 
    order.menuItem.category === 'drinks' && !completedOrders.has(`${order.tableId}-${order.id}`)
  );

  // Ordenar por timestamp (más antiguo primero)
  const sortByOldest = (a: any, b: any) => a.timestamp - b.timestamp;
  
  starters.sort(sortByOldest);
  mains.sort(sortByOldest);
  drinks.sort(sortByOldest);

  const handleMarkAsDelivered = (tableId: string | number, orderId: string) => {
    setCompletedOrders(prev => new Set(prev).add(`${tableId}-${orderId}`));
    
    // Opcional: eliminar después de 3 segundos para feedback visual
    setTimeout(() => {
      setCompletedOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${tableId}-${orderId}`);
        return newSet;
      });
    }, 3000);
  };

  const getTimeElapsed = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes === 1) return '1 min';
    return `${minutes} min`;
  };

  const OrderCard = ({ order, urgent = false }: { order: any; urgent?: boolean }) => {
    const isCompleted = completedOrders.has(`${order.tableId}-${order.id}`);
    const timeElapsed = getTimeElapsed(order.timestamp);
    const isUrgent = !isCompleted && parseInt(timeElapsed) > 15;

    return (
      <div 
        className={`
          bg-slate-800 rounded-lg p-4 border-2 transition-all duration-300
          ${isCompleted ? 'opacity-50 border-green-500' : urgent ? 'border-orange-500' : 'border-slate-700'}
          ${isUrgent && !isCompleted ? 'animate-pulse' : ''}
        `}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-orange-400">
                {order.tableName}
              </span>
              <span className={`text-sm px-2 py-1 rounded ${
                isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'
              }`}>
                <Clock className="inline w-3 h-3 mr-1" />
                {timeElapsed}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              {urgent && '🔥 '}{order.menuItem.name}
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-white">
              x{order.quantity}
            </span>
          </div>
        </div>

        {order.notes && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 mb-3">
            <p className="text-yellow-400 text-sm">📝 {order.notes}</p>
          </div>
        )}

        <button
          onClick={() => handleMarkAsDelivered(order.tableId, order.id)}
          disabled={isCompleted}
          className={`
            w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2
            ${isCompleted 
              ? 'bg-green-500/20 text-green-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white active:scale-95'
            }
          `}
        >
          <Check className="w-5 h-5" />
          {isCompleted ? '✓ Entregado' : 'Marcar Entregado'}
        </button>
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
                <h1 className="text-2xl font-bold">Vista de Cocina</h1>
                <p className="text-orange-100 text-sm">
                  {starters.length + mains.length} pedidos activos
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="text-orange-100 text-sm">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* ENTRANTES - Prioridad máxima */}
        {starters.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-lg flex items-center gap-2">
                🔥 ENTRANTES - PRIORIDAD
                <span className="bg-white text-orange-500 rounded-full w-7 h-7 flex items-center justify-center text-sm">
                  {starters.length}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {starters.map((order, index) => (
                <OrderCard key={`starter-${order.tableId}-${order.id}-${index}`} order={order} urgent={true} />
              ))}
            </div>
          </section>
        )}

        {/* PLATOS PRINCIPALES */}
        {mains.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-slate-700 text-white px-4 py-2 rounded-lg font-bold text-lg flex items-center gap-2">
                🍛 PLATOS PRINCIPALES
                <span className="bg-white text-slate-700 rounded-full w-7 h-7 flex items-center justify-center text-sm">
                  {mains.length}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mains.map((order, index) => (
                <OrderCard key={`main-${order.tableId}-${order.id}-${index}`} order={order} />
              ))}
            </div>
          </section>
        )}

        {/* BEBIDAS - Menos visible */}
        {drinks.length > 0 && (
          <section className="opacity-50 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-slate-800 text-slate-400 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                🥤 BEBIDAS (Camarero)
                <span className="bg-slate-700 text-slate-300 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  {drinks.length}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {drinks.map((order, index) => (
                <div key={`drink-${order.tableId}-${order.id}-${index}`} className="bg-slate-800/50 rounded p-3 text-sm">
                  <div className="font-semibold text-slate-300">
                    {order.tableName}
                  </div>
                  <div className="text-slate-400">{order.menuItem.name} x{order.quantity}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sin pedidos */}
        {starters.length === 0 && mains.length === 0 && drinks.length === 0 && (
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
