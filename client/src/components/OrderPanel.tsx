import { useState } from "react";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { sortOrdersByCategory } from "@/lib/orderUtils";
import { Copy, QrCode, Minus, Printer, Trash2, X, Bluetooth, FileText } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";
import PaymentModal, { type PaymentData } from "./PaymentModal";
import { QRCodeModal } from "./QRCodeModal";
import { InvoiceDialog } from "./InvoiceDialog";
import { trpc } from "@/lib/trpc";
import { MENU_ITEMS } from "@/lib/data";

import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { toast } from "sonner";

export function OrderPanel() {
  const { t, language } = useLanguage();
  const { 
    activeTableId, 
    tables, 
    removeOrderFromTable, 
    getTableTotal, 
    updateTableStatus, 
    clearTable,
    setActiveTableId,
    closeTable
  } = useRestaurant();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [qrData, setQrData] = useState<{ url: string; ticketNumber: number } | null>(null);
  
  // MUST be called before any conditional returns (Rules of Hooks)
  const generatePDFMutation = trpc.restaurant.generateTicketPDF.useMutation();
  const haptic = useHaptic();

  if (!activeTableId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-card/50 border-l border-border">
        <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <img src="/images/chef-icon.png" alt="Chef" className="w-16 h-16 opacity-50" />
        </div>
        <h3 className="font-heading text-xl mb-2">{t('welcome_title')}</h3>
        <p>{t('welcome_desc')}</p>
        <Button 
          className="mt-6 md:hidden" 
          onClick={() => document.getElementById('mobile-menu-trigger')?.click()}
        >
          {t('select_table')}
        </Button>
      </div>
    );
  }

  const table = tables.find(t => t.id === activeTableId);
  if (!table) return null;

  const total = getTableTotal(activeTableId);

  const handlePrint = async () => {
    if (table.orders.length === 0) {
      toast.error(t('no_orders_print'));
      return;
    }
    
    try {
      // Import Bluetooth printer service
      const { printTicket, isPrinterConnected } = await import('@/lib/bluetoothPrinter');
      
      // Get ticket number from localStorage or start at 1
      const lastTicketNumber = parseInt(localStorage.getItem('lastTicketNumber') || '0');
      const ticketNumber = lastTicketNumber + 1;
      
      // Prepare ticket data
      const sortedOrders = sortOrdersByCategory(table.orders);
      const ticketData = {
        tableId: table.name,
        items: sortedOrders.map(o => ({
          name: o.menuItem.name,
          quantity: o.quantity,
          price: o.menuItem.price,
          spiceLevel: o.spiceLevel,
          notes: o.notes,
        })),
        total,
        date: new Date(),
        ticketNumber,
      };
      
      // Print ticket
      const success = await printTicket(ticketData);
      
      if (success) {
        // Save ticket number globally and for this table
        localStorage.setItem('lastTicketNumber', ticketNumber.toString());
        localStorage.setItem(`ticketNumber_${table.id}`, ticketNumber.toString());
        toast.success(t('ticket_sent_printer'));
        updateTableStatus(activeTableId, 'payment_pending');
      } else {
        toast.error('Error al imprimir. Verifica la conexión Bluetooth.');
      }
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Error al conectar con la impresora. Asegúrate de que Bluetooth esté activado.');
    }
  };

  const handlePayment = () => {
    // Clear ticket number for this table when payment is initiated
    localStorage.removeItem(`ticketNumber_${table.id}`);
    if (table.orders.length === 0) {
      toast.error('No hay pedidos para pagar');
      return;
    }
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = (paymentData: PaymentData) => {
    setShowPaymentModal(false);
    closeTable(activeTableId, paymentData);
    setActiveTableId(null);
    haptic.success(); // Vibración de éxito al completar pago
    toast.success('Pago registrado correctamente');
  };



  const getTicketText = () => {
    const date = new Date().toLocaleString();
    const sortedOrders = sortOrdersByCategory(table.orders);
    
    // Agrupar items iguales para evitar líneas duplicadas
    const grouped = new Map<string, { name: string; quantity: number; price: number; notes?: string }>();
    for (const o of sortedOrders) {
      const key = `${o.menuItem.name}||${o.notes || ''}`;
      if (grouped.has(key)) {
        grouped.get(key)!.quantity += o.quantity;
      } else {
        grouped.set(key, { name: o.menuItem.name, quantity: o.quantity, price: o.menuItem.price, notes: o.notes });
      }
    }
    
    const items = Array.from(grouped.values()).map(o => {
      let line = `${o.quantity}x ${o.name} (${(o.price * o.quantity).toFixed(2)}\u20ac)`;
      if (o.notes) line += `\n   \ud83d\udcdd ${o.notes}`;
      return line;
    }).join('\n');
    return `*INDIAN CHEF RESTAURANT*\n----------------------\nMesa: ${table.name}\nFecha: ${date}\n----------------------\n${items}\n----------------------\n*TOTAL: ${total.toFixed(2)}\u20ac*\n----------------------\n\u00a1Gracias por su visita!`;
  };

  const handleCopyTicket = () => {
    if (table.orders.length === 0) return;
    navigator.clipboard.writeText(getTicketText());
    toast.success(t('ticket_copied'));
  };

  const handleGenerateQR = async () => {
    if (table.orders.length === 0) return;
    
    try {
      toast.loading('Generando ticket PDF...');
      
      // Get or generate ticket number
      let ticketNumber = parseInt(localStorage.getItem(`ticketNumber_${table.id}`) || '0');
      if (ticketNumber === 0) {
        // If not printed yet, generate new ticket number
        const lastTicketNumber = parseInt(localStorage.getItem('lastTicketNumber') || '0');
        ticketNumber = lastTicketNumber + 1;
        localStorage.setItem('lastTicketNumber', ticketNumber.toString());
        localStorage.setItem(`ticketNumber_${table.id}`, ticketNumber.toString());
      }
      
      // Preparar datos de los pedidos para el backend
      const ordersForBackend = table.orders.map(order => ({
        id: typeof order.id === 'string' ? parseInt(order.id) : order.id,
        tableId: String(table.id),
        itemId: order.menuItem.id,
        itemName: order.menuItem.name,
        itemPrice: order.menuItem.price.toFixed(2),
        quantity: order.quantity,
        isDelivered: order.isDelivered ? 1 : 0,
        spiceLevel: order.spiceLevel || null,
        notes: order.notes || null,
        createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
        updatedAt: new Date(),
        menuItem: {
          name: order.menuItem.name,
          price: order.menuItem.price,
        },
      }));
      
      // Generar PDF y subir a S3
      const result = await generatePDFMutation.mutateAsync({
        tableId: table.name,
        orders: ordersForBackend,
        total,
        ticketNumber,
      });
      
      toast.dismiss();
      toast.success('Código QR generado');
      
      // Mostrar modal con QR
      setQrData({ url: result.url, ticketNumber });
      setShowQRModal(true);
    } catch (error) {
      toast.dismiss();
      toast.error('Error al generar el PDF');
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-card border-l border-border shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
        <div>
          <h2 className="font-heading text-xl text-primary">{table.name}</h2>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full border",
            table.status === 'free' ? "bg-green-500/10 border-green-500/50 text-green-500" :
            table.status === 'occupied' ? "bg-secondary/10 border-secondary/50 text-secondary" :
            "bg-accent/10 border-accent/50 text-accent"
          )}>
            {table.status === 'free' ? t('free') : table.status === 'occupied' ? t('occupied') : t('payment_pending')}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => document.getElementById('close-mobile-order-panel')?.click()} className="md:hidden">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Order List */}
      <ScrollArea className="flex-1 p-4 min-h-0">
        {table.orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-60 mt-10">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/99644924/lUdxRzpijMEVVSby.jpg" alt="Empty" className="w-32 h-32 object-cover rounded-full mb-4 opacity-50 grayscale" />
            <p>{t('empty_order')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortOrdersByCategory(table.orders).map((order) => (
              <div key={order.id} className="flex items-start justify-between group animate-in slide-in-from-right-5 duration-300">
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium text-sm">
                      <span className="text-primary font-bold mr-2">{order.quantity}x</span>
                      {language === 'en' && order.menuItem.name_en ? order.menuItem.name_en : 
                       language === 'fr' && order.menuItem.name_fr ? order.menuItem.name_fr : 
                       order.menuItem.name}
                    </span>
                    <span className="text-sm font-mono ml-2">
                      {(order.menuItem.price * order.quantity).toFixed(2)}€
                    </span>
                  </div>
                  {/* Indicadores de picante y notas ocultos - solo visibles en modo cocina */}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    removeOrderFromTable(activeTableId, String(order.id));
                    haptic.medium(); // Vibración media al eliminar item
                  }}
                >
                  <Minus className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 bg-muted/30 border-t border-border space-y-4 shrink-0 z-10 bg-card shadow-[0_-5px_10px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-end">
          <span className="text-muted-foreground text-sm">{t('total')}</span>
          <span className="text-3xl font-heading text-primary">{total.toFixed(2)}€</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 border-primary/50 hover:gradient-primary hover:text-primary-foreground hover:border-transparent px-2"
              onClick={handleCopyTicket}
              disabled={table.orders.length === 0}
              title={t('copy_ticket')}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-primary/50 hover:bg-primary/10 hover:text-primary px-2"
              onClick={handleGenerateQR}
              disabled={table.orders.length === 0}
              title="Generar código QR"
            >
              <QrCode className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-primary/50 hover:bg-primary/10 hover:text-primary px-2"
              onClick={handlePrint}
              disabled={table.orders.length === 0}
              title={t('print_ticket')}
            >
              <Printer className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500 px-2"
              onClick={() => setShowInvoiceDialog(true)}
              disabled={table.orders.length === 0}
              title={t('generate_invoice')}
            >
              <FileText className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            variant="default" 
            className="w-full gradient-primary text-primary-foreground hover:glow-magenta border-0"
            onClick={handlePayment}
            disabled={table.orders.length === 0}
          >
            {t('pay')}
          </Button>
        </div>
        
        {table.status !== 'free' && (
          <Button 
            variant="ghost" 
            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive text-xs h-8"
            onClick={() => {
              if(confirm(t('confirm_cancel'))) clearTable(activeTableId);
            }}
          >
            <Trash2 className="w-3 h-3 mr-2" />
            {t('release_table')}
          </Button>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={total}
        orders={table.orders}
        onConfirm={handleConfirmPayment}
      />

      {/* QR Code Modal */}
      {qrData && (
        <QRCodeModal
          open={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setQrData(null);
          }}
          pdfUrl={qrData.url}
          ticketNumber={qrData.ticketNumber}
          tableName={table.name}
        />
      )}

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={showInvoiceDialog}
        onClose={() => setShowInvoiceDialog(false)}
        tableId={String(table.id)}
        tableName={table.name}
        orders={table.orders}
        total={total}
      />
    </div>
  );
}
