import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Moon, Sun } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "@/pages/Index";
import Cashflow from "@/pages/Cashflow";
import NotFound from "@/pages/NotFound";

const THEME_STORAGE_KEY = "finance-dashboard-theme";

type Theme = "light" | "dark";

const getPageTitle = (pathname: string): string => {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/cashflow")) return "Cashflow";
  if (pathname.startsWith("/pos")) return "Point of Sale";
  if (pathname.startsWith("/inventory")) return "Inventory";
  if (pathname.startsWith("/reports")) return "Reports";
  return "Page";
};

export const AppLayout = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-foreground" />
            <h1 className="text-lg font-semibold text-foreground hidden sm:block">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleTheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground text-xs"
              aria-label="Toggle color theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4 text-black" />
              )}
            </button>
          </div>
        </header>
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/cashflow" element={<Cashflow />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
