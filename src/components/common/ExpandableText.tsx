import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  lines?: number;
  className?: string;
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  lines = 4,
  className,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!text || text.trim().length === 0) return null;

  const shouldTruncate = text.length > 260;

  return (
    <div>
      <div className="relative">
        <p
          className={
            expanded
              ? `text-sm leading-relaxed text-slate-800 whitespace-pre-wrap ${className || ''}`
              : `text-sm leading-relaxed text-slate-800 whitespace-pre-wrap line-clamp-${lines} ${className || ''}`
          }
        >
          {text}
        </p>

        {!expanded && shouldTruncate && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>

      {shouldTruncate && (
        <button
          type="button"
          className="mt-1 text-xs font-semibold text-slate-700 flex items-center gap-1 hover:text-slate-900 transition-colors relative z-10"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : 'Read more'}
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  );
};
