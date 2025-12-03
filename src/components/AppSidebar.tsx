import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  FileText, 
  LayoutDashboard,
  ShoppingCart,
  Package,
  DollarSign,
  Settings,
  LogOut
} from "lucide-react";
import logoWithText from "@/assets/lw-logo-with-text.png";
import logoIcon from "@/assets/lw-logo-icon.png";
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
  { path: "/cashflow", label: "Cashflow", icon: DollarSign },
  { path: "/reports", label: "Reports", icon: FileText },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { open } = useSidebar();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const handleSignOut = async () => {
    try {
      await window.api.auth.logout();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      navigate("/signin");
    } catch (error) {
      console.error("Sign out error:", error);
      navigate("/signin");
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border/50">
        {open ? (
          <img src={logoWithText} alt="LW Mini Mart" className="h-8" />
        ) : (
          <img src={logoIcon} alt="LW Mini Mart" className="h-8 w-8 mx-auto" />
        )}
      </div>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
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
              ))}
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
              className="hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
            >
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
