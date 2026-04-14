import AppLayout from "@/components/AppLayout";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

const Expenses = () => (
  <AppLayout>
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Giderler</h1>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-lg font-medium text-foreground">Henüz gider kaydı yok</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Giderlerinizi kaydedin ve harcamalarınızı kategorilere göre takip edin.
        </p>
        <Button className="mt-6" disabled>
          Gider Ekle
        </Button>
      </div>
    </div>
  </AppLayout>
);

export default Expenses;
