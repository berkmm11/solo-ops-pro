import AppLayout from "@/components/AppLayout";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const Invoices = () => (
  <AppLayout>
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Faturalar</h1>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-lg font-medium text-foreground">Henüz fatura yok</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Faturalarınızı oluşturun, gönderin ve ödeme durumlarını takip edin.
        </p>
        <Button className="mt-6" disabled>
          Fatura Oluştur
        </Button>
      </div>
    </div>
  </AppLayout>
);

export default Invoices;
