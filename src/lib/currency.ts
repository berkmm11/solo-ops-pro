export type Currency = "TRY" | "USD" | "EUR";

export const currencyConfig: Record<Currency, { symbol: string; locale: string; label: string }> = {
  TRY: { symbol: "₺", locale: "tr-TR", label: "₺ TRY" },
  USD: { symbol: "$", locale: "en-US", label: "$ USD" },
  EUR: { symbol: "€", locale: "de-DE", label: "€ EUR" },
};

export const currencies: Currency[] = ["TRY", "USD", "EUR"];

export const fmtMoney = (amount: number, currency: Currency = "TRY"): string => {
  const cfg = currencyConfig[currency];
  const formatted = amount.toLocaleString(cfg.locale, {
    minimumFractionDigits: currency === "TRY" ? 0 : 2,
    maximumFractionDigits: 2,
  });
  if (currency === "TRY") return `${formatted} ₺`;
  return `${cfg.symbol}${formatted}`;
};

export const fmtMoneyFull = (amount: number, currency: Currency = "TRY"): string => {
  const cfg = currencyConfig[currency];
  const formatted = amount.toLocaleString(cfg.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (currency === "TRY") return `${formatted} ₺`;
  return `${cfg.symbol}${formatted}`;
};
