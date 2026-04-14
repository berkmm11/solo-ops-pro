

# AI Logo Tasarımı ve Fatura Özelleştirme Planı

Bu plan, fal.ai API kullanarak iki "Business" özelliği ekler: **AI Logo Oluşturma** ve **AI Fatura Şablonu Özelleştirme**.

---

## Ön Koşul: fal.ai API Key

- `secrets--add_secret` ile kullanıcıdan `FAL_API_KEY` istenir
- Edge function'larda `Deno.env.get("FAL_API_KEY")` olarak kullanılır

---

## 1. AI Logo Oluşturma

**Nerede:** Ayarlar sayfasında (`/settings`) Marka kartı içinde, logo alanında "Logo yoksa AI ile oluştur" butonu.

**Akış:**
1. Kullanıcı logosu yoksa "AI ile Logo Oluştur" butonu görünür
2. Tıklayınca dialog açılır: marka adı, sektör, stil tercihi (minimalist, modern, cesur vb.) ve renk tercihi girilebilir
3. "Oluştur" butonuna basılır → edge function çağrılır
4. fal.ai'den 2-3 alternatif logo üretilir ve gösterilir
5. Kullanıcı birini seçer → `profile-logos` bucket'ına yüklenir ve profilde kaydedilir

**Teknik:**
- **Yeni Edge Function:** `supabase/functions/generate-logo/index.ts`
  - fal.ai flux/schnell veya benzeri model ile logo üretir
  - Prompt'u marka adı + stil + sektörden otomatik oluşturur
  - Base64 döner veya URL döner
- **Settings.tsx'e eklenenler:**
  - `LogoGeneratorDialog` bileşeni (dialog içinde form + sonuç galerisi)
  - Logo yokken "AI ile Oluştur ✨" butonu

---

## 2. AI Fatura Şablonu Özelleştirme

**Nerede:** Fatura detay sayfasında (`/invoice/:id`) veya yeni bir fatura şablon ayarları bölümünde.

**Akış:**
1. Kullanıcı fatura şablon tercihlerini ayarlar: renk şeması, layout stili, font tercihi
2. fal.ai ile fatura arka planı veya dekoratif elementler üretilir
3. Üretilen tasarım profilde kaydedilir ve tüm faturalara uygulanır

**Teknik:**
- **Yeni Edge Function:** `supabase/functions/generate-invoice-template/index.ts`
  - Kullanıcının tercihlerine göre fatura dekoratif elementleri üretir
- **DB Migration:** `profiles` tablosuna `invoice_template_config` (jsonb) kolonu eklenir — renk, stil, arka plan URL'si gibi tercihler saklanır
- **InvoiceDetail.tsx güncellenir:** Kaydedilen şablon tercihleri fatura görünümüne uygulanır
- **Yeni bileşen:** `InvoiceTemplateCustomizer` — şablon ayar dialog'u

---

## 3. Business Modeli İşareti

- Her iki özelliğin butonlarına "Business ✨" badge'i eklenir
- Şimdilik ücretsiz kullanılır, ileride ödeme entegrasyonu eklenebilir

---

## Dosya Değişiklikleri Özeti

| Dosya | İşlem |
|---|---|
| `supabase/functions/generate-logo/index.ts` | Yeni — fal.ai logo üretim |
| `supabase/functions/generate-invoice-template/index.ts` | Yeni — fal.ai fatura dekor üretim |
| `src/pages/Settings.tsx` | Güncelle — AI logo butonu ve dialog |
| `src/pages/InvoiceDetail.tsx` | Güncelle — şablon tercihleri uygula |
| `src/components/LogoGeneratorDialog.tsx` | Yeni — logo üretim UI |
| `src/components/InvoiceTemplateCustomizer.tsx` | Yeni — fatura şablon ayar UI |
| DB migration | `profiles` tablosuna `invoice_template_config` jsonb kolonu |

