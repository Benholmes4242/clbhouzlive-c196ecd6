import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
};

interface SkeletonAvatarProps {
  size?: Size;
  className?: string;
}

export function SkeletonAvatar({ size = "md", className }: SkeletonAvatarProps) {
  return <Skeleton className={cn("rounded-full", SIZES[size], className)} />;
}

export default SkeletonAvatar;
