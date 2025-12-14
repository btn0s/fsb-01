import { useEffect } from "react";

/**
 * Hook to listen for a keyboard shortcut to activate voice input
 * Default: Cmd+K (Mac) / Ctrl+K (Windows)
 */
export function useVoiceShortcut(
  onActivate: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Cmd+K on Mac, Ctrl+K on Windows
      if ((e.metaKey || e.ctrlKey) && e.code === "KeyK") {
        e.preventDefault();
        e.stopPropagation();
        onActivate();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onActivate, enabled]);
}

