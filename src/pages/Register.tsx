import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import PasswordStrength, { getPasswordValid } from "@/components/PasswordStrength";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import SocialLoginButtons from "@/components/SocialLoginButtons";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();

  if (session) return <Navigate to="/dashboard" replace />;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Hata", description: "Şifreler eşleşmiyor", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      toast({ title: "Kayıt başarısız", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Kayıt başarılı", description: "E-posta adresinizi doğrulayın." });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm border border-border shadow-none">
        <CardHeader className="text-center">
          <p className="text-lg font-semibold tracking-tight mb-1">soloops</p>
          <CardTitle className="text-xl">Kayıt Ol</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email/Password Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <PasswordStrength password={password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !getPasswordValid(password)}>
              {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
            </Button>
          </form>

          {/* Social Login */}
          <SocialLoginButtons />

          <p className="text-center text-sm text-muted-foreground">
            Zaten hesabınız var mı?{" "}
            <Link to="/login" className="text-foreground underline hover:text-foreground/80">
              Giriş Yap
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Giriş yaparak Kullanım Koşullarını ve Gizlilik Politikasını kabul etmiş olursunuz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
