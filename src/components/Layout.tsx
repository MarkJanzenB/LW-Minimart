import { useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet, useNavigate } from "react-router-dom";

const Layout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const ensureOwnerExists = async () => {
      try {
        const { hasOwner } = await window.api.auth.hasOwner();
        if (!hasOwner) {
          navigate("/owner-setup");
        }
      } catch (error) {
        console.error("Error checking owner existence in layout:", error);
      }
    };

    ensureOwnerExists();
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
