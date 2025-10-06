import * as React from "react";
import { Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type OverlayFooterProps = {
  onOpen: () => void;
  className?: string;
  caption?: string;
  isSticky?: boolean;
};

export function OverlayFooter({
  onOpen,
  className,
  caption = "Echo helps with chat and swing analysis. No data is shared publicly.",
  isSticky = true,
}: OverlayFooterProps) {
  return (
    <div
      className={cn(
        isSticky && "sticky bottom-0 z-[3]",
        className
      )}
    >
      <div className="space-y-2">
        {/* Recent history - de-emphasized secondary control */}
        <button
          onClick={onOpen}
          aria-label="Open recent history"
          className="w-full rounded-xl border border-neutral-200/70 bg-white/40 backdrop-blur
                     px-3 py-2 text-sm text-neutral-700
                     hover:bg-white/55 hover:border-neutral-300 shadow-none
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60
                     transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 opacity-60" aria-hidden="true" />
            <span className="flex-1 text-left">Recent history</span>
            <ChevronDown className="h-4 w-4 opacity-60" aria-hidden="true" />
          </div>
        </button>

        {/* Caption - tighter spacing */}
        <p className="text-[12px] leading-4 text-neutral-500 text-center mt-1">
          {caption}
        </p>
      </div>
    </div>
  );
}
