import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { tr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Plus, CalendarIcon, MoreHorizontal, Pencil, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Invoice = Tables<"invoices">;
type InvoiceStatus = "pending" | "paid" | "overdue";

const statusConfig: Record<InvoiceStatus, { label: string; bg: string; text: string }> = {
  pending:  { label: "Bekleyen",  bg: "bg-[#F3F4F6]", text: "text-[#374151]" },
  paid:     { label: "Ödendi",    bg: "bg-[#D1FAE5]", text: "text-[#065F46]" },
  overdue:  { label: "Gecikmiş", bg: "bg-[#FEE2E2]", text: "text-[#991B1B]" },
};

const filters = [
  { value: "all", label: "Tümü" },
  { value: "pending", label: "Bekleyen" },
  { value: "paid", label: "Ödendi" },
  { value: "overdue", label: "Gecikmiş" },
];

const fmtAmount = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return format(new Date(d), "dd.MM.yyyy");
};

const generateInvoiceNo = (existingCount: number) => {
  const year = new Date().getFullYear();
  const seq = String(existingCount + 1).padStart(4, "0");
  return `SOL-${year}-${seq}`;
};

const emptyForm = {
  project_id: "",
  amount: "",
  issue_date: new Date(),
  due_date: addDays(new Date(), 14),
  description: "",
};

const Invoices = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState("all");

  // Auto-overdue: mark pending invoices past due date
  useEffect(() => {
    if (!user) return;
    const markOverdue = async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      await supabase
        .from("invoices")
        .update({ status: "overdue" as InvoiceStatus })
        .eq("status", "pending" as InvoiceStatus)
        .lt("due_date", today);
    };
    markOverdue();
  }, [user]);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, projects(title), clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, price, client_id, clients(name)")
        .order("title");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createInvoice = useMutation({
    mutationFn: async (values: typeof form) => {
      // Count existing invoices this year for invoice_no
      const year = new Date().getFullYear();
      const { count, error: countErr } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("created_at", `${year}-01-01T00:00:00Z`)
        .lt("created_at", `${year + 1}-01-01T00:00:00Z`);
      if (countErr) throw countErr;

      const invoiceNo = generateInvoiceNo(count ?? 0);
      const selectedProject = projects.find((p) => p.id === values.project_id);

      const insert: TablesInsert<"invoices"> = {
        user_id: user!.id,
        invoice_no: invoiceNo,
        project_id: values.project_id || null,
        client_id: selectedProject?.client_id ?? null,
        amount: values.amount ? parseFloat(values.amount) : 0,
        issue_date: format(values.issue_date, "yyyy-MM-dd"),
        due_date: format(values.due_date, "yyyy-MM-dd"),
        description: values.description || null,
        status: "pending",
      };
      const { error } = await supabase.from("invoices").insert(insert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Fatura oluşturuldu");
      closeModal();
    },
    onError: () => toast.error("Bir hata oluştu"),
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").update({ status: "paid" as InvoiceStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Fatura ödendi olarak işaretlendi");
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Fatura silindi");
    },
  });

  const openNew = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setForm(emptyForm);
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    setForm({
      ...form,
      project_id: projectId,
      amount: project?.price != null ? String(project.price) : form.amount,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.project_id) return;
    createInvoice.mutate(form);
  };

  const filtered = filter === "all" ? invoices : invoices.filter((inv) => inv.status === filter);

  return (
    <AppLayout>
      <div>
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Faturalarım</h1>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Fatura
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
        ) : filtered.length === 0 && filter === "all" && invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-medium text-foreground">Henüz fatura yok</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              İlk faturanı kes, tahsilatın başlasın.
            </p>
            <Button className="mt-6" onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              İlk Faturamı Oluştur
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground text-center">Bu filtreye uygun fatura yok.</p>
        ) : (
          <div className="mt-6 border border-border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB]">
                  <TableHead className="text-xs font-bold">Fatura No</TableHead>
                  <TableHead className="text-xs font-bold">Müşteri</TableHead>
                  <TableHead className="text-xs font-bold">Proje</TableHead>
                  <TableHead className="text-xs font-bold text-right">Tutar</TableHead>
                  <TableHead className="text-xs font-bold">Vade</TableHead>
                  <TableHead className="text-xs font-bold">Durum</TableHead>
                  <TableHead className="text-xs font-bold w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => {
                  const sc = statusConfig[inv.status as InvoiceStatus];
                  return (
                    <TableRow key={inv.id} className="hover:bg-[#F9FAFB] cursor-pointer border-b border-[#E5E7EB]">
                      <TableCell className="font-medium text-sm">{inv.invoice_no}</TableCell>
                      <TableCell className="text-sm">{(inv as any).clients?.name || "—"}</TableCell>
                      <TableCell className="text-sm">{(inv as any).projects?.title || "—"}</TableCell>
                      <TableCell className="text-sm text-right font-semibold">{fmtAmount(inv.amount)}</TableCell>
                      <TableCell className="text-sm">{fmtDate(inv.due_date)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("text-xs font-medium", sc.bg, sc.text, `hover:${sc.bg}`)}>
                          {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {inv.status !== "paid" && (
                              <DropdownMenuItem onClick={() => markPaid.mutate(inv.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Ödendi İşaretle
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => remove.mutate(inv.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* New Invoice Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni Fatura</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Proje *</Label>
                <Select value={form.project_id} onValueChange={handleProjectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Proje seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title} — {(p as any).clients?.name || "Müşteri yok"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Tutar (₺)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0,00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Düzenlenme Tarihi</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(form.issue_date, "dd.MM.yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.issue_date}
                        onSelect={(d) => d && setForm({ ...form, issue_date: d })}
                        locale={tr}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Vade Tarihi</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(form.due_date, "dd.MM.yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.due_date}
                        onSelect={(d) => d && setForm({ ...form, due_date: d })}
                        locale={tr}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">Açıklama</Label>
                <Textarea
                  id="desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="İsteğe bağlı not…"
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={closeModal}>İptal</Button>
                <Button type="submit" disabled={createInvoice.isPending}>Kaydet</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Invoices;
