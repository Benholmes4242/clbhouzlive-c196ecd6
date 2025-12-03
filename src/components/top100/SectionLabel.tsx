import React from "react";
import { cn } from "@/lib/utils";

type SectionLabelProps = {
  icon: React.ReactNode;
  label: string;
  className?: string;
};

export function SectionLabel({ icon, label, className }: SectionLabelProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
        className
      )}
    >
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted">
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}

// 16x16 target-style icon for "Your standings"
export function StandingsIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3 w-3 text-muted-foreground"
    >
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
    </svg>
  );
}

// 16x16 flag/pin icon for "Course rankings"
export function CourseRankingsIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3 w-3 text-muted-foreground"
    >
      <path
        d="M4 2.5v11"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M4 3h6.2a1 1 0 0 1 .8 1.6L9.5 7l1.5 2.4A1 1 0 0 1 10.2 11H4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
