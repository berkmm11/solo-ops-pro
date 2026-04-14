import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TablesInsert } from "@/integrations/supabase/types";
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
import { Users, Plus, MoreHorizontal, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

type TrustScore = "A" | "B" | "C";

interface InvoiceStats {
  client_id: string;
  total_invoices: number;
  overdue_count: number;
  ontime_count: number;
  computed_score: TrustScore;
}

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
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const { data: statsMap = {} } = useQuery({
    queryKey: ["client-invoice-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_client_invoice_stats", {
        p_user_id: user!.id,
      });
      if (error) throw error;
      const map: Record<string, InvoiceStats> = {};
      (data as InvoiceStats[]).forEach((s) => { map[s.client_id] = s; });
      return map;
    },
    enabled: !!user,
  });

  const getStats = (clientId: string): InvoiceStats =>
    statsMap[clientId] ?? { client_id: clientId, total_invoices: 0, overdue_count: 0, ontime_count: 0, computed_score: "A" as TrustScore };

  const upsert = useMutation({
    mutationFn: async (values: typeof form) => {
      if (editing) {
        const { error } = await supabase.from("clients").update(values).eq("id", editing.id);
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

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", tax_no: c.tax_no ?? "" });
    setOpen(true);
  };
  const closeModal = () => { setOpen(false); setEditing(null); setForm(emptyForm); };

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
            <Button className="mt-6" onClick={openNew}>Müşteri Ekle</Button>
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
                {clients.map((c) => {
                  const stats = getStats(c.id);
                  const badge = trustBadge[stats.computed_score];
                  const isExpanded = expandedId === c.id;
                  return (
                    <>
                      <TableRow
                        key={c.id}
                        className="cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1.5">
                            {c.name}
                            {isExpanded
                              ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                              : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            }
                          </div>
                        </TableCell>
                        <TableCell>{c.phone || "—"}</TableCell>
                        <TableCell>{c.tax_no || "—"}</TableCell>
                        <TableCell>{(c as any).projects?.length ?? 0}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`rounded-full ${badge.className}`}>
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
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
                      {isExpanded && (
                        <TableRow key={`${c.id}-detail`}>
                          <TableCell colSpan={6} className="bg-accent/30 px-6 py-3">
                            <p className="text-sm text-muted-foreground">
                              Bu müşteri{" "}
                              <span className="font-medium text-foreground">
                                {stats.ontime_count} fatura zamanında
                              </span>
                              ,{" "}
                              <span className={`font-medium ${stats.overdue_count > 0 ? "text-red-600" : "text-foreground"}`}>
                                {stats.overdue_count} fatura geç
                              </span>{" "}
                              ödedi.
                            </p>
                            {stats.total_invoices === 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Henüz fatura kaydı yok — güven skoru varsayılan olarak A.
                              </p>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
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
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_no">Vergi No</Label>
                <Input id="tax_no" value={form.tax_no} onChange={(e) => setForm({ ...form, tax_no: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeModal}>İptal</Button>
                <Button type="submit" disabled={upsert.isPending}>{editing ? "Güncelle" : "Ekle"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Clients;
