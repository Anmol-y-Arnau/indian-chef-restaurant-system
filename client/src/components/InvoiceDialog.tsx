import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  FileText,
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  Download,
  QrCode,
  Check,
  X,
  Loader2,
  User,
  Receipt,
  Pencil,
  Trash2,
} from "lucide-react";
import QRCode from "qrcode";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string | number;
  menuItem: { id: string; name: string; price: number };
  quantity: number;
  spiceLevel?: string | null;
  notes?: string | null;
}

interface InvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  tableId: string;
  tableName: string;
  orders: OrderItem[];
  total: number;
}

type Step = "select_client" | "new_client" | "preview";

interface ClientForm {
  name: string;
  nif: string;
  address: string;
  city: string;
  email: string;
  phone: string;
}

const EMPTY_FORM: ClientForm = { name: "", nif: "", address: "", city: "", email: "", phone: "" };

// ─── Sub-components (MUST be at module level — never inside parent) ────────────

function ClientCard({
  client,
  onSelect,
  onEdit,
  onDelete,
  selected,
}: {
  client: { id: number; name: string; nif: string; city: string; email?: string | null; phone?: string | null };
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  selected: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
        selected
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          {selected ? <Check className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{client.name}</p>
          <p className="text-xs text-muted-foreground">{client.nif} · {client.city}</p>
        </div>
      </div>
      <div className="flex gap-1 ml-2 shrink-0">
        <button
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="Editar"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function InvoiceHistoryItem({
  invoice,
}: {
  invoice: { invoiceNumber: string; total: string; createdAt: Date };
}) {
  const date = new Date(invoice.createdAt).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded border border-border bg-muted/30 text-sm">
      <div className="flex items-center gap-2">
        <Receipt className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="font-mono text-xs">{invoice.invoiceNumber}</span>
      </div>
      <div className="flex items-center gap-3 text-muted-foreground text-xs">
        <span>{date}</span>
        <span className="font-semibold text-foreground">{parseFloat(invoice.total).toFixed(2)}€</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InvoiceDialog({ open, onClose, tableId, tableName, orders, total }: InvoiceDialogProps) {
  const { t } = useLanguage();

  const [step, setStep] = useState<Step>("select_client");
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [form, setForm] = useState<ClientForm>(EMPTY_FORM);
  const [taxRate, setTaxRate] = useState(10);
  const [generatedInvoice, setGeneratedInvoice] = useState<{
    invoiceNumber: string;
    pdfUrl: string;
    qrDataUrl: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // tRPC queries & mutations
  const { data: clients = [], refetch: refetchClients } = trpc.restaurant.getFrequentCustomers.useQuery();
  const { data: clientInvoices = [] } = trpc.restaurant.getInvoicesByCustomer.useQuery(
    { customerId: selectedClientId! },
    { enabled: selectedClientId !== null }
  );

  const addClientMutation = trpc.restaurant.addFrequentCustomer.useMutation({
    onSuccess: () => {
      refetchClients();
      toast.success(t("client_saved"));
    },
  });
  const updateClientMutation = trpc.restaurant.updateFrequentCustomer.useMutation({
    onSuccess: () => {
      refetchClients();
      toast.success(t("client_saved"));
    },
  });
  const deleteClientMutation = trpc.restaurant.deleteFrequentCustomer.useMutation({
    onSuccess: () => {
      refetchClients();
      if (selectedClientId === deleteClientMutation.variables?.id) {
        setSelectedClientId(null);
      }
      toast.success(t("client_deleted"));
    },
  });
  const createInvoiceMutation = trpc.restaurant.createInvoice.useMutation();
  const generatePDFMutation = trpc.restaurant.generateInvoicePDF.useMutation();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep("select_client");
      setSearch("");
      setSelectedClientId(null);
      setEditingClientId(null);
      setForm(EMPTY_FORM);
      setGeneratedInvoice(null);
      setIsGenerating(false);
    }
  }, [open]);

  // Compute invoice items from orders (grouped)
  const invoiceItems = (() => {
    const grouped = new Map<string, { name: string; quantity: number; unitPrice: number; total: number }>();
    for (const order of orders) {
      const key = order.menuItem.id;
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.quantity += order.quantity;
        existing.total = existing.quantity * existing.unitPrice;
      } else {
        grouped.set(key, {
          name: order.menuItem.name,
          quantity: order.quantity,
          unitPrice: order.menuItem.price,
          total: order.quantity * order.menuItem.price,
        });
      }
    }
    return Array.from(grouped.values());
  })();

  const subtotal = total / (1 + taxRate / 100);
  const taxAmount = total - subtotal;

  // Filtered clients
  const filteredClients = clients.filter((c) =>
    search === "" ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.nif.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleEditClient = (client: typeof clients[0]) => {
    setEditingClientId(client.id);
    setForm({
      name: client.name,
      nif: client.nif,
      address: client.address,
      city: client.city,
      email: client.email ?? "",
      phone: client.phone ?? "",
    });
    setStep("new_client");
  };

  const handleNewClient = () => {
    setEditingClientId(null);
    setForm(EMPTY_FORM);
    setStep("new_client");
  };

  const handleSaveClient = async () => {
    if (!form.name || !form.nif || !form.address || !form.city) {
      toast.error("Rellena los campos obligatorios");
      return;
    }
    if (editingClientId !== null) {
      await updateClientMutation.mutateAsync({ id: editingClientId, ...form });
      setStep("select_client");
    } else {
      const newClient = await addClientMutation.mutateAsync(form);
      if (newClient) setSelectedClientId(newClient.id);
      setStep("select_client");
    }
  };

  const handleDeleteClient = (id: number) => {
    if (confirm("¿Eliminar este cliente?")) {
      deleteClientMutation.mutate({ id });
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedClient) return;
    setIsGenerating(true);
    try {
      // 1. Create invoice record in DB
      const invoice = await createInvoiceMutation.mutateAsync({
        customerId: selectedClient.id,
        items: invoiceItems,
        subtotal,
        taxRate,
        taxAmount,
        total,
        tableId,
      });

      if (!invoice) throw new Error("No invoice returned");

      // 2. Generate PDF
      const pdfResult = await generatePDFMutation.mutateAsync({
        invoiceNumber: invoice.invoiceNumber,
        customer: {
          name: selectedClient.name,
          nif: selectedClient.nif,
          address: selectedClient.address,
          city: selectedClient.city,
          email: selectedClient.email,
          phone: selectedClient.phone,
        },
        items: invoiceItems,
        subtotal,
        taxRate,
        taxAmount,
        total,
        tableId,
        createdAt: new Date(invoice.createdAt),
      });

      // 3. Generate QR code pointing to the PDF URL
      const qrDataUrl = await QRCode.toDataURL(pdfResult.url, {
        width: 200,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });

      setGeneratedInvoice({
        invoiceNumber: invoice.invoiceNumber,
        pdfUrl: pdfResult.url,
        qrDataUrl,
      });
      setStep("preview");
      toast.success(t("invoice_generated"));
    } catch (error) {
      console.error("Invoice generation error:", error);
      toast.error(t("invoice_error"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedInvoice) {
      navigator.clipboard.writeText(generatedInvoice.pdfUrl);
      toast.success(t("invoice_link_copied"));
    }
  };

  const handleDownload = () => {
    if (generatedInvoice) {
      const a = document.createElement("a");
      a.href = generatedInvoice.pdfUrl;
      a.download = `${generatedInvoice.invoiceNumber}.pdf`;
      a.target = "_blank";
      a.click();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl flex flex-col"
          style={{ maxHeight: "90vh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              {step !== "select_client" && (
                <button
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                  onClick={() => setStep(step === "preview" ? "select_client" : "select_client")}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <Dialog.Title className="font-heading text-lg text-primary flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {step === "select_client" && t("generate_invoice")}
                  {step === "new_client" && (editingClientId ? t("edit_client") : t("new_client"))}
                  {step === "preview" && t("invoice_preview")}
                </Dialog.Title>
                <p className="text-xs text-muted-foreground">{tableName}</p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto min-h-0">

            {/* ── STEP 1: Select Client ── */}
            {step === "select_client" && (
              <div className="p-5 space-y-4">
                {/* Invoice summary */}
                <div className="bg-muted/40 rounded-xl p-4 border border-border">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Resumen del pedido</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {invoiceItems.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                        <span className="font-mono">{item.total.toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Base: {subtotal.toFixed(2)}€ + IVA {taxRate}%: {taxAmount.toFixed(2)}€
                    </span>
                    <span className="font-bold text-primary">{total.toFixed(2)}€</span>
                  </div>
                </div>

                {/* IVA selector */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm shrink-0">{t("tax_rate")}:</Label>
                  <div className="flex gap-2">
                    {[0, 4, 10, 21].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setTaxRate(rate)}
                        className={cn(
                          "px-3 py-1 rounded-full text-sm border transition-all",
                          taxRate === rate
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("search_client")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Client list */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {filteredClients.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">{t("no_clients")}</p>
                  ) : (
                    filteredClients.map((client) => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        selected={selectedClientId === client.id}
                        onSelect={() => setSelectedClientId(client.id === selectedClientId ? null : client.id)}
                        onEdit={() => handleEditClient(client)}
                        onDelete={() => handleDeleteClient(client.id)}
                      />
                    ))
                  )}
                </div>

                {/* Last invoices for selected client */}
                {selectedClient && clientInvoices.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{t("last_invoices")}</p>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto">
                      {clientInvoices.slice(0, 5).map((inv) => (
                        <InvoiceHistoryItem key={inv.id} invoice={inv} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleNewClient}
                  >
                    <Plus className="w-4 h-4" />
                    {t("new_client")}
                  </Button>
                  <Button
                    className="flex-1 gap-2 gradient-primary text-primary-foreground border-0"
                    disabled={!selectedClientId || isGenerating}
                    onClick={handleGenerateInvoice}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    {t("generate_invoice")}
                    {selectedClient && <ChevronRight className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 2: New / Edit Client ── */}
            {step === "new_client" && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-sm">{t("client_name")} *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Empresa S.L. / Juan García"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">{t("client_nif")} *</Label>
                    <Input
                      value={form.nif}
                      onChange={(e) => setForm({ ...form, nif: e.target.value })}
                      placeholder="B12345678 / 12345678A"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">{t("client_city")} *</Label>
                    <Input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="Barcelona"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-sm">{t("client_address")} *</Label>
                    <Input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Calle Mayor, 1"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">{t("client_email")}</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@empresa.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">{t("client_phone")}</Label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="600 000 000"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep("select_client")}>
                    {t("cancel")}
                  </Button>
                  <Button
                    className="flex-1 gradient-primary text-primary-foreground border-0"
                    onClick={handleSaveClient}
                    disabled={addClientMutation.isPending || updateClientMutation.isPending}
                  >
                    {(addClientMutation.isPending || updateClientMutation.isPending) && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    {t("confirm")}
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Preview ── */}
            {step === "preview" && generatedInvoice && selectedClient && (
              <div className="p-5 space-y-5">
                {/* Invoice number badge */}
                <div className="flex items-center justify-center">
                  <div className="bg-primary/10 border border-primary/30 rounded-full px-5 py-2 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-primary" />
                    <span className="font-mono font-bold text-primary text-lg">{generatedInvoice.invoiceNumber}</span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white p-3 rounded-xl shadow-md border border-border">
                    <img
                      src={generatedInvoice.qrDataUrl}
                      alt="QR Factura"
                      className="w-40 h-40"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Escanea para ver/descargar la factura en PDF
                  </p>
                </div>

                {/* Client summary */}
                <div className="bg-muted/40 rounded-xl p-4 border border-border space-y-1">
                  <p className="font-semibold text-sm">{selectedClient.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedClient.nif}</p>
                  <p className="text-xs text-muted-foreground">{selectedClient.address}, {selectedClient.city}</p>
                </div>

                {/* Totals */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("tax_base")}</span>
                    <span>{subtotal.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("tax_rate")} ({taxRate}%)</span>
                    <span>{taxAmount.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between font-bold text-primary text-base pt-1 border-t border-border">
                    <span>{t("total")}</span>
                    <span>{total.toFixed(2)}€</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleCopyLink}
                  >
                    <QrCode className="w-4 h-4" />
                    {t("copy_invoice_link")}
                  </Button>
                  <Button
                    className="flex-1 gap-2 gradient-primary text-primary-foreground border-0"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4" />
                    {t("download_invoice")}
                  </Button>
                </div>

                <Button variant="ghost" className="w-full text-sm" onClick={onClose}>
                  Cerrar
                </Button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
