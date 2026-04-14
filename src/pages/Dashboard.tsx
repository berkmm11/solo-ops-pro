import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, HandCoins, TrendingUp, FolderKanban } from "lucide-react";

const stats = [
  { title: "Harcanabilir Bakiye", icon: Wallet },
  { title: "Toplam Alacak", icon: HandCoins },
  { title: "Bu Ay Kazanç", icon: TrendingUp },
  { title: "Aktif Projeler", icon: FolderKanban },
];

const Dashboard = () => (
  <AppLayout>
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">—</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </AppLayout>
);

export default Dashboard;
