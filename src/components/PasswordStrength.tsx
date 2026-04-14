import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
}

const requirements = [
  { label: "En az 8 karakter", test: (p: string) => p.length >= 8 },
  { label: "En az bir büyük harf (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "En az bir küçük harf (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "En az bir rakam (0-9)", test: (p: string) => /[0-9]/.test(p) },
  { label: "En az bir özel karakter (!@#$%^&*)", test: (p: string) => /[!@#$%^&*]/.test(p) },
];

export const getPasswordValid = (password: string) =>
  requirements.every((r) => r.test(password));

const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  if (!password) return null;

  const passed = requirements.filter((r) => r.test(password)).length;
  const strength = passed <= 2 ? "weak" : passed <= 4 ? "medium" : "strong";
  const pct = (passed / requirements.length) * 100;

  const barColor = {
    weak: "bg-red-500",
    medium: "bg-amber-500",
    strong: "bg-emerald-500",
  }[strength];

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checklist */}
      <ul className="space-y-1">
        {requirements.map((req) => {
          const met = req.test(password);
          return (
            <li key={req.label} className="flex items-center gap-2 text-xs">
              {met ? (
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              )}
              <span className={cn(met ? "text-emerald-600" : "text-muted-foreground")}>
                {req.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrength;
