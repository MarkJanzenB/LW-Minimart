import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  FileText, 
  LayoutDashboard,
  ShoppingCart,
  Package,
  DollarSign,
  Settings,
  LogOut,
  History
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/pos", label: "POS", icon: ShoppingCart },
  { path: "/inventory", label: "Inventory", icon: Package },
  {
    path: "/history",
    label: "History",
    icon: History,
    subItems: [
      { path: "/history/restock", label: "Restock" },
      { path: "/history/sales", label: "Sales" },
      { path: "/history/spoilage", label: "Spoilage" },
    ],
  },
  { path: "/cashflow", label: "Cashflow", icon: DollarSign },
  { path: "/reports", label: "Reports", icon: FileText },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { open } = useSidebar();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/pos' && currentPath.startsWith('/pos/')) {
      return true;
    }
    return currentPath === path;
  };

  const handleSignOut = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).api?.auth) {
        await (window as any).api.auth.logout();
        toast({
          title: "Signed out successfully",
          description: "You have been logged out of your account.",
        });
        navigate("/signin");
      } else {
        navigate("/signin");
      }
    } catch (error) {
      console.error("Sign out error:", error);
      navigate("/signin");
    }
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-sidebar-border bg-sidebar"
      // 1. Widen the closed state to 5rem (approx 80px)
      style={{
        "--sidebar-width-icon": "5rem" 
      } as React.CSSProperties}
    >
      <SidebarContent className="px-3 py-5">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {menuItems.map((item) =>
                item.subItems ? (
                  <SidebarMenuItem key={item.path}>
                    <SidebarGroup>
                      <SidebarMenuButton
                        isActive={isActive(item.path)}
                        className="hover:bg-sidebar-accent transition-colors"
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </SidebarMenuButton>
                      <SidebarGroupContent className="pt-1">
                        <SidebarMenu className="space-y-1">
                          {item.subItems.map((subItem) => (
                            <SidebarMenuItem key={subItem.path}>
                              <SidebarMenuButton
                                asChild
                                isActive={currentPath === subItem.path}
                                className="hover:bg-sidebar-accent transition-colors text-sm justify-start"
                              >
                                <Link to={subItem.path} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                                  <span className="w-5 h-5 flex items-center justify-center">
                                    <span className={`w-1.5 h-1.5 rounded-full ${currentPath === subItem.path ? 'bg-primary' : 'bg-muted-foreground/50'}`}></span>
                                  </span>
                                  <span className="font-medium">{subItem.label}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  </SidebarMenuItem>
                ) : (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      className="hover:bg-sidebar-accent transition-colors"
                    >
                      <Link to={item.path} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border/50">
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              isActive={isActive("/settings")}
              className="hover:bg-sidebar-accent transition-colors"
            >
              <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleSignOut}
              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
              tooltip={!open ? "Sign Out" : undefined}
            >
              <LogOut className="w-5 h-5" />
              {open && <span className="font-medium">Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}