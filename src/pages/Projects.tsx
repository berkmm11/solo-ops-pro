import AppLayout from "@/components/AppLayout";
import { FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";

const Projects = () => (
  <AppLayout>
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Projeler</h1>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-lg font-medium text-foreground">Henüz proje yok</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Projelerinizi oluşturun, durumlarını takip edin ve müşterilerinize bağlayın.
        </p>
        <Button className="mt-6" disabled>
          Proje Oluştur
        </Button>
      </div>
    </div>
  </AppLayout>
);

export default Projects;
