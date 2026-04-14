import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload, Save, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import LogoGeneratorDialog from "@/components/LogoGeneratorDialog";

const specialties = [
  "Grafik Tasarım", "Yazılım", "Çevirmenlik", "Fotoğrafçılık",
  "Video Editörlüğü", "Sosyal Medya", "Metin Yazarlığı", "Diğer",
];

const IBAN_REGEX = /^TR\d{24}$/;

const Settings = () => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [taxNo, setTaxNo] = useState("");
  const [address, setAddress] = useState("");
  const [iban, setIban] = useState("");
  const [bankName, setBankName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [aiLogoOpen, setAiLogoOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setSpecialty(data.specialty || "");
        setTaxNo(data.tax_no || "");
        setAddress(data.address || "");
        setIban(data.iban || "");
        setBankName(data.bank_name || "");
        setBrandName(data.brand_name || "");
        setLogoUrl(data.logo_url);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

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

  const ibanValid = !iban || IBAN_REGEX.test(iban.replace(/\s/g, "").toUpperCase());

  const handleSave = async () => {
    if (!user) return;
    if (iban && !ibanValid) {
      toast.error("IBAN formatı geçersiz (TR + 24 rakam)");
      return;
    }

    setSaving(true);
    try {
      let newLogoUrl = logoUrl;

      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const path = `${user.id}/logo.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("profile-logos")
          .upload(path, logoFile, { upsert: true });
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("profile-logos")
          .getPublicUrl(path);
        newLogoUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          specialty: specialty || null,
          tax_no: taxNo.trim() || null,
          address: address.trim() || null,
          iban: iban ? iban.replace(/\s/g, "").toUpperCase() : null,
          bank_name: bankName.trim() || null,
          brand_name: brandName.trim() || null,
          ...(newLogoUrl !== logoUrl ? { logo_url: newLogoUrl } : {}),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setLogoUrl(newLogoUrl);
      setLogoFile(null);
      setLogoPreview(null);
      toast.success("Profil güncellendi ✓");
    } catch (err: any) {
      toast.error("Hata: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setSaving(false);
    }
  };

  const currentLogo = logoPreview || logoUrl;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">Profil Ayarları</h1>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* Kişisel Bilgiler */}
            <Card className="border border-border shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Kişisel Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Ad Soyad</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Mehmet Demir" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0532 123 45 67" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Meslek / Uzmanlık Alanı</Label>
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
              </CardContent>
            </Card>

            {/* Fatura Bilgileri */}
            <Card className="border border-border shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Fatura Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxNo">Vergi No / TC Kimlik</Label>
                    <Input id="taxNo" value={taxNo} onChange={(e) => setTaxNo(e.target.value)} placeholder="12345678901" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Banka Adı</Label>
                    <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ziraat Bankası" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN</Label>
                  <Input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="TR00 0000 0000 0000 0000 0000 00" />
                  {iban && !ibanValid && (
                    <p className="text-xs text-destructive">TR + 24 rakam formatında olmalı</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adres</Label>
                  <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Mahalle, Sokak, No, İlçe/İl" rows={3} />
                </div>
              </CardContent>
            </Card>

            {/* Marka */}
            <Card className="border border-border shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Marka</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brandName">Marka / Takma Ad</Label>
                  <Input id="brandName" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder={fullName || "Ad Soyadınız kullanılır"} />
                  <p className="text-xs text-muted-foreground">Boş bırakırsan ad soyadın kullanılır</p>
                </div>
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-foreground/30 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    {currentLogo ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={currentLogo} alt="Logo" className="h-16 w-16 object-contain rounded" />
                    <p className="text-xs text-muted-foreground">Değiştirmek için tıkla</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <p className="text-sm">Logo yükle (max 2MB)</p>
                      </div>
                    )}
                  </div>
                  {!currentLogo && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAiLogoOpen(true)}
                      className="w-full"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      AI ile Logo Oluştur
                      <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Business ✨</span>
                    </Button>
                   )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save */}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Kaydediliyor...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />Kaydet</>
              )}
            </Button>
          </>
        )}

        {user && (
          <LogoGeneratorDialog
            open={aiLogoOpen}
            onOpenChange={setAiLogoOpen}
            brandName={brandName || fullName}
            specialty={specialty}
            userId={user.id}
            onLogoSelected={(url) => {
              setLogoUrl(url);
              setLogoFile(null);
              setLogoPreview(null);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Settings;
