import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, Pencil, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import AiReminderSection from "@/components/AiReminderSection";

type InvoiceStatus = "pending" | "paid" | "overdue";

const statusConfig: Record<InvoiceStatus, { label: string; bg: string; text: string }> = {
  pending: { label: "Bekleyen", bg: "bg-[#F3F4F6]", text: "text-[#374151]" },
  paid: { label: "Ödendi", bg: "bg-[#D1FAE5]", text: "text-[#065F46]" },
  overdue: { label: "Gecikmiş", bg: "bg-[#FEE2E2]", text: "text-[#991B1B]" },
};

const fmt = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string | null) => (d ? format(new Date(d), "dd.MM.yyyy") : "—");

const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, projects(title), clients(name, email, phone, tax_no)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[600px] w-full max-w-[800px] mx-auto" />
        </div>
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Fatura bulunamadı.</p>
      </AppLayout>
    );
  }

  const client = (invoice as any).clients;
  const project = (invoice as any).projects;
  const amount = invoice.amount;
  const kdv = amount * 0.2;
  const stopaj = amount * 0.2;
  const araToplam = amount;
  const genelToplam = amount + kdv - stopaj;
  const sc = statusConfig[invoice.status as InvoiceStatus];

  return (
    <AppLayout>
      {/* ── Screen-only controls ── */}
      <div className="print:hidden">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <Link to="/invoices" className="hover:text-foreground transition-colors">Faturalarım</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{invoice.invoice_no}</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{invoice.invoice_no}</h1>
            <Badge variant="secondary" className={cn("text-xs font-medium", sc.bg, sc.text)}>
              {sc.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/invoices">
                <Pencil className="mr-2 h-4 w-4" />
                Düzenle
              </Link>
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <FileDown className="mr-2 h-4 w-4" />
              PDF İndir
            </Button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          STANDARD INVOICE DOCUMENT
          Font: system sans-serif (Arial-like)
          Colors: black text, white bg, gray borders only
         ══════════════════════════════════════════════════ */}
      <div
        className="max-w-[800px] mx-auto bg-white border border-[#d1d5db] rounded print:border-none print:rounded-none print:shadow-none print:max-w-none print:p-0"
        style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#111" }}
      >
        <div className="p-10 print:p-8">
          {/* ── HEADER ── */}
          <div className="flex justify-between items-start border-b-2 border-[#111] pb-6 mb-8">
            {/* Sender */}
            <div className="text-sm leading-relaxed">
              <p className="text-base font-bold mb-1">
                {user?.user_metadata?.full_name || user?.email || "—"}
              </p>
              {user?.user_metadata?.address && (
                <p className="text-[#555]">{user.user_metadata.address}</p>
              )}
              {user?.user_metadata?.tax_no && (
                <p className="text-[#555]">VKN: {user.user_metadata.tax_no}</p>
              )}
              {user?.phone && <p className="text-[#555]">{user.phone}</p>}
              <p className="text-[#555]">{user?.email}</p>
            </div>

            {/* Invoice title + meta */}
            <div className="text-right">
              <h2 className="text-[36px] font-bold tracking-tight leading-none mb-3">
                FATURA
              </h2>
              <table className="ml-auto text-sm">
                <tbody>
                  <tr>
                    <td className="text-[#555] pr-3 py-0.5 text-right">Fatura No:</td>
                    <td className="font-semibold text-right">{invoice.invoice_no}</td>
                  </tr>
                  <tr>
                    <td className="text-[#555] pr-3 py-0.5 text-right">Tarih:</td>
                    <td className="font-semibold text-right">{fmtDate(invoice.issue_date)}</td>
                  </tr>
                  <tr>
                    <td className="text-[#555] pr-3 py-0.5 text-right">Vade:</td>
                    <td className="font-semibold text-right">{fmtDate(invoice.due_date)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── CLIENT INFO ── */}
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">
              Fatura Edilen:
            </p>
            <div className="text-sm leading-relaxed">
              <p className="font-bold text-base">{client?.name || "—"}</p>
              {client?.tax_no && <p className="text-[#555]">VKN: {client.tax_no}</p>}
              {client?.email && <p className="text-[#555]">{client.email}</p>}
              {client?.phone && <p className="text-[#555]">{client.phone}</p>}
            </div>
          </div>

          {/* ── LINE ITEMS TABLE ── */}
          <table className="w-full text-sm border-collapse mb-8">
            <thead>
              <tr className="bg-[#f3f4f6]">
                <th className="border border-[#d1d5db] px-3 py-2.5 text-left font-bold w-10">#</th>
                <th className="border border-[#d1d5db] px-3 py-2.5 text-left font-bold">Açıklama</th>
                <th className="border border-[#d1d5db] px-3 py-2.5 text-center font-bold w-20">Miktar</th>
                <th className="border border-[#d1d5db] px-3 py-2.5 text-right font-bold w-32">Birim Fiyat</th>
                <th className="border border-[#d1d5db] px-3 py-2.5 text-right font-bold w-32">Tutar</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-[#d1d5db] px-3 py-2.5">1</td>
                <td className="border border-[#d1d5db] px-3 py-2.5">
                  {project?.title || "Hizmet"}
                  {invoice.description && (
                    <span className="block text-xs text-[#888] mt-0.5">{invoice.description}</span>
                  )}
                </td>
                <td className="border border-[#d1d5db] px-3 py-2.5 text-center">1</td>
                <td className="border border-[#d1d5db] px-3 py-2.5 text-right">{fmt(amount)} ₺</td>
                <td className="border border-[#d1d5db] px-3 py-2.5 text-right font-semibold">{fmt(amount)} ₺</td>
              </tr>
            </tbody>
          </table>

          {/* ── TOTALS ── */}
          <div className="flex justify-end mb-10">
            <table className="text-sm w-[300px]">
              <tbody>
                <tr>
                  <td className="py-1.5 text-[#555]">Ara Toplam:</td>
                  <td className="py-1.5 text-right font-medium">{fmt(araToplam)} ₺</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-[#555]">KDV (%20):</td>
                  <td className="py-1.5 text-right font-medium">+{fmt(kdv)} ₺</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-[#555]">Stopaj (%20):</td>
                  <td className="py-1.5 text-right font-medium">-{fmt(stopaj)} ₺</td>
                </tr>
                <tr className="border-t-2 border-[#111]">
                  <td className="pt-3 pb-1 font-bold text-base">GENEL TOPLAM:</td>
                  <td className="pt-3 pb-1 text-right font-bold text-lg">{fmt(genelToplam)} ₺</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── FOOTER / PAYMENT INFO ── */}
          <div className="border-t border-[#d1d5db] pt-6 text-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-3">
              Ödeme Bilgileri
            </p>
            <div className="leading-relaxed text-[#555]">
              {user?.user_metadata?.iban ? (
                <>
                  <p>IBAN: <span className="font-semibold text-[#111]">{user.user_metadata.iban}</span></p>
                  {user?.user_metadata?.bank && (
                    <p>Banka: <span className="font-semibold text-[#111]">{user.user_metadata.bank}</span></p>
                  )}
                </>
              ) : (
                <p className="italic text-[#999]">
                  Ödeme bilgileri profil ayarlarından eklenebilir.
                </p>
              )}
            </div>
            <p className="text-xs text-[#999] mt-4">
              Ödeme vadesi {fmtDate(invoice.due_date)} tarihine kadardır. Gecikmeli ödemelerde yasal faiz uygulanır.
            </p>
            <p className="text-[10px] text-[#bbb] mt-2">
              Stopaj gelir vergisi avansıdır ve müşteri tarafından vergi dairesine beyan edilir.
            </p>
          </div>
        </div>
      </div>

      {/* ── AI Reminder (overdue only, screen only) ── */}
      {invoice.status === "overdue" && (
        <AiReminderSection
          invoiceId={invoice.id}
          invoiceNo={invoice.invoice_no}
          clientPhone={client?.phone || null}
          clientEmail={client?.email || null}
        />
      )}
    </AppLayout>
  );
};

export default InvoiceDetail;
