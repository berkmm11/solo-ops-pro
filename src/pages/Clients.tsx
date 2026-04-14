import AppLayout from "@/components/AppLayout";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const Clients = () => (
  <AppLayout>
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Müşteriler</h1>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-lg font-medium text-foreground">Henüz müşteri yok</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Müşterilerinizi ekleyerek projelerinizi ve faturalarınızı kolayca yönetin.
        </p>
        <Button className="mt-6" disabled>
          Müşteri Ekle
        </Button>
      </div>
    </div>
  </AppLayout>
);

export default Clients;
