import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Check, Copy, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const mockInvoice = {
  invoice_no: "SOP-2026-001",
  sender: "Berk Freelance Studio",
  recipient: "Acme Corp",
  project: "Acme Corp Web Sitesi",
  amount: 45000,
  due_date: "01.05.2026",
  iban: "TR00 0000 0000 0000 0000 0000 00",
};

const fmtAmount = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 0 });

const fireConfetti = () => {
  const colors = ["#FFD700", "#FFA500", "#10B981", "#059669", "#3B82F6", "#6366F1"];
  const end = Date.now() + 3500;

  const frame = () => {
    if (Date.now() > end) return;

    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
    });

    requestAnimationFrame(frame);
  };

  // Big initial burst
  confetti({
    particleCount: 100,
    spread: 100,
    origin: { y: 0.5 },
    colors,
    startVelocity: 45,
    gravity: 0.8,
    scalar: 1.2,
  });

  frame();
};

const PayInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const storageKey = `soloops_paid_${id || "demo"}`;

  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(() => localStorage.getItem(storageKey) === "true");
  const [showThankYou, setShowThankYou] = useState(paid);

  const copyIban = async () => {
    await navigator.clipboard.writeText(mockInvoice.iban.replace(/\s/g, ""));
    setCopied(true);
    toast.success("IBAN kopyalandı!");
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmPayment = useCallback(() => {
    setProcessing(true);

    setTimeout(() => {
      setProcessing(false);
      setPaid(true);
      localStorage.setItem(storageKey, "true");
      fireConfetti();
      toast.success("Ödeme onayınız alındı. Teşekkür ederiz!");

      setTimeout(() => setShowThankYou(true), 600);
    }, 1500);
  }, [storageKey]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Header */}
      <header className="px-5 py-4">
        <span className="text-base font-bold tracking-tight text-[#111827]">
          Solo<span className="text-[#6B7280]">Ops</span>
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 pt-6 pb-10">
        <div className="w-full max-w-lg space-y-5">
          {/* Invoice Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-5">
            {/* Status + Invoice No */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#6B7280]">{mockInvoice.invoice_no}</p>
              <div className="transition-all duration-500">
                {paid ? (
                  <Badge className="bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5] border-0 text-xs font-medium px-2.5 py-0.5 animate-scale-in">
                    <Check className="mr-1 h-3 w-3" />
                    Ödendi ✓
                  </Badge>
                ) : (
                  <Badge className="bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7] border-0 text-xs font-medium px-2.5 py-0.5">
                    <Clock className="mr-1 h-3 w-3" />
                    Ödeme Bekliyor
                  </Badge>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="text-center py-3">
              <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Toplam Tutar</p>
              <p className="text-4xl font-bold text-[#111827] tracking-tight">
                ₺{fmtAmount(mockInvoice.amount)}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Gönderen</span>
                <span className="font-medium text-[#111827]">{mockInvoice.sender}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Alıcı</span>
                <span className="font-medium text-[#111827]">{mockInvoice.recipient}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#F3F4F6]">
                <span className="text-[#6B7280]">Proje</span>
                <span className="font-medium text-[#111827]">{mockInvoice.project}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#6B7280]">Vade Tarihi</span>
                <span className="font-medium text-[#111827]">{mockInvoice.due_date}</span>
              </div>
            </div>
          </div>

          {/* IBAN Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-3">Ödeme Bilgileri — IBAN</p>
            <button
              onClick={copyIban}
              className="w-full flex items-center justify-between bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-left hover:border-[#D1D5DB] transition-colors group"
            >
              <span className="font-mono text-sm text-[#111827] tracking-wide">
                {mockInvoice.iban}
              </span>
              {copied ? (
                <Check className="h-4 w-4 text-[#059669] shrink-0 ml-2" />
              ) : (
                <Copy className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#6B7280] shrink-0 ml-2" />
              )}
            </button>
            <p className="text-xs text-[#9CA3AF] mt-2">Kopyalamak için tıklayın</p>
          </div>

          {/* Confirm Button / Success State */}
          {!paid ? (
            <Button
              onClick={confirmPayment}
              disabled={processing}
              className="w-full rounded-xl py-6 text-lg font-bold bg-[#059669] hover:bg-[#047857] text-white shadow-sm disabled:opacity-80"
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
              className="w-full rounded-xl py-6 text-lg font-bold bg-[#059669] text-white shadow-sm cursor-default animate-scale-in"
              size="lg"
            >
              <Check className="mr-2 h-5 w-5" />
              Ödeme Başarılı!
            </Button>
          )}

          {/* Thank you message */}
          {showThankYou && (
            <div className="text-center py-4 animate-fade-in">
              <p className="text-sm font-medium text-[#111827]">
                Harikasınız! Berk projenin bir sonraki aşamasına büyük bir motivasyonla başlıyor 🎉
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                Teşekkür ederiz, en kısa sürede kontrol edilecektir.
              </p>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-[10px] text-[#9CA3AF] pt-2">
            Bu sayfa SoloOps tarafından oluşturulmuştur. Güvenli ödeme sayfası.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PayInvoice;
