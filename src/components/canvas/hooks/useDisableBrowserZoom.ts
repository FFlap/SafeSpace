import { useEffect } from "react";

const blockedKeys = new Set(["+", "=", "-", "0"]);

export function useDisableBrowserZoom(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;

      if (blockedKeys.has(event.key)) {
        event.preventDefault();
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };

    const wheelOptions: AddEventListenerOptions = { passive: false };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, wheelOptions);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel, wheelOptions);
    };
  }, [enabled]);
}
