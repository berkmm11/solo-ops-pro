import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Receipt, Landmark, Building2, Wifi, Monitor, Calculator, ChevronDown, ChevronUp, Wallet, HandCoins, TrendingUp, FolderKanban, FileText } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const fmt = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Mock data
const currencies = [
  { code: "TRY", symbol: "₺", total: 127_500, safe: 67_000 },
  { code: "USD", symbol: "$", total: 4_200, safe: 2_850 },
  { code: "EUR", symbol: "€", total: 3_100, safe: 2_200 },
];
const kdv = 21_250;
const stopaj = 21_250;
const sabitGiderler = 18_000;

const sabitKalemler = [
  { icon: Building2, label: "Kira", amount: 10_000 },
  { icon: Wifi, label: "İnternet", amount: 1_500 },
  { icon: Monitor, label: "Yazılım", amount: 3_500 },
  { icon: Calculator, label: "Muhasebeci", amount: 3_000 },
];

const harcanabilir = currencies[0].safe;
const barTotal = harcanabilir + kdv + stopaj + sabitGiderler;
const segments = [
  { label: "Harcanabilir", amount: harcanabilir, color: "bg-emerald-500" },
  { label: "Vergiler", amount: kdv + stopaj, color: "bg-amber-500" },
  { label: "Giderler", amount: sabitGiderler, color: "bg-red-400" },
];

const stats = [
  { title: "Toplam Alacak", icon: HandCoins },
  { title: "Bu Ay Kazanç", icon: TrendingUp },
  { title: "Aktif Projeler", icon: FolderKanban },
];

// Project status mock data
const initialProjects = [
  { id: 1, name: "Acme Corp Web Sitesi", client: "Acme Corp", budget: 45000, currency: "TRY", status: "in_progress", dueDate: "2026-05-01" },
  { id: 2, name: "Beta Logo Tasarım", client: "Beta Ltd", budget: 12000, currency: "TRY", status: "completed", dueDate: "2026-04-10" },
  { id: 3, name: "Gamma App UI/UX", client: "Gamma Inc", budget: 2500, currency: "USD", status: "invoiced", dueDate: "2026-03-28" },
  { id: 4, name: "Delta İçerik Yazımı", client: "Delta Co", budget: 8000, currency: "TRY", status: "paid", dueDate: "2026-03-15" },
  { id: 5, name: "Epsilon SEO Projesi", client: "Epsilon Ltd", budget: 15000, currency: "TRY", status: "overdue", dueDate: "2026-03-20" },
  { id: 6, name: "Zeta Marka Stratejisi", client: "Zeta AŞ", budget: 20000, currency: "TRY", status: "in_progress", dueDate: "2026-05-15" },
];

const projectStatusConfig: Record<string, { label: string; color: string; dotClass: string }> = {
  in_progress: { label: "Devam Ediyor", color: "#3B82F6", dotClass: "bg-blue-500" },
  completed:   { label: "Tamamlandı",   color: "#F59E0B", dotClass: "bg-amber-500" },
  invoiced:    { label: "Faturalandı",  color: "#8B5CF6", dotClass: "bg-violet-500" },
  paid:        { label: "Ödendi",       color: "#10B981", dotClass: "bg-emerald-500" },
  overdue:     { label: "Gecikmiş",     color: "#EF4444", dotClass: "bg-red-500" },
};

type MockProject = typeof initialProjects[number];

const Dashboard = () => {
  const [giderOpen, setGiderOpen] = useState(false);
  const [activeCurrency, setActiveCurrency] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [projects, setProjects] = useState(initialProjects);
  const [invoiceModal, setInvoiceModal] = useState<MockProject | null>(null);
  const active = currencies[activeCurrency];

  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
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

  const handleInvoice = (project: MockProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, status: "invoiced" } : p))
    );
    setInvoiceModal(null);
    toast.success("Fatura oluşturuldu!");
  };

  const invoiceCount = projects.filter((p) => p.status === "invoiced" || p.status === "paid").length;
  const generateInvoiceNo = () => `SOP-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(3, "0")}`;

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>

        {/* 1. Hero Card */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 md:p-10 text-center text-white">
          <p className="text-sm font-medium opacity-90 tracking-wide uppercase">
            Harcanabilir Bakiye
          </p>
          <p
            key={activeCurrency}
            className="text-5xl md:text-6xl font-bold mt-3 tracking-tight animate-fadeIn"
          >
            {active.symbol}{fmt(active.safe)}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {currencies.map((c, i) => (
              <button
                key={c.code}
                onClick={() => setActiveCurrency(i)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  i === activeCurrency
                    ? "bg-white text-emerald-700"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {c.symbol}{fmt(c.safe)}
              </button>
            ))}
          </div>
          <p className="text-sm opacity-75 mt-3">
            Gönül rahatlığıyla harcayabileceğin tutar
          </p>
          <p className="text-xs opacity-50 mt-1">Anlık kurlarla hesaplandı</p>
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
              <div
                key={s.label}
                className={`${s.color} transition-all`}
                style={{ width: `${(s.amount / barTotal) * 100}%` }}
              />
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
          {/* KDV */}
          <Card className="border border-border shadow-none">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">KDV Karşılığı</p>
                <p className="text-lg font-semibold text-foreground">₺{fmt(kdv)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Stopaj */}
          <Card className="border border-border shadow-none">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Landmark className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stopaj Karşılığı</p>
                <p className="text-lg font-semibold text-foreground">₺{fmt(stopaj)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Sabit Giderler (expandable) */}
          <Card
            className="border border-border shadow-none cursor-pointer transition-shadow hover:shadow-sm"
            onClick={() => setGiderOpen(!giderOpen)}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Sabit Giderler</p>
                  <p className="text-lg font-semibold text-foreground">₺{fmt(sabitGiderler)}</p>
                </div>
                {giderOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Donut Chart */}
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        animationBegin={0}
                        animationDuration={800}
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
              <div className="space-y-2">
                {filteredProjects.map((p) => {
                  const sc = projectStatusConfig[p.status];
                  const currSymbol = p.currency === "USD" ? "$" : p.currency === "EUR" ? "€" : "₺";
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                        p.status === "overdue" ? "bg-red-50" : "hover:bg-accent/50"
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${sc.dotClass}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.client}</p>
                      </div>
                      <span className="font-medium text-foreground whitespace-nowrap">
                        {currSymbol}{fmt(p.budget)}
                      </span>
                      {p.status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs ml-1"
                          onClick={() => console.log("Fatura oluştur:", p.name)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Fatura
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Placeholder stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border border-border shadow-none">
              <CardContent className="flex items-center gap-4 p-5">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-lg font-semibold text-foreground">—</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
