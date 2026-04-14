import { useState } from "react";
import { Bot, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AiReminderSectionProps {
  invoiceId: string;
}

const AiReminderSection = ({ invoiceId }: AiReminderSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const generateReminder = async () => {
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("generate-reminder", {
        body: { invoice_id: invoiceId },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setMessage(data.message || "");
    } catch (err: any) {
      toast.error(`Hatırlatma oluşturulamadı: ${err.message || "Bilinmeyen hata"}. Lütfen tekrar deneyin.`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success("Panoya kopyalandı!");
    setTimeout(() => setCopied(false), 2000);
  };

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
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI hatırlatma hazırlıyor...
              </>
            ) : (
              <>
                <Bot className="mr-2 h-4 w-4" />
                Hatırlatma Oluştur
              </>
            )}
          </Button>
        )}

        {message && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="text-[15px] leading-relaxed"
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? (
                  <><Check className="mr-2 h-4 w-4" /> Kopyalandı</>
                ) : (
                  <><Copy className="mr-2 h-4 w-4" /> Kopyala</>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={generateReminder} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Yeniden Oluştur
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiReminderSection;
