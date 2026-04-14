import AppLayout from "@/components/AppLayout";

const Dashboard = () => (
  <AppLayout>
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Komuta Merkezi</h1>
      <p className="mt-2 text-muted-foreground">Henüz görüntülenecek veri yok.</p>
    </div>
  </AppLayout>
);

export default Dashboard;
