import { useState } from 'react';
import { X, CreditCard, Banknote, Users, UserPlus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { OrderItem } from '@/lib/types';
import CustomSplitModal from './CustomSplitModal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  orders: OrderItem[];
  onConfirm: (paymentData: PaymentData) => void;
}

export interface PaymentData {
  method: 'cash' | 'card' | 'mixed';
  splitBetween: number;
  cashPayers: number;
  cardPayers: number;
  customSplit?: PersonPayment[];
}

export interface PersonPayment {
  personId: number;
  name: string;
  items: { orderId: string | number; quantity: number }[];
  total: number;
  method: 'cash' | 'card';
}

export default function PaymentModal({ isOpen, onClose, total, orders, onConfirm }: PaymentModalProps) {
  const { t } = useLanguage();
  const [method, setMethod] = useState<'cash' | 'card' | 'mixed'>('cash');
  const [splitBetween, setSplitBetween] = useState(1);
  const [cashPayers, setCashPayers] = useState(0);
  const [cardPayers, setCardPayers] = useState(0);
  const [isCustomSplit, setIsCustomSplit] = useState(false);
  const [customSplitData, setCustomSplitData] = useState<PersonPayment[]>([]);

  if (!isOpen) return null;

  const handleSplitChange = (value: number) => {
    setSplitBetween(value);
    if (method === 'mixed') {
      // Reset payers when split changes
      setCashPayers(0);
      setCardPayers(0);
    }
  };

  const handleMethodChange = (newMethod: 'cash' | 'card' | 'mixed') => {
    setMethod(newMethod);
    if (newMethod !== 'mixed') {
      setCashPayers(0);
      setCardPayers(0);
    }
  };

  const handleConfirm = () => {
    if (method === 'mixed' && cashPayers + cardPayers !== splitBetween) {
      alert('El número de pagadores debe sumar el total de personas');
      return;
    }

    onConfirm({
      method,
      splitBetween,
      cashPayers: method === 'mixed' ? cashPayers : (method === 'cash' ? splitBetween : 0),
      cardPayers: method === 'mixed' ? cardPayers : (method === 'card' ? splitBetween : 0),
    });
  };

  const amountPerPerson = splitBetween > 0 ? total / splitBetween : total;
  const cashAmount = method === 'mixed' && cashPayers > 0 ? amountPerPerson * cashPayers : (method === 'cash' ? total : 0);
  const cardAmount = method === 'mixed' && cardPayers > 0 ? amountPerPerson * cardPayers : (method === 'card' ? total : 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-800 rounded-lg max-w-md w-full p-4 md:p-6 space-y-4 md:space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-orange-500">Método de Pago</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Total */}
        <div className="bg-slate-700 p-4 rounded-lg">
          <div className="text-slate-400 text-sm">Total a pagar</div>
          <div className="text-3xl font-bold text-white">{total.toFixed(2)}€</div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <label className="text-slate-300 text-sm font-medium">Método de Pago</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleMethodChange('cash')}
              className={`p-4 rounded-lg border-2 transition-all ${
                method === 'cash'
                  ? 'border-orange-500 bg-orange-500/20'
                  : 'border-slate-600 bg-slate-700 hover:border-slate-500'
              }`}
            >
              <Banknote className="w-6 h-6 mx-auto mb-2 text-green-400" />
              <div className="text-sm font-medium">Efectivo</div>
            </button>
            <button
              onClick={() => handleMethodChange('card')}
              className={`p-4 rounded-lg border-2 transition-all ${
                method === 'card'
                  ? 'border-orange-500 bg-orange-500/20'
                  : 'border-slate-600 bg-slate-700 hover:border-slate-500'
              }`}
            >
              <CreditCard className="w-6 h-6 mx-auto mb-2 text-blue-400" />
              <div className="text-sm font-medium">Tarjeta</div>
            </button>
            <button
              onClick={() => handleMethodChange('mixed')}
              className={`p-4 rounded-lg border-2 transition-all ${
                method === 'mixed'
                  ? 'border-orange-500 bg-orange-500/20'
                  : 'border-slate-600 bg-slate-700 hover:border-slate-500'
              }`}
            >
              <Users className="w-6 h-6 mx-auto mb-2 text-purple-400" />
              <div className="text-sm font-medium">Mixto</div>
            </button>
          </div>
        </div>

        {/* Split Between */}
        <div className="space-y-2">
          <label className="text-slate-300 text-sm font-medium">Dividir entre personas</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSplitChange(Math.max(1, splitBetween - 1))}
              className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              value={splitBetween}
              onChange={(e) => handleSplitChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 bg-slate-700 text-white text-center text-xl font-bold py-2 rounded-lg"
            />
            <button
              onClick={() => handleSplitChange(splitBetween + 1)}
              className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold"
            >
              +
            </button>
          </div>
          {splitBetween > 1 && (
            <div className="text-slate-400 text-sm text-center">
              {amountPerPerson.toFixed(2)}€ por persona
            </div>
          )}
        </div>

        {/* Custom Split Button */}
        {orders.length > 0 && (
          <button
            onClick={() => setIsCustomSplit(true)}
            className="w-full p-3 bg-purple-500/20 hover:bg-purple-500/30 border-2 border-purple-500 rounded-lg transition-all"
          >
            <div className="flex items-center justify-center gap-2 text-purple-400">
              <UserPlus className="w-5 h-5" />
              <span className="font-medium">Dividir Personalizado</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Asigna cada plato a quien lo paga
            </div>
          </button>
        )}

        {/* Mixed Payment Details */}
        {method === 'mixed' && (
          <div className="space-y-3 bg-slate-700/50 p-4 rounded-lg">
            <div className="text-slate-300 text-sm font-medium">Distribución de Pago</div>
            
            <div className="space-y-2">
              <label className="text-slate-400 text-xs">Pagan en Efectivo</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCashPayers(Math.max(0, cashPayers - 1))}
                  className="w-8 h-8 bg-slate-600 hover:bg-slate-500 rounded text-white font-bold text-sm"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max={splitBetween}
                  value={cashPayers}
                  onChange={(e) => setCashPayers(Math.max(0, Math.min(splitBetween, parseInt(e.target.value) || 0)))}
                  className="flex-1 bg-slate-600 text-white text-center py-1 rounded"
                />
                <button
                  onClick={() => setCashPayers(Math.min(splitBetween, cashPayers + 1))}
                  className="w-8 h-8 bg-slate-600 hover:bg-slate-500 rounded text-white font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 text-xs">Pagan con Tarjeta</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCardPayers(Math.max(0, cardPayers - 1))}
                  className="w-8 h-8 bg-slate-600 hover:bg-slate-500 rounded text-white font-bold text-sm"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max={splitBetween}
                  value={cardPayers}
                  onChange={(e) => setCardPayers(Math.max(0, Math.min(splitBetween, parseInt(e.target.value) || 0)))}
                  className="flex-1 bg-slate-600 text-white text-center py-1 rounded"
                />
                <button
                  onClick={() => setCardPayers(Math.min(splitBetween, cardPayers + 1))}
                  className="w-8 h-8 bg-slate-600 hover:bg-slate-500 rounded text-white font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>

            {cashPayers + cardPayers !== splitBetween && (
              <div className="text-red-400 text-xs text-center">
                ⚠️ Total: {cashPayers + cardPayers}/{splitBetween} personas
              </div>
            )}
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-slate-700/50 p-4 rounded-lg space-y-2">
          <div className="text-slate-300 text-sm font-medium mb-2">Resumen</div>
          {(method === 'cash' || method === 'mixed') && cashAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">💵 Efectivo:</span>
              <span className="text-green-400 font-bold">{cashAmount.toFixed(2)}€</span>
            </div>
          )}
          {(method === 'card' || method === 'mixed') && cardAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">💳 Tarjeta:</span>
              <span className="text-blue-400 font-bold">{cardAmount.toFixed(2)}€</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-600">
            <span className="text-white">Total:</span>
            <span className="text-orange-500">{total.toFixed(2)}€</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            Confirmar Pago
          </button>
        </div>
      </div>
      
      {/* Custom Split Modal */}
      <CustomSplitModal
        isOpen={isCustomSplit}
        onClose={() => setIsCustomSplit(false)}
        orders={orders}
        onConfirm={(persons) => {
          setCustomSplitData(persons);
          setIsCustomSplit(false);
          // Calculate totals from custom split
          const cashTotal = persons.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.total, 0);
          const cardTotal = persons.filter(p => p.method === 'card').reduce((sum, p) => sum + p.total, 0);
          const cashCount = persons.filter(p => p.method === 'cash').length;
          const cardCount = persons.filter(p => p.method === 'card').length;
          
          // Update payment data
          onConfirm({
            method: cashCount > 0 && cardCount > 0 ? 'mixed' : (cashCount > 0 ? 'cash' : 'card'),
            splitBetween: persons.length,
            cashPayers: cashCount,
            cardPayers: cardCount,
            customSplit: persons
          });
        }}
      />
    </div>
  );
}
