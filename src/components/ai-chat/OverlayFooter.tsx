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
        "bg-gradient-to-t from-white/60 to-transparent backdrop-blur-sm border-t border-white/20",
        className
      )}
    >
      <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0px)]">
        {/* Recent history pill */}
        <button
          onClick={onOpen}
          aria-label="Open recent history"
          className="w-full h-12 rounded-full bg-white/90 backdrop-blur border border-black/10 shadow-sm
                     grid grid-cols-[auto,1fr,auto] items-center px-4 mt-3 text-[15px] text-gray-800 
                     hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 
                     focus-visible:ring-[#2A9D8F]/40"
        >
          <span className="mr-2 grid h-6 w-6 place-items-center text-gray-600">
            <Clock className="h-[14px] w-[14px]" aria-hidden="true" />
          </span>
          <span className="justify-self-start font-medium">Recent history</span>
          <span className="ml-2 text-gray-500">
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </button>

        {/* Caption */}
        <p className="mt-2 text-center text-xs text-gray-500">
          {caption}
        </p>
      </div>
    </div>
  );
}
