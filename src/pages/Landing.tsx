import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import Hls from "hls.js";
import InfiniteSlider from "@/components/ui/infinite-slider";
import {
  Users,
  FileText,
  Bot,
  Wallet,
  ArrowRight,
  Zap,
  Quote,
} from "lucide-react";

/* ─── HLS Video Hero ─── */
const HeroVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const src =
      "https://customer-cbeadsgr09pnsezs.cloudflarestream.com/697945ca6b876878dba3b23fbd2f1561/manifest/video.m3u8";
    const mp4 =
      "/_videos/v1/f0c78f536d5f21a047fb7792723a36f9d647daa1";

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, () => {
        video.src = mp4;
      });
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else {
      video.src = mp4;
    }
  }, []);

  return (
    <div className="relative w-full -mt-[150px] z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-[#010101] via-transparent to-[#010101] z-20 pointer-events-none" />
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-auto mix-blend-screen"
      />
    </div>
  );
};

/* ─── Logo Cloud ─── */
const logos = [
  "https://html.tailus.io/blocks/customers/openai.svg",
  "https://html.tailus.io/blocks/customers/nvidia.svg",
  "https://html.tailus.io/blocks/customers/column.svg",
  "https://html.tailus.io/blocks/customers/github.svg",
  "https://html.tailus.io/blocks/customers/nike.svg",
  "https://html.tailus.io/blocks/customers/laravel.svg",
];

const LogoCloud = () => (
  <section className="relative z-30 border-t border-white/5 bg-black/20 backdrop-blur-sm py-8">
    <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center gap-8">
      <p className="text-sm text-white/40 whitespace-nowrap shrink-0">
        Güvenilen markalar
      </p>
      <div className="hidden md:block w-px h-8 bg-white/10" />
      <div className="flex-1 overflow-hidden">
        <InfiniteSlider speed={25} gap={56}>
          {logos.map((l) => (
            <img
              key={l}
              src={l}
              alt=""
              className="h-6 w-auto brightness-0 invert opacity-40 hover:opacity-70 transition-opacity"
            />
          ))}
        </InfiniteSlider>
      </div>
    </div>
  </section>
);

/* ─── Feature Cards ─── */
const features = [
  {
    icon: Users,
    title: "Müşteri Yönetimi",
    desc: "Tüm müşterilerin, projelerin ve güven skorları tek panelde. Kim ne zaman ödedi bir bakışta gör.",
  },
  {
    icon: FileText,
    title: "Akıllı Faturalama",
    desc: "KDV, stopaj, net tutar — Türkiye'ye özel hesaplamalar otomatik. PDF indir, link paylaş.",
  },
  {
    icon: Bot,
    title: "AI Hatırlatmalar",
    desc: "Yapay zeka sana nazik ama kararlı ödeme hatırlatma maili yazar. Kopyala, WhatsApp'tan gönder.",
  },
];

/* ─── Fade-in wrapper ─── */
const FadeIn = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ─── Main Landing ─── */
const Landing = () => {
  return (
    <div className="min-h-screen bg-[#010101] text-white overflow-hidden">
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-[#010101]/80 backdrop-blur-md border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">
            sol<span className="bg-gradient-to-r from-[#FA93FA] via-[#C967E8] to-[#983AD6] bg-clip-text text-transparent">oo</span>ps
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2"
            >
              Giriş Yap
            </Link>
            <Link
              to="/register"
              className="text-sm bg-white text-black font-medium px-5 py-2 rounded-full hover:bg-white/90 transition-colors"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-20 pt-24 md:pt-32 pb-0 text-center px-6">
        {/* Announcement pill */}
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(28,27,36,0.4)] border border-white/10 mb-8">
            <span className="flex items-center justify-center w-5 h-5 rounded bg-gradient-to-br from-[#FA93FA] to-[#983AD6]">
              <Zap className="w-3 h-3 text-white" />
            </span>
            <span className="text-xs text-white/60">
              Türkiye'nin freelance asistanı
            </span>
          </div>
        </FadeIn>

        {/* Headline */}
        <FadeIn delay={0.1}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold leading-[1.05] tracking-tight max-w-4xl mx-auto">
            <span className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
              Freelance işini
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#FA93FA] via-[#C967E8] to-[#983AD6] bg-clip-text text-transparent">
              akıllıca yönet.
            </span>
          </h1>
        </FadeIn>

        {/* Subtitle */}
        <FadeIn delay={0.2}>
          <p className="mt-6 text-base sm:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            Müşteri takibi, fatura, ödeme hatırlatma — hepsi tek yerde, hepsi
            Türkçe. Yapay zeka zor mailleri senin yerine yazsın.
          </p>
        </FadeIn>

        {/* CTA */}
        <FadeIn delay={0.3}>
          <div className="mt-10 flex flex-col items-center gap-3">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 bg-white text-black font-semibold text-base px-8 py-3.5 rounded-full hover:bg-white/90 transition-all"
            >
              Ücretsiz Dene
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[#FA93FA] to-[#983AD6] group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </span>
            </Link>
            <span className="text-xs text-white/30">
              Kredi kartı gerekmez
            </span>
          </div>
        </FadeIn>
      </section>

      {/* ── HERO VIDEO ── */}
      <HeroVideo />

      {/* ── LOGO CLOUD ── */}
      <LogoCloud />

      {/* ── ÖZELLİKLER ── */}
      <section className="relative z-30 py-24 md:py-32 px-6">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <p className="text-sm font-medium bg-gradient-to-r from-[#FA93FA] to-[#983AD6] bg-clip-text text-transparent text-center mb-4">
              ÖZELLİKLER
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Her şey tek yerde
            </h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.1}>
                <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-colors h-full">
                  {/* glow on hover */}
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[#FA93FA]/10 to-[#983AD6]/10 opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl" />
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FA93FA]/20 to-[#983AD6]/20 flex items-center justify-center mb-5">
                    <f.icon className="w-6 h-6 text-[#C967E8]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAFE-TO-SPEND ── */}
      <section className="relative z-30 py-24 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <div className="relative rounded-3xl border border-white/[0.06] bg-white/[0.02] p-12 md:p-20 overflow-hidden">
              {/* Background glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-[#FA93FA]/10 via-[#C967E8]/5 to-transparent rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#FA93FA]/20 to-[#983AD6]/20 flex items-center justify-center mb-8">
                  <Wallet className="w-8 h-8 text-[#C967E8]" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                  Hesabında ne kadar gerçekten senin?
                </h2>
                <p className="text-white/50 max-w-lg mx-auto leading-relaxed">
                  Vergiyi ve giderleri düşüp gönül rahatlığıyla
                  harcayabileceğin tutarı söylüyoruz. Artık "bu parayı
                  harcayabilir miyim?" sorusu yok.
                </p>

                {/* Illustrative number */}
                <div className="mt-10 inline-flex items-baseline gap-1">
                  <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#FA93FA] to-[#983AD6] bg-clip-text text-transparent">
                    ₺12.450
                  </span>
                  <span className="text-sm text-white/30 ml-2">
                    güvenli harcama
                  </span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOUNDER QUOTE ── */}
      <section className="relative z-30 py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn>
            <Quote className="w-10 h-10 text-[#983AD6]/40 mx-auto mb-8 rotate-180" />
            <blockquote className="text-xl md:text-2xl text-white/80 leading-relaxed font-light italic">
              "Bir hafta uğraştığım iş için bir ay para bekledim. Ne
              yazacağımı bilmiyordum. soloops'u ben olsam ne isterdim diye
              yaptık."
            </blockquote>
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FA93FA] to-[#983AD6] flex items-center justify-center text-sm font-bold">
                Y
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white/90">Yiğit</p>
                <p className="text-xs text-white/40">Kurucu</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="relative z-30 py-20 px-6">
        <FadeIn>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Hemen başla, ücretsiz.
            </h2>
            <p className="text-white/50 mb-8">
              Kurulum yok, kredi kartı yok. 2 dakikada hazır.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-black font-semibold px-8 py-3.5 rounded-full hover:bg-white/90 transition-colors"
            >
              Ücretsiz Dene
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-30 border-t border-white/5 py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="text-lg font-bold tracking-tight">
            sol<span className="bg-gradient-to-r from-[#FA93FA] to-[#983AD6] bg-clip-text text-transparent">oo</span>ps
          </Link>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link to="/login" className="hover:text-white/70 transition-colors">
              Giriş Yap
            </Link>
            <Link to="/register" className="hover:text-white/70 transition-colors">
              Kayıt Ol
            </Link>
            <span>Gizlilik</span>
            <span>Koşullar</span>
          </div>
          <p className="text-xs text-white/20">
            © 2026 soloops. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
