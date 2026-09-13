"use client";
import { ThemeProvider, useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function Themes({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      className="icon-button theme-toggle"
      aria-label="Switch light or dark theme"
      title="Switch light or dark theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon className="light-icon" size={17} />
      <Sun className="dark-icon" size={17} />
    </button>
  );
}
