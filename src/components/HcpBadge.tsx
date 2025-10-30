import { formatHcp } from "@/lib/formatHcp";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

type Props = {
  value: number | null | undefined;
  show?: boolean; // optional privacy flag
  className?: string;
};

export default function HcpBadge({ value, show = true, className = "" }: Props) {
  const hcp = formatHcp(value);
  const isVisible = show && hcp !== "—";

  if (!isVisible && hcp === "—") {
    return null; // Don't show badge if no handicap
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={[
              "text-xs inline-flex items-center",
              isVisible ? "opacity-80" : "opacity-60 italic",
              className,
            ].join(" ")}
          >
            HCP {hcp}
          </span>
        </TooltipTrigger>
        <TooltipContent className="text-xs">
          Handicap from player profile
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
