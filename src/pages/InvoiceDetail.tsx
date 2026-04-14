import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Currency, fmtMoneyFull } from "@/lib/currency";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { FileDown, Pencil, ChevronRight, Send, MessageCircle, Mail, Copy, User, Building2, Phone, AtSign, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import AiReminderSection from "@/components/AiReminderSection";
import InvoiceTemplateCustomizer from "@/components/InvoiceTemplateCustomizer";
import { toast } from "sonner";

type InvoiceStatus = "pending" | "paid" | "overdue";

const statusConfig: Record<InvoiceStatus, { label: string; bg: string; text: string }> = {
  pending: { label: "Bekleyen", bg: "bg-muted", text: "text-muted-foreground" },
  paid: { label: "Ödendi", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-800 dark:text-emerald-300" },
  overdue: { label: "Gecikmiş", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-300" },
};

const fmt = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: string | null) => (d ? format(new Date(d), "dd.MM.yyyy") : "—");

const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState("");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateConfig, setTemplateConfig] = useState<any>(
    (profile as any)?.invoice_template_config || null
  );

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
  const currency = ((invoice as any).currency || "TRY") as Currency;
  const amount = invoice.amount;
  const kdv = amount * 0.2;
  const stopaj = amount * 0.2;
  const araToplam = amount;
  const genelToplam = amount + kdv - stopaj;
  const sc = statusConfig[invoice.status as InvoiceStatus];

  const fmtC = (n: number) => fmtMoneyFull(n, currency);

  const buildPaymentMessage = () => {
    const clientName = client?.name || "Sayın Müşterimiz";
    const iban = profile?.iban || "[IBAN bilgisi profilde belirtilmemiş]";
    const bankName = profile?.bank_name ? ` (${profile.bank_name})` : "";
    return `Merhaba ${clientName},\n\n${invoice.invoice_no} numaralı ${fmtC(amount)} tutarındaki faturanız hazırlanmıştır.\n\nÖdeme bilgileri:\nIBAN: ${iban}${bankName}\nAlıcı: ${profile?.full_name || user?.email || "—"}\n\nVade tarihi: ${fmtDate(invoice.due_date)}\n\nTeşekkür ederiz.`;
  };

  const openPaymentPanel = () => {
    setPaymentMsg(buildPaymentMessage());
    setPaymentOpen(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentMsg);
    toast.success("Kopyalandı!");
  };

  const handleWhatsApp = () => {
    const phone = client?.phone?.replace(/\D/g, "") || "";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(paymentMsg)}`;
    window.open(url, "_blank");
  };

  const handleMail = () => {
    const subject = `${invoice.invoice_no} - Fatura Ödeme Bilgileri`;
    const mailto = `mailto:${client?.email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(paymentMsg)}`;
    window.open(mailto);
  };

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
            {invoice.status !== "paid" && (
              <Button size="sm" variant="outline" onClick={openPaymentPanel}>
                <Send className="mr-2 h-4 w-4" />
                Ödeme Bilgileri Gönder
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setTemplateOpen(true)}>
              <Palette className="mr-2 h-4 w-4" />
              Şablon Özelleştir
              <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1 py-0.5 rounded font-medium">Business ✨</span>
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <FileDown className="mr-2 h-4 w-4" />
              PDF İndir
            </Button>
          </div>
        </div>

        {/* Fatura Edilen card */}
        {client && (
          <div className="border border-border rounded-xl p-5 mb-6 bg-background">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Fatura Edilen</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{client.name}</span>
              </div>
              {client.email && (
                <div className="flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.tax_no && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>VKN: {client.tax_no}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── INVOICE DOCUMENT ── */}
      <div
        className="max-w-[800px] mx-auto bg-white border border-[#d1d5db] rounded print:border-none print:rounded-none print:shadow-none print:max-w-none print:p-0"
        style={{ fontFamily: "Arial, Helvetica, sans-serif", color: templateConfig?.accentColor || "#111" }}
      >
        <div className="p-10 print:p-8">
          {/* Template header image */}
          {templateConfig?.headerImageUrl && (
            <div className="mb-6 -mx-10 -mt-10 print:-mx-8 print:-mt-8">
              <img src={templateConfig.headerImageUrl} alt="" className="w-full h-20 object-cover rounded-t" />
            </div>
          )}
          {/* HEADER */}
          <div className="flex justify-between items-start border-b-2 pb-6 mb-8" style={{ borderColor: templateConfig?.accentColor || "#111" }}>
            <div className="text-sm leading-relaxed">
              <p className="text-base font-bold mb-1">
                {profile?.full_name || user?.email || "—"}
              </p>
              {profile?.address && <p className="text-[#555]">{profile.address}</p>}
              {profile?.tax_no && <p className="text-[#555]">VKN: {profile.tax_no}</p>}
              {profile?.phone && <p className="text-[#555]">{profile.phone}</p>}
              <p className="text-[#555]">{user?.email}</p>
            </div>
            <div className="text-right">
              <h2 className="text-[36px] font-bold tracking-tight leading-none mb-3">FATURA</h2>
              <table className="ml-auto text-sm">
                <tbody>
                  <tr><td className="text-[#555] pr-3 py-0.5 text-right">Fatura No:</td><td className="font-semibold text-right">{invoice.invoice_no}</td></tr>
                  <tr><td className="text-[#555] pr-3 py-0.5 text-right">Tarih:</td><td className="font-semibold text-right">{fmtDate(invoice.issue_date)}</td></tr>
                  <tr><td className="text-[#555] pr-3 py-0.5 text-right">Vade:</td><td className="font-semibold text-right">{fmtDate(invoice.due_date)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CLIENT INFO */}
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">Fatura Edilen:</p>
            <div className="text-sm leading-relaxed">
              <p className="font-bold text-base">{client?.name || "—"}</p>
              {client?.tax_no && <p className="text-[#555]">VKN: {client.tax_no}</p>}
              {client?.email && <p className="text-[#555]">{client.email}</p>}
              {client?.phone && <p className="text-[#555]">{client.phone}</p>}
            </div>
          </div>

          {/* LINE ITEMS */}
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
                <td className="border border-[#d1d5db] px-3 py-2.5 text-right">{fmtC(amount)}</td>
                <td className="border border-[#d1d5db] px-3 py-2.5 text-right font-semibold">{fmtC(amount)}</td>
              </tr>
            </tbody>
          </table>

          {/* TOTALS */}
          <div className="flex justify-end mb-10">
            <table className="text-sm w-[300px]">
              <tbody>
                <tr><td className="py-1.5 text-[#555]">Ara Toplam:</td><td className="py-1.5 text-right font-medium">{fmtC(araToplam)}</td></tr>
                {currency === "TRY" && (
                  <>
                    <tr><td className="py-1.5 text-[#555]">KDV (%20):</td><td className="py-1.5 text-right font-medium">+{fmtC(kdv)}</td></tr>
                    <tr><td className="py-1.5 text-[#555]">Stopaj (%20):</td><td className="py-1.5 text-right font-medium">-{fmtC(stopaj)}</td></tr>
                  </>
                )}
                <tr className="border-t-2 border-[#111]">
                  <td className="pt-3 pb-1 font-bold text-base">GENEL TOPLAM:</td>
                  <td className="pt-3 pb-1 text-right font-bold text-lg">{fmtC(currency === "TRY" ? genelToplam : amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* PAYMENT INFO */}
          <div className="border-t border-[#d1d5db] pt-6 text-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[#888] mb-3">Ödeme Bilgileri</p>
            <div className="leading-relaxed text-[#555]">
              {profile?.iban ? (
                <>
                  <p>IBAN: <span className="font-semibold text-[#111]">{profile.iban}</span></p>
                  {profile.bank_name && (
                    <p>Banka: <span className="font-semibold text-[#111]">{profile.bank_name}</span></p>
                  )}
                </>
              ) : (
                <p className="italic text-[#999]">Ödeme bilgileri profil ayarlarından eklenebilir.</p>
              )}
            </div>
            <p className="text-xs text-[#999] mt-4">
              Ödeme vadesi {fmtDate(invoice.due_date)} tarihine kadardır. Gecikmeli ödemelerde yasal faiz uygulanır.
            </p>
            {currency === "TRY" && (
              <p className="text-[10px] text-[#bbb] mt-2">
                Stopaj gelir vergisi avansıdır ve müşteri tarafından vergi dairesine beyan edilir.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AI Reminder (overdue only) */}
      {invoice.status === "overdue" && (
        <AiReminderSection
          invoiceId={invoice.id}
          invoiceNo={invoice.invoice_no}
          clientPhone={client?.phone || null}
          clientEmail={client?.email || null}
        />
      )}

      {/* Payment Send Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ödeme Bilgileri Gönder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={paymentMsg}
              onChange={(e) => setPaymentMsg(e.target.value)}
              rows={10}
              className="text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Kopyala
              </Button>
              {client?.phone && (
                <Button variant="outline" size="sm" onClick={handleWhatsApp} className="text-[#25D366]">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp'tan Gönder
                </Button>
              )}
              {client?.email && (
                <Button variant="outline" size="sm" onClick={handleMail}>
                  <Mail className="mr-2 h-4 w-4" />
                  Mail Olarak Aç
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Template Customizer */}
      {user && (
        <InvoiceTemplateCustomizer
          open={templateOpen}
          onOpenChange={setTemplateOpen}
          userId={user.id}
          brandName={profile?.brand_name || profile?.full_name || ""}
          currentConfig={templateConfig}
          onConfigSaved={setTemplateConfig}
        />
      )}
    </AppLayout>
  );
};

export default InvoiceDetail;
