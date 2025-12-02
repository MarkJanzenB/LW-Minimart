import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ModeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const label = currentTheme === "light" ? "Switch to dark mode" : "Switch to light mode";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10 rounded-full border border-border/70 bg-white/70 text-secondary hover:bg-white dark:bg-transparent dark:text-foreground"
      onClick={() => setTheme(currentTheme === "light" ? "dark" : "light")}
      aria-label={label}
    >
      {mounted && currentTheme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
};

