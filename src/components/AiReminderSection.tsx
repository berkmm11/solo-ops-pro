import { useState } from "react";
import { Bot, Loader2, Copy, Mail, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AiReminderSectionProps {
  invoiceId: string;
  invoiceNo: string;
  clientPhone: string | null;
  clientEmail: string | null;
}

type Tone = "gentle" | "professional" | "firm";

const toneOptions: { value: Tone; label: string; desc: string; emoji: string }[] = [
  { value: "gentle", label: "Nazik ve Anlayışlı", desc: "İlk hatırlatma için, yumuşak ton", emoji: "🕊️" },
  { value: "professional", label: "Profesyonel ve Net", desc: "Standart, kararlı ton", emoji: "💼" },
  { value: "firm", label: "Ciddi ve Kararlı", desc: "Çok geciken durumlar için, direkt ton", emoji: "⚠️" },
];

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
};

const AiReminderSection = ({ invoiceId, invoiceNo, clientPhone, clientEmail }: AiReminderSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [toneModal, setToneModal] = useState(false);
  const [selectedTone, setSelectedTone] = useState<Tone>("professional");
  const [usedTone, setUsedTone] = useState<Tone>("professional");

  const generateReminder = async (tone: Tone) => {
    setToneModal(false);
    setLoading(true);
    setMessage("");
    setUsedTone(tone);
    try {
      const { data, error } = await supabase.functions.invoke("generate-reminder", {
        body: { invoice_id: invoiceId, tone },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setMessage(data.message || "");
    } catch (err: any) {
      toast.error(`Hatırlatma oluşturulamadı: ${err.message || "Bilinmeyen hata"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await copyText(message);
    toast.success("Metin panoya kopyalandı");
  };

  const handleWhatsApp = () => {
    if (!clientPhone) {
      toast.error("Bu müşterinin telefon numarası kayıtlı değil.");
      return;
    }
    const clean = clientPhone.replace(/[^0-9]/g, "");
    const normalized = clean.startsWith("0")
      ? "90" + clean.slice(1)
      : clean.startsWith("90") ? clean : "90" + clean;
    window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleMail = () => {
    if (!clientEmail) {
      toast.error("Bu müşterinin e-posta adresi kayıtlı değil.");
      return;
    }
    const subject = encodeURIComponent(`Fatura Hatırlatması — ${invoiceNo}`);
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
  };

  const isEmpty = !message.trim();
  const currentToneLabel = toneOptions.find((t) => t.value === usedTone)?.label;

  return (
    <div className="max-w-[800px] mx-auto mt-8 print:hidden">
      <div className="border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">AI Hatırlatma Asistanı</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Müşterine saygılı bir ödeme hatırlatma maili oluştursun.
        </p>

        {!message && !loading && (
          <Button onClick={() => setToneModal(true)} size="lg" className="w-full">
            <Bot className="mr-2 h-4 w-4" />
            Hatırlatma Oluştur
          </Button>
        )}

        {loading && (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span className="text-sm">AI hatırlatma hazırlıyor...</span>
          </div>
        )}

        {message && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Ton: <strong className="text-foreground">{currentToneLabel}</strong></span>
            </div>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="text-[15px] leading-relaxed"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button variant="outline" disabled={isEmpty} onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Kopyala
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="w-full">
                    <Button
                      className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white"
                      disabled={isEmpty || !clientPhone}
                      onClick={handleWhatsApp}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp'tan Gönder
                    </Button>
                  </span>
                </TooltipTrigger>
                {!clientPhone && <TooltipContent>Müşteri bilgisi eksik</TooltipContent>}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="w-full">
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isEmpty || !clientEmail}
                      onClick={handleMail}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Mail Olarak Aç
                    </Button>
                  </span>
                </TooltipTrigger>
                {!clientEmail && <TooltipContent>Müşteri bilgisi eksik</TooltipContent>}
              </Tooltip>
            </div>

            <p className="text-xs text-muted-foreground">
              Mesajı göndermeden önce gözden geçir ve düzenleyebilirsin.
            </p>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setToneModal(true)}
              disabled={loading}
              className="text-muted-foreground"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Farklı Tonla Dene
            </Button>
          </div>
        )}
      </div>

      {/* Tone selection modal */}
      <Dialog open={toneModal} onOpenChange={setToneModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hatırlatma Tonu Seç</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {toneOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedTone(opt.value)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  selectedTone === opt.value
                    ? "border-foreground bg-accent"
                    : "border-border hover:border-foreground/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{opt.emoji}</span>
                  <div>
                    <p className="font-medium text-sm text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <Button
            className="w-full mt-2"
            onClick={() => generateReminder(selectedTone)}
          >
            <Bot className="mr-2 h-4 w-4" />
            Oluştur
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AiReminderSection;
