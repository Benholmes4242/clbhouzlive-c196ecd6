import { useEffect } from "react";
import { useBeforeUnload } from "react-router-dom";

interface Options {
  active: boolean;
  message?: string;
}

/**
 * Navigation guard hook - prevents navigation while active
 * Protects against accidental navigation during critical operations like form submissions
 */
export function useNavigationGuard({ active, message }: Options) {
  // Browser refresh / tab close
  useBeforeUnload(
    active
      ? (event) => {
          event.preventDefault();
          event.returnValue = message || "Your changes are still being saved.";
        }
      : undefined
  );

  // In-app navigation guard
  useEffect(() => {
    if (!active) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isNavLink = target.closest("a, [data-nav-link]");

      if (isNavLink) {
        const confirmLeave = window.confirm(
          message || "Your changes are still being saved. Leave anyway?"
        );
        if (!confirmLeave) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [active, message]);
}
