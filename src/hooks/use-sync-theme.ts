import { useEffect } from "react";

/**
 * Mirrors the chart theme onto the document root `.dark` class so that
 * Base UI portals (rendered outside the chart container) inherit the same
 * CSS-variable palette.
 */
export function useSyncTheme(theme: string) {
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
}
