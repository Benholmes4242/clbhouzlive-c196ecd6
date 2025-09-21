import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Dark glass utility for consistent styling across components
export const glassDark = "backdrop-blur-md bg-black/60 border border-white/15 shadow-[0_8px_40px_rgba(0,0,0,0.35)]";
