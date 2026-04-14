import { useQuery } from "@tanstack/react-query";

const LS_KEY = "soloops-exchange-rates";

export interface ExchangeRates {
  USD: number;
  EUR: number;
  timestamp: number;
}

const fetchRates = async (): Promise<ExchangeRates> => {
  try {
    const [resUsd, resEur] = await Promise.all([
      fetch("https://api.frankfurter.dev/v1/latest?from=USD&to=TRY"),
      fetch("https://api.frankfurter.dev/v1/latest?from=EUR&to=TRY"),
    ]);
    if (!resUsd.ok || !resEur.ok) throw new Error("API error");
    const [usdData, eurData] = await Promise.all([resUsd.json(), resEur.json()]);

    const rates: ExchangeRates = {
      USD: usdData.rates.TRY,
      EUR: eurData.rates.TRY,
      timestamp: Date.now(),
    };

    localStorage.setItem(LS_KEY, JSON.stringify(rates));
    return rates;
  } catch {
    const cached = localStorage.getItem(LS_KEY);
    if (cached) return JSON.parse(cached) as ExchangeRates;
    throw new Error("Kur bilgisi alınamadı");
  }
};

export const useExchangeRates = () => {
  return useQuery({
    queryKey: ["exchange-rates"],
    queryFn: fetchRates,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
    retry: 2,
    placeholderData: () => {
      const cached = localStorage.getItem(LS_KEY);
      return cached ? (JSON.parse(cached) as ExchangeRates) : undefined;
    },
  });
};
