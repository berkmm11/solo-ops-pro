import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";

const specialties = [
  "Grafik Tasarım",
  "Yazılım",
  "Çevirmenlik",
  "Fotoğrafçılık",
  "Video Editörlüğü",
  "Sosyal Medya",
  "Metin Yazarlığı",
  "Diğer",
];

const IBAN_REGEX = /^TR\d{24}$/;

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");

  // Step 2
  const [taxNo, setTaxNo] = useState("");
  const [address, setAddress] = useState("");
  const [iban, setIban] = useState("");
  const [bankName, setBankName] = useState("");

  // Step 3
  const [brandName, setBrandName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const step1Valid = fullName.trim() && phone.trim() && specialty;
  const step2Valid = taxNo.trim() && address.trim() && IBAN_REGEX.test(iban.replace(/\s/g, "").toUpperCase());

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo 2MB'dan küçük olmalı.");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const save = async (skipStep3 = false) => {
    if (!user) return;
    setSaving(true);

    try {
      let logoUrl: string | null = null;

      if (logoFile && !skipStep3) {
        const ext = logoFile.name.split(".").pop();
        const path = `${user.id}/logo.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("profile-logos")
          .upload(path, logoFile, { upsert: true });
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("profile-logos")
          .getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          specialty,
          tax_no: taxNo.trim(),
          address: address.trim(),
          iban: iban.replace(/\s/g, "").toUpperCase(),
          bank_name: bankName.trim() || null,
          brand_name: (skipStep3 ? fullName.trim() : brandName.trim()) || fullName.trim(),
          onboarding_completed: true,
          ...(logoUrl ? { logo_url: logoUrl } : {}),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Hesabın hazır! 🎉");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error("Kayıt sırasında hata: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="w-full bg-muted">
        <div
          className="h-1.5 bg-foreground transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <p className="text-lg font-semibold tracking-tight">sol<span style={{ transform: "scaleX(1.1)", display: "inline-block" }}>∞</span>ps</p>
            <h1 className="text-2xl font-semibold text-foreground">
              {step === 1 && "Kişisel Bilgiler"}
              {step === 2 && "Fatura Bilgileri"}
              {step === 3 && "Markan"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Adım {step} / 3
            </p>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Ad Soyad *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Mehmet Demir"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0532 123 45 67"
                />
              </div>
              <div className="space-y-2">
                <Label>Meslek / Uzmanlık Alanı *</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
              >
                Devam Et
              </Button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxNo">Vergi No / TC Kimlik *</Label>
                <Input
                  id="taxNo"
                  value={taxNo}
                  onChange={(e) => setTaxNo(e.target.value)}
                  placeholder="12345678901"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adres *</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Mahalle, Sokak, No, İlçe/İl"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iban">IBAN *</Label>
                <Input
                  id="iban"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                />
                {iban && !IBAN_REGEX.test(iban.replace(/\s/g, "").toUpperCase()) && (
                  <p className="text-xs text-destructive">TR + 24 rakam formatında olmalı</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">Banka Adı</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Ziraat Bankası"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Geri
                </Button>
                <Button className="flex-1" disabled={!step2Valid} onClick={() => setStep(3)}>
                  Devam Et
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brandName">Marka / Takma Ad</Label>
                <Input
                  id="brandName"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder={fullName || "Ad Soyadınız kullanılır"}
                />
                <p className="text-xs text-muted-foreground">Boş bırakırsan ad soyadın kullanılır</p>
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-foreground/30 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  {logoPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={logoPreview} alt="Logo" className="h-16 w-16 object-contain rounded" />
                      <p className="text-xs text-muted-foreground">Değiştirmek için tıkla</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-6 w-6" />
                      <p className="text-sm">Logo yükle (max 2MB)</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  Geri
                </Button>
                <Button className="flex-1" disabled={saving} onClick={() => save(false)}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Kaydediliyor...</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Tamamla</>}
                </Button>
              </div>

              <button
                type="button"
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground underline"
                onClick={() => save(true)}
                disabled={saving}
              >
                Sonra Tamamla
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
