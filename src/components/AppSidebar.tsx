import { LayoutDashboard, Users, FolderKanban, FileText, Receipt, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Komuta Merkezi", url: "/dashboard", icon: LayoutDashboard },
  { title: "Müşteriler", url: "/clients", icon: Users },
  { title: "Projeler", url: "/projects", icon: FolderKanban },
  { title: "Faturalar", url: "/invoices", icon: FileText },
  { title: "Giderler", url: "/expenses", icon: Receipt },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight text-foreground">
            soloops
          </span>
        )}
        {collapsed && (
          <span className="text-lg font-semibold text-foreground">s</span>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-accent"
                      activeClassName="bg-accent text-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        {!collapsed && user && (
          <p className="text-xs text-muted-foreground truncate mb-2">
            {user.email}
          </p>
        )}
        <SidebarMenuButton onClick={signOut} className="hover:bg-accent">
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && <span>Çıkış Yap</span>}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
