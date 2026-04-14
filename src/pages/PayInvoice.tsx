import { useState } from "react";
import { Check, Copy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const mockInvoice = {
  invoice_no: "SOP-2026-001",
  sender: "Berk Freelance Studio",
  recipient: "Acme Corp",
  project: "Acme Corp Web Sitesi",
  amount: 45000,
  due_date: "01.05.2026",
  iban: "TR00 0000 0000 0000 0000 0000 00",
  status: "pending" as const,
};

const fmtAmount = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 0 });

const PayInvoice = () => {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const copyIban = async () => {
    await navigator.clipboard.writeText(mockInvoice.iban.replace(/\s/g, ""));
    setCopied(true);
    toast.success("IBAN kopyalandı!");
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmPayment = () => {
    setConfirmed(true);
    toast.success("Ödeme onayınız alındı. Teşekkür ederiz!");
  };

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
              {!confirmed ? (
                <Badge className="bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7] border-0 text-xs font-medium px-2.5 py-0.5">
                  <Clock className="mr-1 h-3 w-3" />
                  Ödeme Bekliyor
                </Badge>
              ) : (
                <Badge className="bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5] border-0 text-xs font-medium px-2.5 py-0.5">
                  <Check className="mr-1 h-3 w-3" />
                  Onaylandı
                </Badge>
              )}
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

          {/* Confirm Button */}
          {!confirmed ? (
            <Button
              onClick={confirmPayment}
              className="w-full rounded-xl py-6 text-lg font-bold bg-[#059669] hover:bg-[#047857] text-white shadow-sm"
              size="lg"
            >
              Ödemeyi Onayla
            </Button>
          ) : (
            <div className="text-center py-4 space-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#D1FAE5] mb-2">
                <Check className="h-6 w-6 text-[#059669]" />
              </div>
              <p className="text-sm font-medium text-[#111827]">Ödeme onayınız alındı</p>
              <p className="text-xs text-[#6B7280]">Teşekkür ederiz, en kısa sürede kontrol edilecektir.</p>
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
