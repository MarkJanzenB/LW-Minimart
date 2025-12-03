import { Link, useLocation } from "react-router-dom";
import { 
  FileText, 
  Settings,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  Package,
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await window.api.auth.logout();
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error?.message ?? "Unable to log out.",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/pos", label: "POS", icon: ShoppingCart },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/cashflow", label: "Cashflow", icon: DollarSign },
    { path: "/reports", label: "Reports", icon: FileText },
  ];

  return (
    <div className="h-screen w-64 bg-[hsl(160,84%,8%)] border-r border-[hsl(160,40%,12%)] flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-[hsl(160,40%,12%)] shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base text-foreground">LW Mini Mart</span>
            <span className="text-xs text-muted-foreground">Inventory System</span>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-[hsl(160,40%,12%)] space-y-2 shrink-0">
        <Link
          to="/settings"
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            isActive("/settings")
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </Link>
        
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};
