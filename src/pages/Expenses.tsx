import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Receipt, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type ExpenseCategory = "kira" | "vergi" | "abonelik" | "diger";

const categoryLabels: Record<ExpenseCategory, string> = {
  kira: "Kira",
  vergi: "Vergi",
  abonelik: "Abonelik",
  diger: "Diğer",
};

const fmt = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const Expenses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("diger");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("expenses").insert({
        user_id: user!.id,
        name,
        amount: parseFloat(amount),
        category,
        expense_date: expenseDate,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Gider kaydedildi");
      resetForm();
    },
    onError: () => toast.error("Bir şeyler ters gitti, tekrar deneyin"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Gider silindi");
    },
    onError: () => toast.error("Bir şeyler ters gitti, tekrar deneyin"),
  });

  const resetForm = () => {
    setModalOpen(false);
    setName("");
    setAmount("");
    setCategory("diger");
    setExpenseDate(new Date().toISOString().split("T")[0]);
  };

  const totalSum = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const handleSubmit = () => {
    if (!name.trim() || !amount || parseFloat(amount) <= 0) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }
    addMutation.mutate();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Giderler</h1>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Gider Ekle
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
        ) : expenses.length === 0 ? (
          <EmptyState
            emoji="💰"
            title="Henüz gider kaydı yok"
            description="Giderlerinizi ekleyin, harcanabilir bakiyeniz otomatik hesaplansın."
            actionLabel="Gider Ekle"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gider Adı</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                        {categoryLabels[e.category as ExpenseCategory] ?? e.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(e.expense_date), "d MMM yyyy", { locale: tr })}
                    </TableCell>
                    <TableCell className="text-right font-semibold">₺{fmt(Number(e.amount))}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(e.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={3} className="font-semibold">Toplam</TableCell>
                  <TableCell className="text-right font-bold text-lg">₺{fmt(totalSum)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Expense Modal */}
        <Dialog open={modalOpen} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Gider Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Gider Adı</label>
                <Input
                  placeholder="Örn: Ofis kirası"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Tutar (₺)</label>
                <Input
                  type="number"
                  placeholder="0"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Kategori</label>
                <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kira">Kira</SelectItem>
                    <SelectItem value="vergi">Vergi</SelectItem>
                    <SelectItem value="abonelik">Abonelik</SelectItem>
                    <SelectItem value="diger">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Tarih</label>
                <Input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>İptal</Button>
              <Button onClick={handleSubmit} disabled={addMutation.isPending}>
                {addMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Expenses;
