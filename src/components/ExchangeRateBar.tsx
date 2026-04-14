import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExchangeRates } from "@/hooks/useExchangeRates";

const LS_PREV_KEY = "soloops-exchange-rates-prev";

interface Props {
  rates: ExchangeRates | undefined;
  isLoading: boolean;
}

const fmt = (n: number) => n.toFixed(2);

const getDirection = (current: number, currency: "USD" | "EUR") => {
  try {
    const prev = localStorage.getItem(LS_PREV_KEY);
    if (!prev) return "same" as const;
    const prevRates = JSON.parse(prev);
    const prevVal = prevRates[currency];
    if (!prevVal) return "same" as const;
    if (current > prevVal + 0.005) return "up" as const;
    if (current < prevVal - 0.005) return "down" as const;
    return "same" as const;
  } catch {
    return "same" as const;
  }
};

const savePrev = (rates: ExchangeRates) => {
  localStorage.setItem(LS_PREV_KEY, JSON.stringify({ USD: rates.USD, EUR: rates.EUR }));
};

const DirIcon = ({ dir }: { dir: "up" | "down" | "same" }) => {
  if (dir === "up") return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (dir === "down") return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

const ExchangeRateBar = ({ rates, isLoading }: Props) => {
  if (isLoading || !rates) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
      </div>
    );
  }

  const usdDir = getDirection(rates.USD, "USD");
  const eurDir = getDirection(rates.EUR, "EUR");

  // Save current as prev for next comparison (delayed)
  setTimeout(() => savePrev(rates), 100);

  const updated = new Date(rates.timestamp);
  const timeStr = updated.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5 font-medium">
        <span className="text-foreground">USD/TRY</span>
        <span>{fmt(rates.USD)}</span>
        <DirIcon dir={usdDir} />
      </div>
      <div className="flex items-center gap-1.5 font-medium">
        <span className="text-foreground">EUR/TRY</span>
        <span>{fmt(rates.EUR)}</span>
        <DirIcon dir={eurDir} />
      </div>
      <span className="text-[10px] opacity-60">{timeStr}</span>
    </div>
  );
};

export default ExchangeRateBar;
