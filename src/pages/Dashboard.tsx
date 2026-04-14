import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Landmark, Building2, Wifi, Monitor, Calculator, ChevronDown, ChevronUp, Wallet, HandCoins, TrendingUp, FolderKanban, FileText } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

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

const Dashboard = () => {
  const [giderOpen, setGiderOpen] = useState(false);
  const [activeCurrency, setActiveCurrency] = useState(0);
  const active = currencies[activeCurrency];

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

        {/* 4. Placeholder stat cards */}
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
