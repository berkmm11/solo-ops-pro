import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Check, Palette } from "lucide-react";
import { toast } from "sonner";

const templateStyles = [
  { value: "classic", label: "Klasik" },
  { value: "modern", label: "Modern" },
  { value: "creative", label: "Yaratıcı" },
  { value: "minimal", label: "Minimal" },
];

const colorSchemes = [
  { value: "", label: "Gri tonları" },
  { value: "navy blue", label: "Lacivert" },
  { value: "forest green", label: "Yeşil" },
  { value: "burgundy red", label: "Bordo" },
  { value: "royal purple", label: "Mor" },
  { value: "warm gold", label: "Altın" },
];

const accentColors: Record<string, string> = {
  "": "#111827",
  "navy blue": "#1e3a5f",
  "forest green": "#1b4332",
  "burgundy red": "#722f37",
  "royal purple": "#4a1a6b",
  "warm gold": "#8b6914",
};

interface InvoiceTemplateConfig {
  style: string;
  colorScheme: string;
  headerImageUrl: string | null;
  accentColor: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  brandName: string;
  currentConfig: InvoiceTemplateConfig | null;
  onConfigSaved: (config: InvoiceTemplateConfig) => void;
}

const InvoiceTemplateCustomizer = ({ open, onOpenChange, userId, brandName, currentConfig, onConfigSaved }: Props) => {
  const [style, setStyle] = useState(currentConfig?.style || "minimal");
  const [colorScheme, setColorScheme] = useState(currentConfig?.colorScheme || "");
  const [generating, setGenerating] = useState(false);
  const [templates, setTemplates] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setTemplates([]);
    setSelectedIdx(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-invoice-template", {
        body: { style, colorScheme, brandName },
      });
      if (error) throw error;
      if (data?.templates?.length) {
        setTemplates(data.templates);
      } else {
        toast.error("Şablon üretilemedi, tekrar deneyin.");
      }
    } catch (err: any) {
      toast.error("Hata: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let headerImageUrl: string | null = null;

      if (selectedIdx !== null && templates[selectedIdx]) {
        // Upload header image to storage
        const imgUrl = templates[selectedIdx];
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        const path = `${userId}/invoice-header.png`;

        const { error: uploadErr } = await supabase.storage
          .from("profile-logos")
          .upload(path, blob, { upsert: true, contentType: "image/png" });
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("profile-logos")
          .getPublicUrl(path);
        headerImageUrl = urlData.publicUrl;
      }

      const config: InvoiceTemplateConfig = {
        style,
        colorScheme,
        headerImageUrl,
        accentColor: accentColors[colorScheme] || "#111827",
      };

      const { error } = await supabase
        .from("profiles")
        .update({ invoice_template_config: config as any })
        .eq("user_id", userId);
      if (error) throw error;

      onConfigSaved(config);
      onOpenChange(false);
      toast.success("Fatura şablonu kaydedildi ✓");
    } catch (err: any) {
      toast.error("Hata: " + (err.message || "Kayıt başarısız"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Fatura Şablonu Özelleştir
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Business ✨</span>
          </DialogTitle>
          <DialogDescription>AI ile fatura başlığı tasarla ve renk şemanı seç.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Şablon Stili</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {templateStyles.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Renk Şeması</Label>
              <Select value={colorScheme} onValueChange={setColorScheme}>
                <SelectTrigger><SelectValue placeholder="Gri tonları" /></SelectTrigger>
                <SelectContent>
                  {colorSchemes.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={generating} className="w-full">
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Tasarım oluşturuluyor...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Başlık Tasarımı Oluştur</>
            )}
          </Button>

          {templates.length > 0 && (
            <div className="space-y-3">
              <Label>Bir tasarım seç (opsiyonel):</Label>
              <div className="space-y-2">
                {templates.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedIdx(i)}
                    className={`relative w-full border-2 rounded-lg overflow-hidden transition-all ${
                      selectedIdx === i
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <img src={url} alt={`Template ${i + 1}`} className="w-full h-20 object-cover bg-white" />
                    {selectedIdx === i && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Kaydediliyor...</>
            ) : (
              "Şablonu Kaydet"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceTemplateCustomizer;
