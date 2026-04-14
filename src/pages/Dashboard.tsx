import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Receipt, Landmark,
  ChevronDown, ChevronUp, Wallet, HandCoins, TrendingUp,
  FolderKanban, RefreshCw, LayoutDashboard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Currency, fmtMoney } from "@/lib/currency";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import ExchangeRateBar from "@/components/ExchangeRateBar";
import ProjectStatusDonut from "@/components/dashboard/ProjectStatusDonut";

const fmt = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const projectStatusConfig: Record<string, { label: string; color: string; dotClass: string }> = {
  taslak:       { label: "Taslak",       color: "#9CA3AF", dotClass: "bg-gray-400" },
  aktif:        { label: "Aktif",        color: "#3B82F6", dotClass: "bg-blue-500" },
  "faturalandı": { label: "Faturalandı", color: "#8B5CF6", dotClass: "bg-violet-500" },
  "ödendi":     { label: "Ödendi",       color: "#10B981", dotClass: "bg-emerald-500" },
};

const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [giderOpen, setGiderOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [heroCurrency, setHeroCurrency] = useState<"TRY" | "USD" | "EUR">("TRY");
  const { data: rates, isLoading: ratesLoading } = useExchangeRates();

  // ── Fetch real data ──
  const { data: projects = [], isLoading: projLoading } = useQuery({
    queryKey: ["dashboard-projects"],
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

  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ["dashboard-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: expenses = [], isLoading: expLoading } = useQuery({
    queryKey: ["dashboard-expenses"],
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

  const isLoading = projLoading || invLoading || expLoading;

  // ── Realtime subscriptions ──
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["dashboard-projects"] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["dashboard-invoices"] });
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["dashboard-expenses"] });
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  // ── Computed stats ──
  const totalAlacakTRY = useMemo(
    () => invoices.filter((i) => i.status !== "paid" && (i.currency || "TRY") === "TRY").reduce((s, i) => s + Number(i.amount), 0),
    [invoices]
  );

  const pendingForeign = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    invoices
      .filter((i) => i.status !== "paid" && (i.currency || "TRY") !== "TRY")
      .forEach((i) => {
        const c = i.currency || "TRY";
        byCurrency[c] = (byCurrency[c] || 0) + Number(i.amount);
      });
    return byCurrency;
  }, [invoices]);

  const buAyKazanc = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    return invoices
      .filter((i) => i.status === "paid" && i.issue_date >= monthStart && (i.currency || "TRY") === "TRY")
      .reduce((s, i) => s + Number(i.amount), 0);
  }, [invoices]);

  const aktifProjeSayisi = useMemo(
    () => projects.filter((p) => p.status === "aktif").length,
    [projects]
  );

  // Total earnings in TRY (paid invoices)
  const toplamGelirTRY = useMemo(
    () => invoices.filter((i) => i.status === "paid" && (i.currency || "TRY") === "TRY").reduce((s, i) => s + Number(i.amount), 0),
    [invoices]
  );

  // Foreign paid earnings
  const paidForeign = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    invoices
      .filter((i) => i.status === "paid" && (i.currency || "TRY") !== "TRY")
      .forEach((i) => {
        const c = i.currency || "TRY";
        byCurrency[c] = (byCurrency[c] || 0) + Number(i.amount);
      });
    return byCurrency;
  }, [invoices]);

  // Convert foreign paid to TRY
  const paidForeignInTRY = useMemo(() => {
    if (!rates) return 0;
    let total = 0;
    Object.entries(paidForeign).forEach(([c, amt]) => {
      if (c === "USD") total += amt * rates.USD;
      else if (c === "EUR") total += amt * rates.EUR;
    });
    return total;
  }, [paidForeign, rates]);

  // Real expenses total
  const toplamGider = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  );

  // Convert foreign pending to TRY
  const foreignInTRY = useMemo(() => {
    if (!rates) return 0;
    let total = 0;
    Object.entries(pendingForeign).forEach(([c, amt]) => {
      if (c === "USD") total += amt * rates.USD;
      else if (c === "EUR") total += amt * rates.EUR;
    });
    return total;
  }, [pendingForeign, rates]);

  // Toplam kazanç = TRY paid + foreign paid converted
  const toplamKazanc = toplamGelirTRY + paidForeignInTRY;
  const harcanabilir = Math.max(0, toplamKazanc - toplamGider);
  const kdv = toplamGelirTRY * 0.2;
  const stopaj = toplamGelirTRY * 0.2;

  const hasFinancialData = invoices.length > 0 || expenses.length > 0;
  const barTotal = Math.max(1, harcanabilir + kdv + stopaj + toplamGider);

  const segments = [
    { label: "Harcanabilir", amount: harcanabilir, color: "bg-emerald-500" },
    { label: "Vergiler", amount: kdv + stopaj, color: "bg-amber-500" },
    ...(toplamGider > 0 ? [{ label: "Giderler", amount: toplamGider, color: "bg-red-400" }] : []),
  ];

  // ── Expense breakdown by category ──
  const expenseByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || "diger";
      cats[cat] = (cats[cat] || 0) + Number(e.amount);
    });
    return Object.entries(cats).map(([cat, amount]) => ({ cat, amount }));
  }, [expenses]);

  const categoryLabels: Record<string, string> = {
    kira: "Kira", vergi: "Vergi", abonelik: "Abonelik", diger: "Diğer",
  };

  // ── Donut chart ──
  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([status]) => projectStatusConfig[status])
      .map(([status, count]) => ({
        status,
        name: projectStatusConfig[status].label,
        value: count,
        color: projectStatusConfig[status].color,
      }));
  }, [projects]);

  const toggleFilter = (status: string) =>
    setStatusFilter((prev) => (prev === status ? null : status));

  const filteredProjects = statusFilter
    ? projects.filter((p) => p.status === statusFilter)
    : projects;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-projects"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-invoices"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-expenses"] });
    queryClient.invalidateQueries({ queryKey: ["exchange-rates"] });
    toast.success("Veriler güncelleniyor...");
  };

  const foreignSubtitle = useMemo(() => {
    const parts = Object.entries(pendingForeign).map(([c, amt]) => fmtMoney(amt, c as Currency));
    if (parts.length === 0) return null;
    const tryEquiv = foreignInTRY > 0 ? ` ≈ ₺${fmt(foreignInTRY)}` : "";
    return `(${parts.join(" + ")}${tryEquiv} ayrıca bekliyor)`;
  }, [pendingForeign, foreignInTRY]);

  // Foreign paid details for hero — show each currency separately
  const paidForeignDetails = useMemo(() => {
    return Object.entries(paidForeign).map(([c, amt]) => {
      const tryEquiv = rates
        ? c === "USD" ? amt * rates.USD
        : c === "EUR" ? amt * rates.EUR
        : 0
        : 0;
      return {
        label: fmtMoney(amt, c as Currency),
        tryEquiv: tryEquiv > 0 ? `≈ ₺${fmt(tryEquiv)}` : null,
      };
    });
  }, [paidForeign, rates]);

  const statCards = [
    { title: "Toplam Alacak (₺)", icon: HandCoins, value: `₺${fmt(totalAlacakTRY)}` },
    { title: "Bu Ay Kazanç", icon: TrendingUp, value: `₺${fmt(buAyKazanc)}` },
    { title: "Aktif Projeler", icon: FolderKanban, value: String(aktifProjeSayisi) },
  ];

  const hasNoData = projects.length === 0 && invoices.length === 0 && expenses.length === 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
            <div className="mt-1">
              <ExchangeRateBar rates={rates} isLoading={ratesLoading} />
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} title="Yenile">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-12">Yükleniyor…</p>
        ) : hasNoData ? (
          <EmptyState
            icon={LayoutDashboard}
            emoji="📊"
            title="Henüz veri yok"
            description="Müşteri, proje veya fatura ekleyerek dashboard'unuzu doldurun."
          />
        ) : (
          <>
            {/* 1. Hero Card — Toplam Kazanç */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 md:p-10 text-center text-white">
              <p className="text-sm font-medium opacity-90 tracking-wide uppercase">
                Toplam Kazanç
              </p>
              <p className="text-5xl md:text-6xl font-bold mt-3 tracking-tight">
                {heroCurrency === "TRY"
                  ? `₺${fmt(toplamKazanc)}`
                  : rates
                    ? heroCurrency === "USD"
                      ? `$${fmt(toplamKazanc / rates.USD)}`
                      : `€${fmt(toplamKazanc / rates.EUR)}`
                    : `₺${fmt(toplamKazanc)}`}
              </p>
              {/* Currency selector */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {(["TRY", "USD", "EUR"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setHeroCurrency(c)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      heroCurrency === c
                        ? "bg-white text-emerald-600"
                        : "bg-white/15 text-white hover:bg-white/25"
                    }`}
                  >
                    {c === "TRY" ? "₺ TL" : c === "USD" ? "$ USD" : "€ EUR"}
                  </button>
                ))}
              </div>
              {foreignSubtitle && (
                <p className="text-sm opacity-75 mt-3">{foreignSubtitle}</p>
              )}
              <p className="text-sm opacity-75 mt-2">
                Harcanabilir: {heroCurrency === "TRY"
                  ? `₺${fmt(harcanabilir)}`
                  : rates
                    ? heroCurrency === "USD"
                      ? `$${fmt(harcanabilir / rates.USD)}`
                      : `€${fmt(harcanabilir / rates.EUR)}`
                    : `₺${fmt(harcanabilir)}`}
              </p>
            </div>

            {/* 2. Horizontal stacked bar — only if financial data exists */}
            {hasFinancialData && toplamKazanc > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  {segments.map((s) => (
                    <span key={s.label} style={{ width: `${(s.amount / barTotal) * 100}%` }} className="text-center">
                      ₺{fmt(s.amount)}
                    </span>
                  ))}
                </div>
                <div className="flex h-4 rounded-full overflow-hidden">
                  {segments.map((s) => (
                    <div key={s.label} className={`${s.color} transition-all`} style={{ width: `${(s.amount / barTotal) * 100}%` }} />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  {segments.map((s) => (
                    <span key={s.label} style={{ width: `${(s.amount / barTotal) * 100}%` }} className="text-center">
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Breakdown cards — only show relevant ones */}
            <div className={`grid grid-cols-1 gap-4 ${toplamGider > 0 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
              {toplamGelirTRY > 0 && (
                <Card className="border border-border shadow-none">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">KDV Karşılığı</p>
                      <p className="text-lg font-semibold text-foreground">₺{fmt(kdv)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {toplamGelirTRY > 0 && (
                <Card className="border border-border shadow-none">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                      <Landmark className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Stopaj Karşılığı</p>
                      <p className="text-lg font-semibold text-foreground">₺{fmt(stopaj)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {toplamGider > 0 && (
                <Card
                  className="border border-border shadow-none cursor-pointer transition-shadow hover:shadow-sm"
                  onClick={() => setGiderOpen(!giderOpen)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-red-500 dark:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Toplam Giderler</p>
                        <p className="text-lg font-semibold text-foreground">₺{fmt(toplamGider)}</p>
                      </div>
                      {giderOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    {giderOpen && expenseByCategory.length > 0 && (
                      <div className="mt-4 space-y-3 border-t border-border pt-4">
                        {expenseByCategory.map((item) => (
                          <div key={item.cat} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{categoryLabels[item.cat] || item.cat}</span>
                            <span className="font-medium text-foreground">₺{fmt(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 4. Project Status Section — only if projects exist */}
            {projects.length > 0 && (
              <Card className="border border-border rounded-xl shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Proje Durumu</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Donut Chart */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-48 h-48">
                        <ProjectStatusDonut
                          data={donutData}
                          activeStatus={statusFilter}
                          onSelect={toggleFilter}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-foreground">{filteredProjects.length}</span>
                          <span className="text-xs text-muted-foreground">Proje</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
                        {donutData.map((d) => (
                          <button
                            key={d.name}
                            onClick={() => toggleFilter(d.status)}
                            className={`flex items-center gap-1.5 text-xs transition-opacity duration-300 ${
                              statusFilter && statusFilter !== d.status
                                ? "opacity-40 text-muted-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            {d.name} ({d.value})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Project List */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {filteredProjects.map((p) => {
                        const sc = projectStatusConfig[p.status] || { label: p.status, color: "#9CA3AF", dotClass: "bg-gray-400" };
                        const clientName = (p as any).clients?.name || "—";
                        const price = p.price != null ? fmtMoney(p.price, (p.currency || "TRY") as Currency) : "—";
                        return (
                          <div
                            key={p.id}
                            className="flex items-center gap-3 p-3 rounded-lg text-sm hover:bg-accent/50"
                          >
                            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${sc.dotClass}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{p.title}</p>
                              <p className="text-xs text-muted-foreground">{clientName}</p>
                            </div>
                            <span className="font-medium text-foreground whitespace-nowrap">{price}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 5. Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {statCards.map((stat) => (
                <Card key={stat.title} className="border border-border shadow-none">
                  <CardContent className="flex items-center gap-4 p-5">
                    <stat.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
