import { useState } from 'react';
import { X, Plus, Trash2, CreditCard, Banknote, Check } from 'lucide-react';
import { OrderItem } from '@/lib/types';
import { PersonPayment } from './PaymentModal';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';

interface CustomSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderItem[];
  onConfirm: (persons: PersonPayment[]) => void;
}

export default function CustomSplitModal({ isOpen, onClose, orders, onConfirm }: CustomSplitModalProps) {
  const [persons, setPersons] = useState<PersonPayment[]>([
    { personId: 1, name: 'Persona 1', items: [], total: 0, method: 'cash' }
  ]);
  
  const [selectedPerson, setSelectedPerson] = useState<number>(1);

  if (!isOpen) return null;

  const addPerson = () => {
    const newId = Math.max(...persons.map(p => p.personId), 0) + 1;
    setPersons([...persons, {
      personId: newId,
      name: `Persona ${newId}`,
      items: [],
      total: 0,
      method: 'cash'
    }]);
  };

  const removePerson = (personId: number) => {
    if (persons.length === 1) return; // At least one person
    setPersons(persons.filter(p => p.personId !== personId));
    if (selectedPerson === personId) {
      setSelectedPerson(persons[0].personId);
    }
  };

  const toggleItemForPerson = (orderId: string | number, quantity: number, price: number) => {
    setPersons(persons.map(person => {
      if (person.personId === selectedPerson) {
        const existingItem = person.items.find(i => i.orderId === orderId);
        
        if (existingItem) {
          // Remove item
          const newItems = person.items.filter(i => i.orderId !== orderId);
          const newTotal = person.total - (price * quantity);
          return { ...person, items: newItems, total: newTotal };
        } else {
          // Add item
          const newItems = [...person.items, { orderId, quantity }];
          const newTotal = person.total + (price * quantity);
          return { ...person, items: newItems, total: newTotal };
        }
      }
      return person;
    }));
  };

  const updatePersonMethod = (personId: number, method: 'cash' | 'card') => {
    setPersons(persons.map(p => 
      p.personId === personId ? { ...p, method } : p
    ));
  };

  const updatePersonName = (personId: number, name: string) => {
    setPersons(persons.map(p => 
      p.personId === personId ? { ...p, name } : p
    ));
  };

  const isItemAssigned = (orderId: string | number) => {
    const person = persons.find(p => p.personId === selectedPerson);
    return person?.items.some(i => i.orderId === orderId) || false;
  };

  const getTotalAssigned = () => {
    return persons.reduce((sum, p) => sum + p.total, 0);
  };

  const getTotalOrders = () => {
    return orders.reduce((sum, o) => sum + (o.menuItem.price * o.quantity), 0);
  };

  const isComplete = () => {
    return Math.abs(getTotalAssigned() - getTotalOrders()) < 0.01;
  };

  const handleConfirm = () => {
    if (!isComplete()) {
      alert('Debes asignar todos los platos antes de confirmar');
      return;
    }
    onConfirm(persons);
  };

  const selectedPersonData = persons.find(p => p.personId === selectedPerson);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-2 md:p-4">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-orange-500">División Personalizada</h2>
            <p className="text-slate-400 text-xs md:text-sm">Asigna cada plato a quien lo paga</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Person List */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-700 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-700">
              <Button
                onClick={addPerson}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir Persona
              </Button>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {persons.map(person => (
                  <div
                    key={person.personId}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPerson === person.personId
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                    }`}
                    onClick={() => setSelectedPerson(person.personId)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) => updatePersonName(person.personId, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent text-white font-medium text-sm flex-1 outline-none"
                      />
                      {persons.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removePerson(person.personId);
                          }}
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="text-lg font-bold text-white mb-2">
                      {person.total.toFixed(2)}€
                    </div>
                    
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePersonMethod(person.personId, 'cash');
                        }}
                        className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-all ${
                          person.method === 'cash'
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-600 text-slate-300'
                        }`}
                      >
                        <Banknote className="w-3 h-3 inline mr-1" />
                        Efectivo
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePersonMethod(person.personId, 'card');
                        }}
                        className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-all ${
                          person.method === 'card'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-600 text-slate-300'
                        }`}
                      >
                        <CreditCard className="w-3 h-3 inline mr-1" />
                        Tarjeta
                      </button>
                    </div>
                    
                    {person.items.length > 0 && (
                      <div className="text-xs text-slate-400 mt-2">
                        {person.items.length} plato{person.items.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Order Items */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-700 bg-slate-700/50">
              <div className="text-sm text-slate-300">
                Selecciona los platos para <span className="font-bold text-orange-500">{selectedPersonData?.name}</span>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {orders.map(order => {
                  const isAssigned = isItemAssigned(order.id);
                  const itemTotal = order.menuItem.price * order.quantity;
                  
                  return (
                    <button
                      key={order.id}
                      onClick={() => toggleItemForPerson(order.id, order.quantity, order.menuItem.price)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        isAssigned
                          ? 'border-green-500 bg-green-500/20'
                          : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {isAssigned && (
                              <Check className="w-5 h-5 text-green-500 shrink-0" />
                            )}
                            <div>
                              <div className="font-medium text-white">
                                {order.quantity}x {order.menuItem.name}
                              </div>
                              {order.spiceLevel && (
                                <div className="text-xs text-slate-400">
                                  🌶️ Picante: {order.spiceLevel}
                                </div>
                              )}
                              {order.notes && (
                                <div className="text-xs text-slate-400">
                                  📝 {order.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-white ml-4">
                          {itemTotal.toFixed(2)}€
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 space-y-3 shrink-0">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Total asignado:</span>
            <span className={`text-lg font-bold ${
              isComplete() ? 'text-green-500' : 'text-orange-500'
            }`}>
              {getTotalAssigned().toFixed(2)}€ / {getTotalOrders().toFixed(2)}€
            </span>
          </div>
          
          {!isComplete() && (
            <div className="text-xs text-yellow-400 text-center">
              ⚠️ Faltan {(getTotalOrders() - getTotalAssigned()).toFixed(2)}€ por asignar
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isComplete()}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar División
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
