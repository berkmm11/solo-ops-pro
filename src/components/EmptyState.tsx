import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

const EmptyState = ({
  icon: Icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in min-h-[50vh]">
      <div className="mb-6">
        {emoji ? (
          <span className="text-5xl">{emoji}</span>
        ) : (
          <Icon className="h-12 w-12 text-muted-foreground/40" />
        )}
      </div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button className="mt-7 rounded-lg px-6 py-2" onClick={onAction} disabled={actionDisabled}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
