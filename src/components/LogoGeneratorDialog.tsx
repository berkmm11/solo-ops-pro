import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

const styles = [
  { value: "minimalist", label: "Minimalist" },
  { value: "modern", label: "Modern" },
  { value: "bold", label: "Cesur / Bold" },
  { value: "playful", label: "Eğlenceli" },
  { value: "elegant", label: "Elegant" },
];

const colors = [
  { value: "", label: "Otomatik" },
  { value: "blue and white", label: "Mavi" },
  { value: "black and gold", label: "Siyah & Altın" },
  { value: "green and white", label: "Yeşil" },
  { value: "red and black", label: "Kırmızı" },
  { value: "purple and white", label: "Mor" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandName: string;
  specialty: string;
  userId: string;
  onLogoSelected: (url: string) => void;
}

const LogoGeneratorDialog = ({ open, onOpenChange, brandName, specialty, userId, onLogoSelected }: Props) => {
  const [name, setName] = useState(brandName);
  const [style, setStyle] = useState("minimalist");
  const [color, setColor] = useState("");
  const [generating, setGenerating] = useState(false);
  const [logos, setLogos] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!name.trim()) {
      toast.error("Marka adı gerekli");
      return;
    }
    setGenerating(true);
    setLogos([]);
    setSelectedIdx(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-logo", {
        body: { brandName: name, specialty, style, colorPreference: color },
      });
      if (error) throw error;
      if (data?.logos?.length) {
        setLogos(data.logos);
      } else {
        toast.error("Logo üretilemedi, tekrar deneyin.");
      }
    } catch (err: any) {
      toast.error("Hata: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setGenerating(false);
    }
  };

  const handleSelect = async () => {
    if (selectedIdx === null) return;
    setSaving(true);

    try {
      // Fetch the image and upload to storage
      const imgUrl = logos[selectedIdx];
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const ext = "png";
      const path = `${userId}/logo.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("profile-logos")
        .upload(path, blob, { upsert: true, contentType: "image/png" });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("profile-logos")
        .getPublicUrl(path);

      // Update profile
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ logo_url: urlData.publicUrl })
        .eq("user_id", userId);
      if (updateErr) throw updateErr;

      onLogoSelected(urlData.publicUrl);
      onOpenChange(false);
      toast.success("Logo kaydedildi ✓");
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
            <Sparkles className="h-5 w-5 text-primary" />
            AI ile Logo Oluştur
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Business ✨</span>
          </DialogTitle>
          <DialogDescription>Marka bilgilerini gir, AI senin için logo alternatifleri üretsin.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Marka Adı</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Marka adınız" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Stil</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {styles.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Renk Tercihi</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger><SelectValue placeholder="Otomatik" /></SelectTrigger>
                <SelectContent>
                  {colors.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={generating} className="w-full">
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Oluşturuluyor...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Logo Oluştur</>
            )}
          </Button>

          {logos.length > 0 && (
            <div className="space-y-3">
              <Label>Bir logo seç:</Label>
              <div className="grid grid-cols-2 gap-3">
                {logos.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedIdx(i)}
                    className={`relative border-2 rounded-lg overflow-hidden transition-all ${
                      selectedIdx === i
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <img src={url} alt={`Logo ${i + 1}`} className="w-full aspect-square object-contain bg-white" />
                    {selectedIdx === i && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <Button onClick={handleSelect} disabled={selectedIdx === null || saving} className="w-full">
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Kaydediliyor...</>
                ) : (
                  "Bu Logoyu Kullan"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogoGeneratorDialog;
