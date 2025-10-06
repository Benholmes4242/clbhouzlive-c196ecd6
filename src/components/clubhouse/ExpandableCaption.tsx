import { useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  text: string;
  className?: string;
};

export default function ExpandableCaption({ text, className }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const clampClass = expanded ? "line-clamp-none" : "line-clamp-1";

  return (
    <div
      role="button"
      aria-expanded={expanded}
      aria-label={expanded ? "Collapse caption" : "Expand caption"}
      onClick={() => setExpanded(v => !v)}
      className={cn(
        "relative text-white/95 leading-snug cursor-pointer pointer-events-auto",
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
      <p className={cn("whitespace-pre-line break-words", clampClass)}>
        {text}
      </p>

      {/* Fade-out hint only when collapsed */}
      {!expanded && (
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
