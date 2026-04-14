import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Client = Tables<"clients">;
type TrustScore = "A" | "B" | "C";

const trustBadge: Record<TrustScore, { label: string; className: string }> = {
  A: { label: "A", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  B: { label: "B", className: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
  C: { label: "C", className: "bg-red-100 text-red-800 hover:bg-red-100" },
};

const emptyForm = { name: "", email: "", phone: "", tax_no: "" };

const Clients = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*, projects(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async (values: typeof form) => {
      if (editing) {
        const { error } = await supabase
          .from("clients")
          .update(values)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const insert: TablesInsert<"clients"> = { ...values, user_id: user!.id };
        const { error } = await supabase.from("clients").insert(insert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success(editing ? "Müşteri güncellendi" : "Müşteri eklendi");
      closeModal();
    },
    onError: () => toast.error("Bir hata oluştu"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Müşteri silindi");
    },
    onError: () => toast.error("Silinemedi"),
  });

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", tax_no: c.tax_no ?? "" });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    upsert.mutate(form);
  };

  return (
    <AppLayout>
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Müşteriler</h1>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Müşteri
          </Button>
        </div>

        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Yükleniyor…</p>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-medium text-foreground">Henüz müşteri yok</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Müşterilerinizi ekleyerek projelerinizi ve faturalarınızı kolayca yönetin.
            </p>
            <Button className="mt-6" onClick={openNew}>
              Müşteri Ekle
            </Button>
          </div>
        ) : (
          <div className="mt-6 border border-border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İsim</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Vergi No</TableHead>
                  <TableHead>Projeler</TableHead>
                  <TableHead>Güven</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone || "—"}</TableCell>
                    <TableCell>{c.tax_no || "—"}</TableCell>
                    <TableCell>{(c as any).projects?.length ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={trustBadge[c.trust_score].className}>
                        {trustBadge[c.trust_score].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(c)}>
                            <Pencil className="mr-2 h-4 w-4" /> Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => remove.mutate(c.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Müşteriyi Düzenle" : "Yeni Müşteri"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">İsim *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_no">Vergi No</Label>
                <Input
                  id="tax_no"
                  value={form.tax_no}
                  onChange={(e) => setForm({ ...form, tax_no: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeModal}>
                  İptal
                </Button>
                <Button type="submit" disabled={upsert.isPending}>
                  {editing ? "Güncelle" : "Ekle"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Clients;
