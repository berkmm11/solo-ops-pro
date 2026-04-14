import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
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

const fmtAmount = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return format(new Date(d), "dd.MM.yyyy");
};

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
  const net = amount + kdv - stopaj;
  const sc = statusConfig[invoice.status as InvoiceStatus];

  return (
    <AppLayout>
      <div className="print:hidden">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <Link to="/invoices" className="hover:text-foreground transition-colors">
            Faturalarım
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{invoice.invoice_no}</span>
        </nav>

        {/* Action bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{invoice.invoice_no}</h1>
            <Badge variant="secondary" className={cn("text-xs font-medium", sc.bg, sc.text)}>
              {sc.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/invoices`}>
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

      {/* A4 Document */}
      <div className="invoice-document max-w-[800px] mx-auto bg-background border border-border shadow-sm rounded-lg p-10 print:shadow-none print:border-none print:rounded-none print:p-0 print:max-w-none">
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="text-foreground font-semibold text-base">{user?.user_metadata?.full_name || user?.email}</p>
            {user?.user_metadata?.address && <p>{user.user_metadata.address}</p>}
            {user?.user_metadata?.tax_no && <p>VKN: {user.user_metadata.tax_no}</p>}
            {user?.phone && <p>{user.phone}</p>}
            <p>{user?.email}</p>
          </div>
          <div className="text-right space-y-1">
            <h2 className="text-[32px] font-bold text-foreground tracking-tight">FATURA</h2>
            <p className="text-sm text-muted-foreground">Fatura No: <span className="text-foreground font-medium">{invoice.invoice_no}</span></p>
            <p className="text-sm text-muted-foreground">Düzenlenme: <span className="text-foreground font-medium">{fmtDate(invoice.issue_date)}</span></p>
            <p className="text-sm text-muted-foreground">Vade: <span className="text-foreground font-medium">{fmtDate(invoice.due_date)}</span></p>
          </div>
        </div>

        {/* Client info */}
        <div className="mb-8">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Fatura Adresi:</p>
          <div className="space-y-0.5 text-sm">
            <p className="text-foreground font-semibold">{client?.name || "—"}</p>
            {client?.tax_no && <p className="text-muted-foreground">VKN: {client.tax_no}</p>}
            {client?.email && <p className="text-muted-foreground">{client.email}</p>}
            {client?.phone && <p className="text-muted-foreground">{client.phone}</p>}
          </div>
        </div>

        {/* Line items table */}
        <div className="mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-foreground">
                <th className="text-left py-2 font-bold w-10">#</th>
                <th className="text-left py-2 font-bold">Açıklama</th>
                <th className="text-center py-2 font-bold w-20">Miktar</th>
                <th className="text-right py-2 font-bold w-32">Birim Fiyat</th>
                <th className="text-right py-2 font-bold w-32">Toplam</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3">1</td>
                <td className="py-3">
                  {project?.title || "Hizmet"}
                  {invoice.description && (
                    <span className="block text-xs text-muted-foreground mt-0.5">{invoice.description}</span>
                  )}
                </td>
                <td className="py-3 text-center">1</td>
                <td className="py-3 text-right">{fmtAmount(amount)}</td>
                <td className="py-3 text-right font-medium">{fmtAmount(amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-[300px] space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Brüt Tutar:</span>
              <span className="font-medium">{fmtAmount(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">KDV (%20):</span>
              <span className="font-medium text-[#065F46]">+{fmtAmount(kdv)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stopaj (%20):</span>
              <span className="font-medium text-[#991B1B]">-{fmtAmount(stopaj)}</span>
            </div>
            <div className="border-t-2 border-foreground pt-2 flex justify-between">
              <span className="font-bold text-base">Net Tutar:</span>
              <span className="font-bold text-base">{fmtAmount(net)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground pt-1">
              Stopaj gelir vergisi avansıdır, müşteri tarafından vergi dairesine yatırılır.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-6 space-y-3 text-sm">
          <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Ödeme Bilgileri:</p>
          <div className="space-y-1 text-muted-foreground">
            {user?.user_metadata?.iban && <p>IBAN: <span className="text-foreground font-medium">{user.user_metadata.iban}</span></p>}
            {user?.user_metadata?.bank && <p>Banka: <span className="text-foreground font-medium">{user.user_metadata.bank}</span></p>}
            {!user?.user_metadata?.iban && !user?.user_metadata?.bank && (
              <p className="text-muted-foreground italic">Ödeme bilgileri profil ayarlarından eklenebilir.</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Ödeme vadesi 14 gündür. Gecikmeli ödemelerde yasal faiz uygulanır.
          </p>
        </div>
      </div>

      {invoice.status === "overdue" && (
        <AiReminderSection invoiceId={invoice.id} />
      )}
    </AppLayout>
  );
};

export default InvoiceDetail;
