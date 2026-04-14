import { useState } from "react";
import EmptyState from "@/components/EmptyState";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Currency, currencies, currencyConfig, fmtMoney } from "@/lib/currency";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { FolderKanban, Plus, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Project = Tables<"projects">;
type Client = Tables<"clients">;
type ProjectStatus = "taslak" | "aktif" | "faturalandı" | "ödendi";

const statusConfig: Record<ProjectStatus, { label: string; bg: string; text: string }> = {
  taslak:      { label: "Taslak",      bg: "bg-[#F3F4F6]", text: "text-[#374151]" },
  aktif:       { label: "Aktif",       bg: "bg-[#DBEAFE]", text: "text-[#1E40AF]" },
  "faturalandı": { label: "Faturalandı", bg: "bg-[#CCFBF1]", text: "text-[#0F766E]" },
  "ödendi":    { label: "Ödendi",      bg: "bg-[#D1FAE5]", text: "text-[#065F46]" },
};

const filters: { value: string; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "taslak", label: "Taslak" },
  { value: "aktif", label: "Aktif" },
  { value: "faturalandı", label: "Faturalandı" },
  { value: "ödendi", label: "Ödendi" },
];

const formatPrice = (n: number | null, currency: Currency = "TRY") => {
  if (n == null) return "—";
  return fmtMoney(n, currency);
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  return format(new Date(d), "dd.MM.yyyy");
};

const emptyForm = { title: "", client_id: "", price: "", deadline: undefined as Date | undefined, status: "taslak" as ProjectStatus, currency: "TRY" as Currency };

const Projects = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState("all");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data as Pick<Client, "id" | "name">[];
    },
    enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async (values: typeof form) => {
      const payload: any = {
        title: values.title,
        client_id: values.client_id || null,
        price: values.price ? parseFloat(values.price) : null,
        deadline: values.deadline ? format(values.deadline, "yyyy-MM-dd") : null,
        status: values.status,
      };
      if (editing) {
        const { error } = await supabase.from("projects").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const insert: TablesInsert<"projects"> = { ...payload, user_id: user!.id };
        const { error } = await supabase.from("projects").insert(insert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(editing ? "Proje güncellendi" : "Proje eklendi");
      closeModal();
    },
    onError: () => toast.error("Bir hata oluştu"),
  });

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      title: p.title,
      client_id: p.client_id ?? "",
      price: p.price != null ? String(p.price) : "",
      deadline: p.deadline ? new Date(p.deadline) : undefined,
      status: p.status as ProjectStatus,
      currency: ((p as any).currency || "TRY") as Currency,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    upsert.mutate(form);
  };

  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);

  return (
    <AppLayout>
      <div>
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Projelerim</h1>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Proje
          </Button>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full border transition-colors",
                filter === f.value
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-border hover:bg-accent"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <p className="mt-8 text-sm text-muted-foreground">Yükleniyor…</p>
        ) : filtered.length === 0 && filter === "all" && projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            emoji="📁"
            title="Henüz proje yok"
            description="Yeni bir proje ekleyerek müşterilerinizi ve işlerinizi takip etmeye başlayın."
            actionLabel="Yeni Proje Ekle"
            onAction={openNew}
          />
        ) : filtered.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground text-center">Bu filtreye uygun proje yok.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {filtered.map((p) => {
              const sc = statusConfig[p.status as ProjectStatus];
              const clientName = (p as any).clients?.name;
              return (
                <div
                  key={p.id}
                  onClick={() => openEdit(p)}
                  className="border border-border rounded-xl p-5 bg-background cursor-pointer transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{clientName || "—"}</span>
                    <Badge variant="secondary" className={cn("text-xs font-medium", sc.bg, sc.text, "hover:" + sc.bg)}>
                      {sc.label}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mt-2">{p.title}</h3>
                  <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{formatPrice(p.price)}</span>
                    <span>{formatDate(p.deadline)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Projeyi Düzenle" : "Yeni Proje"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Müşteri *</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Fiyat (₺)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Teslim Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !form.deadline && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.deadline ? format(form.deadline, "dd.MM.yyyy") : "Tarih seçin"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.deadline}
                      onSelect={(d) => setForm({ ...form, deadline: d })}
                      locale={tr}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Durum</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProjectStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={closeModal}>İptal</Button>
                <Button type="submit" disabled={upsert.isPending}>Kaydet</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Projects;
