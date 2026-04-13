import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Users, Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FrequentCustomer {
  id: number;
  name: string;
  nif: string;
  address: string;
  city: string;
}

export function FrequentCustomersDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<FrequentCustomer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    nif: "",
    address: "",
    city: "",
  });

  const { data: customers = [], refetch } = trpc.restaurant.getFrequentCustomers.useQuery(undefined, {
    enabled: isOpen,
  });

  const addMutation = trpc.restaurant.addFrequentCustomer.useMutation({
    onSuccess: () => {
      toast.success("Cliente añadido correctamente");
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Error al añadir cliente: ${error.message}`);
    },
  });

  const updateMutation = trpc.restaurant.updateFrequentCustomer.useMutation({
    onSuccess: () => {
      toast.success("Cliente actualizado correctamente");
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Error al actualizar cliente: ${error.message}`);
    },
  });

  const deleteMutation = trpc.restaurant.deleteFrequentCustomer.useMutation({
    onSuccess: () => {
      toast.success("Cliente eliminado correctamente");
      refetch();
    },
    onError: (error) => {
      toast.error(`Error al eliminar cliente: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({ name: "", nif: "", address: "", city: "" });
    setIsEditing(false);
    setEditingCustomer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.nif || !formData.address || !formData.city) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    if (isEditing && editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, ...formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const handleEdit = (customer: FrequentCustomer) => {
    setFormData({
      name: customer.name,
      nif: customer.nif,
      address: customer.address,
      city: customer.city,
    });
    setEditingCustomer(customer);
    setIsEditing(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Users className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Clientes Frecuentes</DialogTitle>
          <DialogDescription>
            Gestiona los datos de tus clientes para generar facturas rápidamente
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
          {/* Formulario */}
          <div className="border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              {isEditing ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre / Razón Social *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Empresa S.L. / Juan García"
                />
              </div>
              <div>
                <Label htmlFor="nif">NIF / CIF *</Label>
                <Input
                  id="nif"
                  value={formData.nif}
                  onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                  placeholder="B12345678 / 12345678A"
                />
              </div>
              <div>
                <Label htmlFor="address">Dirección *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Calle Mayor, 1"
                />
              </div>
              <div>
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Barcelona"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {isEditing ? "Actualizar" : "Añadir"}
                </Button>
                {isEditing && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Lista de clientes */}
          <div className="border rounded-lg p-4 bg-card overflow-hidden flex flex-col">
            <h3 className="font-semibold mb-4">Clientes Guardados ({customers.length})</h3>
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {customers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay clientes guardados
                  </p>
                ) : (
                  customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="border rounded-lg p-3 bg-background hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm break-words leading-tight">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">NIF: {customer.nif}</p>
                          <p className="text-xs text-muted-foreground break-words">
                            {customer.address}
                          </p>
                          <p className="text-xs text-muted-foreground">{customer.city}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(customer)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(customer.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
