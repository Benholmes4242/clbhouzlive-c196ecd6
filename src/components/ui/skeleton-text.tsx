import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

type Variant = "heading" | "body" | "meta";

const HEIGHTS: Record<Variant, string> = {
  heading: "h-5",
  body: "h-4",
  meta: "h-3",
};

interface SkeletonTextProps {
  lines?: number;
  variant?: Variant;
  className?: string;
}

export function SkeletonText({ lines = 1, variant = "body", className }: SkeletonTextProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(HEIGHTS[variant], "w-full", i === lines - 1 && lines > 1 && "w-3/4")}
        />
      ))}
    </div>
  );
}

export default SkeletonText;
