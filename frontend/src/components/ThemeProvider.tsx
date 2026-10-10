"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() { return useContext(ThemeCtx); }

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sh-theme") as Theme | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = saved || preferred;
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    document.body.style.backgroundColor = initial === "dark" ? "#1a2420" : "#f4f7f5";
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("sh-theme", next);
    document.documentElement.setAttribute("data-theme", next);
    document.body.style.backgroundColor = next === "dark" ? "#1a2420" : "#f4f7f5";
  };

  if (!mounted) {
    return <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>{children}</div>;
  }

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}
