import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  postId: string | number;
  text: string;
  maxCollapsedLines?: number; // default 1
  className?: string;
  onToggle?(expanded: boolean): void;
};

export default function ExpandableCaption({
  postId,
  text,
  maxCollapsedLines = 1,
  className,
  onToggle
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    onToggle?.(next);
  };

  // Optional micro-perf: precompute whether we even need truncation
  const needsClamp = useMemo(() => text && text.length > 0, [text]);

  if (!text) return null;

  return (
    <div
      role="button"
      aria-expanded={expanded}
      aria-label={expanded ? "Collapse caption" : "Expand caption"}
      onClick={handleToggle}
      className={cn(
        "relative text-white/95 leading-snug cursor-pointer",
        // keep taps easy
        "active:opacity-90 transition-opacity",
        className
      )}
      style={{ 
        textShadow: '0 1px 3px rgba(0,0,0,0.7)',
        minWidth: '44px',
        minHeight: '44px',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Text */}
      <p
        className={cn(
          "whitespace-pre-line break-words", // keep line breaks & wrap hashtags
          expanded
            ? "" // full text
            : "line-clamp-1"
        )}
      >
        {text}
      </p>

      {/* Fade-out hint only when collapsed */}
      {!expanded && needsClamp && (
        <span
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-x-0 -bottom-0 h-6
            bg-gradient-to-t from-black/55 via-black/25 to-transparent
          "
        />
      )}
    </div>
  );
}

