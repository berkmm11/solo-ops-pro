import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Check, Copy, Clock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { Currency, fmtMoneyFull } from "@/lib/currency";
import { format } from "date-fns";

const fireConfetti = () => {
  const colors = ["#FFD700", "#FFA500", "#10B981", "#059669", "#3B82F6", "#6366F1"];
  const end = Date.now() + 3500;

  const frame = () => {
    if (Date.now() > end) return;
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors });
    requestAnimationFrame(frame);
  };

  confetti({
    particleCount: 100, spread: 100, origin: { y: 0.5 },
    colors, startVelocity: 45, gravity: 0.8, scalar: 1.2,
  });
  frame();
};

interface InvoiceData {
  id: string;
  invoice_no: string;
  amount: number;
  currency: string;
  due_date: string;
  status: string;
  description: string | null;
  projects: { title: string } | null;
  clients: { name: string } | null;
}

interface ProfileData {
  full_name: string | null;
  brand_name: string | null;
  iban: string | null;
  bank_name: string | null;
}

const PayInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [justPaid, setJustPaid] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      // Fetch invoice with related data (public access via RPC not needed for select — 
      // we use the service role indirectly through a public-facing query)
      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .select("id, invoice_no, amount, currency, due_date, status, description, projects(title), clients(name)")
        .eq("id", id)
        .maybeSingle();

      if (invErr || !inv) {
        setError("Fatura bulunamadı veya erişim yok.");
        setLoading(false);
        return;
      }

      // Fetch the freelancer's profile for IBAN
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, brand_name, iban, bank_name")
        .eq("user_id", (inv as any).user_id)
        .maybeSingle();

      setInvoice(inv as any);
      setProfile(prof);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // We need user_id for profile fetch — let's adjust the query
  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      setLoading(true);
      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .select("id, invoice_no, amount, currency, due_date, status, description, user_id, projects(title), clients(name)")
        .eq("id", id)
        .maybeSingle();

      if (invErr || !inv) {
        setError("Fatura bulunamadı.");
        setLoading(false);
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, brand_name, iban, bank_name")
        .eq("user_id", inv.user_id)
        .maybeSingle();

      setInvoice(inv as any);
      setProfile(prof);
      setLoading(false);
    };
    fetchAll();
  }, [id]);

  const isPaid = invoice?.status === "paid" || justPaid;
  const currency = ((invoice as any)?.currency || "TRY") as Currency;
  const senderName = profile?.brand_name || profile?.full_name || "—";
  const clientName = (invoice as any)?.clients?.name || "—";
  const projectTitle = (invoice as any)?.projects?.title || "—";
  const fmtDate = (d: string) => format(new Date(d), "dd.MM.yyyy");

  const copyIban = async () => {
    if (!profile?.iban) return;
    await navigator.clipboard.writeText(profile.iban.replace(/\s/g, ""));
    setCopied(true);
    toast.success("IBAN kopyalandı!");
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmPayment = useCallback(async () => {
    if (!invoice) return;
    setProcessing(true);

    try {
      const { data, error: rpcErr } = await supabase.rpc("mark_invoice_paid", {
        p_invoice_id: invoice.id,
      });

      if (rpcErr) throw rpcErr;

      setJustPaid(true);
      setInvoice((prev) => prev ? { ...prev, status: "paid" } : prev);
      fireConfetti();
      toast.success("Ödeme onayınız alındı. Teşekkür ederiz!");
    } catch (err: any) {
      toast.error("Ödeme onaylanırken hata oluştu: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setProcessing(false);
    }
  }, [invoice]);

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="w-full max-w-lg p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-lg font-medium text-foreground">{error || "Fatura bulunamadı"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      {/* Header */}
      <header className="px-5 py-4">
        <span className="text-base font-bold tracking-tight text-foreground">
          Solo<span className="text-muted-foreground">Ops</span>
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 pt-6 pb-10">
        <div className="w-full max-w-lg space-y-5">
          {/* Invoice Card */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
            {/* Status + Invoice No */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{invoice.invoice_no}</p>
              <div className="transition-all duration-500">
                {isPaid ? (
                  <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border-0 text-xs font-medium px-2.5 py-0.5">
                    <Check className="mr-1 h-3 w-3" />
                    Ödendi ✓
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 border-0 text-xs font-medium px-2.5 py-0.5">
                    <Clock className="mr-1 h-3 w-3" />
                    Ödeme Bekliyor
                  </Badge>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="text-center py-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Toplam Tutar</p>
              <p className="text-4xl font-bold text-foreground tracking-tight">
                {fmtMoneyFull(invoice.amount, currency)}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Gönderen</span>
                <span className="font-medium text-foreground">{senderName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Alıcı</span>
                <span className="font-medium text-foreground">{clientName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Proje</span>
                <span className="font-medium text-foreground">{projectTitle}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Vade Tarihi</span>
                <span className="font-medium text-foreground">{fmtDate(invoice.due_date)}</span>
              </div>
            </div>
          </div>

          {/* IBAN Card */}
          {profile?.iban && (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Ödeme Bilgileri — IBAN</p>
              <button
                onClick={copyIban}
                className="w-full flex items-center justify-between bg-secondary border border-border rounded-xl px-4 py-3 text-left hover:border-muted-foreground/30 transition-colors group"
              >
                <span className="font-mono text-sm text-foreground tracking-wide">
                  {profile.iban}
                </span>
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 ml-2" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-2" />
                )}
              </button>
              {profile.bank_name && (
                <p className="text-xs text-muted-foreground mt-2">Banka: {profile.bank_name}</p>
              )}
            </div>
          )}

          {/* Confirm Button / Success State */}
          {!isPaid ? (
            <Button
              onClick={confirmPayment}
              disabled={processing}
              className="w-full rounded-xl py-6 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-80"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                "Ödemeyi Onayla"
              )}
            </Button>
          ) : (
            <Button
              disabled
              className="w-full rounded-xl py-6 text-lg font-bold bg-emerald-600 text-white shadow-sm cursor-default"
              size="lg"
            >
              <Check className="mr-2 h-5 w-5" />
              Ödeme Başarılı!
            </Button>
          )}

          {/* Thank you message */}
          {isPaid && (
            <div className="text-center py-4 animate-fadeIn">
              <p className="text-sm font-medium text-foreground">
                Ödemeniz başarıyla kaydedildi! 🎉
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Teşekkür ederiz, fatura durumu güncellendi.
              </p>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-[10px] text-muted-foreground/60 pt-2">
            Bu sayfa soloops tarafından oluşturulmuştur.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PayInvoice;
