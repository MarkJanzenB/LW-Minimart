import { useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet, useNavigate } from "react-router-dom";

const Layout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const ensureOwnerExists = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).api?.auth) {
          const { hasOwner } = await (window as any).api.auth.hasOwner();
          if (!hasOwner) {
            navigate("/owner-setup");
          }
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
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-card flex items-center justify-end px-4 sticky top-0 z-10">
            <ModeToggle />
          </header>
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
