import AppLayout from "@/components/AppLayout";

const Invoices = () => (
  <AppLayout>
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Faturalar</h1>
      <p className="mt-2 text-muted-foreground">Henüz fatura oluşturulmadı.</p>
    </div>
  </AppLayout>
);

export default Invoices;
