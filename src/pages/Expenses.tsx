import AppLayout from "@/components/AppLayout";
import EmptyState from "@/components/EmptyState";
import { Receipt } from "lucide-react";

const Expenses = () => (
  <AppLayout>
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Giderler</h1>
      <EmptyState
        icon={Receipt}
        emoji="💰"
        title="Henüz gider kaydı yok"
        description="Giderlerinizi ekleyin, harcanabilir bakiyeniz otomatik hesaplansın."
        actionLabel="Gider Ekle"
        actionDisabled
      />
    </div>
  </AppLayout>
);

export default Expenses;
