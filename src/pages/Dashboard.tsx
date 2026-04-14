import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Receipt, Landmark, Building2, Wifi, Monitor, Calculator,
  ChevronDown, ChevronUp, Wallet, HandCoins, TrendingUp,
  FolderKanban, RefreshCw,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Currency, fmtMoney } from "@/lib/currency";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import ExchangeRateBar from "@/components/ExchangeRateBar";

const fmt = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// ── Static config ──
const sabitKalemler = [
  { icon: Building2, label: "Kira", amount: 10_000 },
  { icon: Wifi, label: "İnternet", amount: 1_500 },
  { icon: Monitor, label: "Yazılım", amount: 3_500 },
  { icon: Calculator, label: "Muhasebeci", amount: 3_000 },
];
const sabitGiderler = sabitKalemler.reduce((s, k) => s + k.amount, 0);

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

  // ── Computed stats (currency-aware) ──
  const totalAlacakTRY = useMemo(
    () => invoices.filter((i) => i.status !== "paid" && ((i as any).currency || "TRY") === "TRY").reduce((s, i) => s + Number(i.amount), 0),
    [invoices]
  );

  const pendingForeign = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    invoices
      .filter((i) => i.status !== "paid" && ((i as any).currency || "TRY") !== "TRY")
      .forEach((i) => {
        const c = (i as any).currency || "TRY";
        byCurrency[c] = (byCurrency[c] || 0) + Number(i.amount);
      });
    return byCurrency;
  }, [invoices]);

  const buAyKazanc = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    return invoices
      .filter((i) => i.status === "paid" && i.issue_date >= monthStart && ((i as any).currency || "TRY") === "TRY")
      .reduce((s, i) => s + Number(i.amount), 0);
  }, [invoices]);

  const aktifProjeSayisi = useMemo(
    () => projects.filter((p) => p.status === "aktif").length,
    [projects]
  );

  const toplamGelirTRY = useMemo(
    () => invoices.filter((i) => i.status === "paid" && ((i as any).currency || "TRY") === "TRY").reduce((s, i) => s + Number(i.amount), 0),
    [invoices]
  );

  const toplamGider = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  );

  const harcanabilir = Math.max(0, toplamGelirTRY - toplamGider - sabitGiderler);
  const kdv = toplamGelirTRY * 0.2;
  const stopaj = toplamGelirTRY * 0.2;
  const barTotal = Math.max(1, harcanabilir + kdv + stopaj + sabitGiderler);

  const segments = [
    { label: "Harcanabilir", amount: harcanabilir, color: "bg-emerald-500" },
    { label: "Vergiler", amount: kdv + stopaj, color: "bg-amber-500" },
    { label: "Giderler", amount: sabitGiderler, color: "bg-red-400" },
  ];

  // ── Donut chart ──
  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      const status = p.status;
      counts[status] = (counts[status] || 0) + 1;
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
    toast.success("Veriler güncelleniyor...");
  };

  const foreignSubtitle = useMemo(() => {
    const parts = Object.entries(pendingForeign).map(([c, amt]) => fmtMoney(amt, c as Currency));
    return parts.length > 0 ? `(${parts.join(" + ")} ayrıca bekliyor)` : null;
  }, [pendingForeign]);

  const statCards = [
    { title: "Toplam Alacak (₺)", icon: HandCoins, value: `₺${fmt(totalAlacakTRY)}` },
    { title: "Bu Ay Kazanç", icon: TrendingUp, value: `₺${fmt(buAyKazanc)}` },
    { title: "Aktif Projeler", icon: FolderKanban, value: String(aktifProjeSayisi) },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with refresh */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <Button variant="ghost" size="icon" onClick={handleRefresh} title="Yenile">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-12">Yükleniyor…</p>
        ) : (
          <>
            {/* 1. Hero Card */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 md:p-10 text-center text-white">
              <p className="text-sm font-medium opacity-90 tracking-wide uppercase">
                Harcanabilir Bakiye
              </p>
              <p className="text-5xl md:text-6xl font-bold mt-3 tracking-tight">
                ₺{fmt(harcanabilir)}
              </p>
              {foreignSubtitle && (
                <p className="text-sm opacity-75 mt-2">{foreignSubtitle}</p>
              )}
              <p className="text-sm opacity-75 mt-3">
                Gönül rahatlığıyla harcayabileceğin tutar
              </p>
            </div>

            {/* 2. Horizontal stacked bar */}
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

            {/* 3. Three breakdown cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <p className="text-sm text-muted-foreground">Sabit Giderler</p>
                      <p className="text-lg font-semibold text-foreground">₺{fmt(sabitGiderler)}</p>
                    </div>
                    {giderOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  {giderOpen && (
                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                      {sabitKalemler.map((k) => (
                        <div key={k.label} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <k.icon className="h-4 w-4" />
                            <span>{k.label}</span>
                          </div>
                          <span className="font-medium text-foreground">₺{fmt(k.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 4. Project Status Section */}
            <Card className="border border-border rounded-xl shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Proje Durumu</h2>
                {projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Henüz proje eklenmemiş.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Donut Chart */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={donutData}
                              cx="50%" cy="50%"
                              innerRadius={55} outerRadius={80}
                              dataKey="value"
                              startAngle={90} endAngle={-270}
                              animationBegin={0} animationDuration={800}
                              cursor="pointer"
                              onClick={(_: any, index: number) => toggleFilter(donutData[index].status)}
                            >
                              {donutData.map((entry, i) => (
                                <Cell
                                  key={i}
                                  fill={entry.color}
                                  stroke="none"
                                  opacity={statusFilter && statusFilter !== entry.status ? 0.25 : 1}
                                  style={{
                                    transform: statusFilter === entry.status ? "scale(1.08)" : "scale(1)",
                                    transformOrigin: "center",
                                    transition: "opacity 0.3s, transform 0.3s",
                                  }}
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
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
                        const price = p.price != null ? fmtMoney(p.price, ((p as any).currency || "TRY") as Currency) : "—";
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
                )}
              </CardContent>
            </Card>

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
