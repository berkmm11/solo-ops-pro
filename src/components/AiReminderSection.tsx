import { useState } from "react";
import { Bot, Loader2, Copy, Check, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AiReminderSectionProps {
  invoiceId: string;
  invoiceNo: string;
  clientPhone: string | null;
  clientEmail: string | null;
}

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

  const generateReminder = async () => {
    setLoading(true);
    setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-reminder", {
        body: { invoice_id: invoiceId },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setMessage(data.message || "");
    } catch (err: any) {
      toast.error(`Hatırlatma oluşturulamadı: ${err.message || "Bilinmeyen hata"}. Lütfen tekrar deneyin.`);
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
      toast.error("Bu müşterinin telefon numarası kayıtlı değil. Müşteri bilgilerini güncelle.");
      return;
    }
    const clean = clientPhone.replace(/[^0-9]/g, "");
    const normalized = clean.startsWith("0")
      ? "90" + clean.slice(1)
      : clean.startsWith("90")
        ? clean
        : "90" + clean;
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

        {!message && (
          <Button onClick={generateReminder} disabled={loading} size="lg" className="w-full">
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />AI hatırlatma hazırlıyor...</>
            ) : (
              <><Bot className="mr-2 h-4 w-4" />Hatırlatma Oluştur</>
            )}
          </Button>
        )}

        {message && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="text-[15px] leading-relaxed"
            />

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Kopyala */}
              <Button
                variant="outline"
                className="border"
                disabled={isEmpty}
                onClick={handleCopy}
              >
                <Copy className="mr-2 h-4 w-4" />
                Kopyala
              </Button>

              {/* WhatsApp */}
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
                {!clientPhone && (
                  <TooltipContent>Müşteri bilgisi eksik</TooltipContent>
                )}
              </Tooltip>

              {/* Mail */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="w-full">
                    <Button
                      variant="outline"
                      className="w-full border"
                      disabled={isEmpty || !clientEmail}
                      onClick={handleMail}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Mail Olarak Aç
                    </Button>
                  </span>
                </TooltipTrigger>
                {!clientEmail && (
                  <TooltipContent>Müşteri bilgisi eksik</TooltipContent>
                )}
              </Tooltip>
            </div>

            <p className="text-xs text-muted-foreground">
              Mesajı göndermeden önce gözden geçir ve düzenleyebilirsin.
            </p>

            {/* Regenerate */}
            <Button variant="ghost" size="sm" onClick={generateReminder} disabled={loading} className="text-muted-foreground">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yeniden Oluştur
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiReminderSection;
