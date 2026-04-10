"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useHasMounted } from "@/hooks/use-has-mounted";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const mounted = useHasMounted();
  const { theme, setTheme } = useTheme();

  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`p-2 rounded-lg transition-colors ${className}`}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
