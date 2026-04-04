import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    if (typeof localStorage === "undefined") return true;
    const v = localStorage.getItem("sat_theme");
    if (v === "light") return false;
    if (v === "dark") return true;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("sat_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("sat_theme", "light");
    }
  }, [dark]);

  const value = useMemo(
    () => ({
      dark,
      toggle: () => setDark((d) => !d),
      setDark,
    }),
    [dark]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme outside provider");
  return ctx;
}
