import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type SlideInModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  initialFocusRef?: React.RefObject<HTMLButtonElement | HTMLDivElement>;
  mobileConstrained?: boolean;
};

export default function SlideInModal({
  open,
  title,
  onClose,
  children,
  initialFocusRef,
  mobileConstrained = false,
}: SlideInModalProps) {
  // Mount control so we can animate out before unmounting
  const [mounted, setMounted] = useState(false);
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
      setAnimateIn(false); // Always start off-screen for fresh animation
      
      // lock background scroll
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Double requestAnimationFrame ensures starting position is rendered before animation
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
      // start slide-out animation
      setAnimateIn(false);
      // unmount after the animation completes
      const timer = setTimeout(() => setMounted(false), 220);
      // restore focus to trigger element
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
      className={`fixed z-[1000] flex items-center justify-center ${
        mobileConstrained 
          ? 'top-[72px] bottom-[64px] left-0 right-0' 
          : 'inset-0'
      }`}
    >
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={onClose}
        className={`absolute ${
          mobileConstrained ? 'top-0 bottom-0 left-0 right-0' : 'inset-0'
        } bg-black/50 transition-opacity ${
          animateIn ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Panel container: keep centered; panel slides from right */}
      <div
        className={`relative 
          ${mobileConstrained 
            ? 'w-full h-full max-w-none' 
            : 'w-full h-screen max-w-none sm:w-[92vw] sm:max-w-[920px] sm:max-h-[98vh] sm:h-auto'
          }
          bg-background border border-border ${
            mobileConstrained ? 'rounded-none' : 'rounded-none sm:rounded-lg'
          } shadow-lg overflow-hidden
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
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted focus:outline-none focus:ring-0 border-0"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body scrolls; place your content here */}
        <div 
          className={`overflow-auto ${
            mobileConstrained 
              ? 'h-[calc(100%-80px)]' 
              : 'h-[calc(100vh-80px)] sm:max-h-[calc(98vh-80px)]'
          }`} 
          style={{ paddingBottom: mobileConstrained ? '16px' : 'env(safe-area-inset-bottom)' }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
