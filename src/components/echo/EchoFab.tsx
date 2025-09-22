import React from "react";
import { cn } from "@/lib/utils";

type EchoFabProps = {
  onClick?: () => void;
  className?: string;
  label?: string; // defaults to "Echo"
};

export default function EchoFab({ onClick, className, label = "Echo" }: EchoFabProps) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={cn(
        "group echo-fab fixed",
        // safe-area aware bottom-right
        "right-4 bottom-[calc(76px+env(safe-area-inset-bottom,0px))]",
        "h-14 w-14 rounded-full",
        // glass base
        "backdrop-blur-md",
        "bg-[var(--glass-bg)] border border-[var(--glass-border)]",
        "shadow-[var(--glass-shadow)]",
        // interaction
        "transition-transform duration-150 active:scale-[var(--echo-press-scale)]",
        "z-[120]",
        className
      )}
    >
      {/* gradient ring pulse */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full",
          "before:content-[''] before:absolute before:inset-[-6px] before:rounded-full",
          "before:bg-[var(--echo-ring)] before:opacity-[.08]",
          "before:animate-[echoPulse_var(--echo-pulse-duration)_ease-out_infinite]",
          "echo-pulse"
        )}
      />

      {/* inner content */}
      <span
        className={cn(
          "relative z-[1] flex h-full w-full items-center justify-center gap-1",
          "text-[13px] font-semibold tracking-wide"
        )}
        style={{
          background: "var(--echo-grad)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {/* Icon — replace with your Echo glyph if you have one */}
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          className="shrink-0"
          style={{ filter: "drop-shadow(0 1px 0 rgba(0,0,0,.15))" }}
          aria-hidden
        >
          <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 12a8 8 0 0 0 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
        <span className="sr-only md:not-sr-only md:leading-none">Echo</span>
      </span>

      {/* subtle hover ring (desktop) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </button>
  );
}