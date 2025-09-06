import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type SlideInModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  initialFocusRef?: React.RefObject<HTMLButtonElement | HTMLDivElement>;
};

export default function SlideInModal({
  open,
  title,
  onClose,
  children,
  initialFocusRef,
}: SlideInModalProps) {
  // Mount control so we can animate out before unmounting
  const [mounted, setMounted] = useState(open);
  const [animateIn, setAnimateIn] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Remember the element that triggered the modal to restore focus later
  useEffect(() => {
    if (open) {
      triggerRef.current = (document.activeElement as HTMLElement) ?? null;
    }
  }, [open]);

  // Handle mount/unmount and animation phases
  useEffect(() => {
    if (open) {
      setMounted(true);
      setAnimateIn(false); // Ensure we start off-screen
      
      // lock background scroll
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Wait for next frame to ensure starting position is applied, then animate in
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });

      // focus handling - delay to ensure modal is visible
      const focusTarget =
        (initialFocusRef?.current as HTMLElement) ||
        (closeBtnRef.current as HTMLElement);
      const focusId = setTimeout(() => focusTarget?.focus?.(), 300);

      return () => {
        cancelAnimationFrame(id);
        clearTimeout(focusId);
        document.body.style.overflow = prevOverflow;
      };
    } else if (mounted) {
      // start slide-out
      setAnimateIn(false);
      // unmount after the animation ends
      const timer = setTimeout(() => setMounted(false), 220);
      // restore focus to trigger
      const el = triggerRef.current;
      if (el) setTimeout(() => el.focus(), 230);
      return () => clearTimeout(timer);
    }
  }, [open, mounted, initialFocusRef]);

  // Close on Esc
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="region-modal-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity ${
          animateIn ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Panel container: keep centered; panel slides from right */}
      <div
        className={`relative w-[92vw] max-w-[920px] max-h-[92vh] bg-background border border-border rounded-lg shadow-lg overflow-hidden
          transform transition-transform
          ${animateIn ? "translate-x-0" : "translate-x-full"}
        `}
        style={{
          transitionTimingFunction: animateIn ? "cubic-bezier(0.0,0.0,0.2,1)" : "cubic-bezier(0.4,0.0,1,1)",
          transitionDuration: animateIn ? "260ms" : "210ms",
        }}
      >
        {/* Header (sticky inside the scroll container) */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <h2 id="region-modal-title" className="text-xl sm:text-2xl font-bold">
              {title}
            </h2>
            <button
              ref={closeBtnRef}
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body scrolls; place your content here */}
        <div className="overflow-auto max-h-[calc(92vh-80px)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
