import AppLayout from "@/components/AppLayout";

const Expenses = () => (
  <AppLayout>
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Giderler</h1>
      <p className="mt-2 text-muted-foreground">Henüz gider kaydı yok.</p>
    </div>
  </AppLayout>
);

export default Expenses;
