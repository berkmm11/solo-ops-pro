import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

/* ── SVG Icons ── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const FiverrIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
    <path
      fill="#1DBF73"
      d="M22.004 4.2h-4.61c-.72 0-1.3.58-1.3 1.3v1.76h-2.86c-.1-1.7-1.52-3.06-3.26-3.06h-.76c-1.8 0-3.26 1.46-3.26 3.26v.1H4.18c-.42 0-.76.34-.76.76v1.5c0 .42.34.76.76.76h1.76v7.22c0 .42.34.76.76.76h2.5c.42 0 .76-.34.76-.76v-7.22h2.86v7.22c0 .42.34.76.76.76h2.5c.42 0 .76-.34.76-.76v-7.22h2.5v7.22c0 .42.34.76.76.76h2.5c.42 0 .76-.34.76-.76V5.5c0-.72-.58-1.3-1.3-1.3z"
    />
  </svg>
);

const BionlukIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
    <circle cx="12" cy="12" r="10" fill="#FF6B35" />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fill="white"
      fontSize="11"
      fontWeight="bold"
      fontFamily="Arial"
    >
      B
    </text>
  </svg>
);

const comingSoonToast = () =>
  toast.info("Bu entegrasyon roadmap'imizde, yakında aktif olacak.");

const SocialLoginButtons = () => {
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google ile giriş başarısız: " + String(result.error));
      }
    } catch {
      toast.error("Google ile giriş yapılamadı.");
    }
    setGoogleLoading(false);
  };

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">veya</span>
        <Separator className="flex-1" />
      </div>

      {/* Google — real OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full gap-3 border-border bg-background hover:bg-accent justify-center"
        onClick={handleGoogle}
        disabled={googleLoading}
      >
        <GoogleIcon />
        {googleLoading ? "Bağlanıyor..." : "Google ile Devam Et"}
      </Button>

      {/* Fiverr — coming soon */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-3 border-border bg-background justify-center opacity-50 cursor-not-allowed"
              disabled
              onClick={comingSoonToast}
            >
              <FiverrIcon />
              Fiverr ile Devam Et
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Yakında</TooltipContent>
      </Tooltip>

      {/* Bionluk — coming soon */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-3 border-border bg-background justify-center opacity-50 cursor-not-allowed"
              disabled
              onClick={comingSoonToast}
            >
              <BionlukIcon />
              Bionluk ile Devam Et
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Yakında</TooltipContent>
      </Tooltip>
    </div>
  );
};

export default SocialLoginButtons;
