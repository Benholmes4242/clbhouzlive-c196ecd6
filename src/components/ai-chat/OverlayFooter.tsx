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
        {/* Recent history - frosted white pill with black text */}
        <button
          onClick={onOpen}
          aria-label="Open recent history"
          className="w-full flex items-center justify-between rounded-[14px] bg-white/80 backdrop-blur-md
                     border border-white/60 shadow-[0_8px_24px_rgba(0,0,0,0.4)]
                     px-3 py-3
                     active:scale-[0.99]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
                     transition-transform"
        >
          <span className="flex items-center gap-2 text-[15px] font-medium text-black">
            <Clock className="h-4 w-4 text-black/70" aria-hidden="true" />
            Recent history
          </span>
          <ChevronDown className="h-4 w-4 text-black/70" aria-hidden="true" />
        </button>

        {/* Caption - black text on frosted white background */}
        <p className="mt-2 text-[12px] leading-[16px] text-black/60 text-center">
          {caption}
        </p>
      </div>
    </div>
  );
}
