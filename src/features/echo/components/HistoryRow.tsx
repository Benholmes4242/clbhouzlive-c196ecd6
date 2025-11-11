import React from 'react';
import { ui } from '@/tokens/ui';

type Props = {
  item: {
    id: string;
    title: string;
    subtitle?: string;
    has_response?: boolean;
    message_count?: number;
    relative_date?: string;
  };
  onToggle: () => void;
  trailing?: React.ReactNode;
  children?: React.ReactNode; // expanded inline
};

export function HistoryRow({ item, onToggle, trailing, children }: Props) {
  return (
    <article
      role="button"
      aria-expanded={!!children}
      onClick={onToggle}
      className="eh-card p-4 md:p-5"
      style={{ borderRadius: ui.radius.md }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold leading-[1.2]"
            style={{ fontSize: ui.font.title }}
          >
            {item.title}
          </h3>

          {item.subtitle && (
            <p
              className="mt-2 opacity-80 line-clamp-2"
              style={{ fontSize: ui.font.body, lineHeight: 1.35 }}
            >
              {item.subtitle}
            </p>
          )}

          <div
            className="mt-3 opacity-70"
            style={{ fontSize: ui.font.meta }}
          >
            {item.has_response ? 'Has response' : 'No response'} ·{' '}
            {item.message_count ?? 1} msgs · {item.relative_date ?? 'Today'}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {trailing}
        </div>
      </div>

      {/* Expanded inline transcript lives here */}
      {children}
    </article>
  );
}
