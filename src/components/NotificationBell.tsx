import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Notification {
  id: string;
  type: "due_soon" | "overdue" | "paid";
  title: string;
  description: string;
  timestamp: string;
}

const fmtAmount = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 0 }) + " ₺";

const iconMap = {
  due_soon: { icon: Clock, className: "text-amber-500 bg-amber-50" },
  overdue: { icon: AlertTriangle, className: "text-red-500 bg-red-50" },
  paid: { icon: CheckCircle, className: "text-emerald-500 bg-emerald-50" },
};

const NotificationBell = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("soloops_read_notifs");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_no, amount, due_date, status, clients(name), updated_at")
        .in("status", ["pending", "overdue", "paid"])
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const notifications = useMemo<Notification[]>(() => {
    const now = new Date();
    const twoDaysLater = new Date(now.getTime() + 2 * 86400000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const result: Notification[] = [];

    for (const inv of invoices) {
      const clientName = (inv as any).clients?.name || "Müşteri";
      const dueDate = new Date(inv.due_date);

      if (inv.status === "overdue") {
        result.push({
          id: `overdue-${inv.id}`,
          type: "overdue",
          title: `${inv.invoice_no} gecikti`,
          description: `${clientName} — ${fmtAmount(inv.amount)}`,
          timestamp: inv.updated_at,
        });
      } else if (inv.status === "pending" && dueDate <= twoDaysLater && dueDate >= now) {
        result.push({
          id: `due-${inv.id}`,
          type: "due_soon",
          title: `${inv.invoice_no} vadesi yaklaşıyor`,
          description: `${clientName} — ${fmtAmount(inv.amount)}`,
          timestamp: inv.updated_at,
        });
      } else if (inv.status === "paid" && new Date(inv.updated_at) >= sevenDaysAgo) {
        result.push({
          id: `paid-${inv.id}`,
          type: "paid",
          title: `${inv.invoice_no} ödendi`,
          description: `${clientName} — ${fmtAmount(inv.amount)}`,
          timestamp: inv.updated_at,
        });
      }
    }

    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [invoices]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAllRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    localStorage.setItem("soloops_read_notifs", JSON.stringify([...allIds]));
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      markAllRead();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-scale-in">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground">Bildirimler</h4>
          {notifications.length > 0 && (
            <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Tümünü okundu işaretle
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Bildirim yok</p>
            </div>
          ) : (
            notifications.map((n) => {
              const ic = iconMap[n.type];
              const Icon = ic.icon;
              return (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${ic.className}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true, locale: tr })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
