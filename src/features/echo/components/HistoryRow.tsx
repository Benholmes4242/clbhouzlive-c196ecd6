import React from 'react';

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
  children?: React.ReactNode;
};

export function HistoryRow({ item, onToggle, trailing, children }: Props) {
  return (
    <>
      <div className="eh-row" onClick={onToggle} aria-expanded={!!children}>
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1 min-w-0">
            <div className="eh-title">{item.title}</div>
            {item.subtitle && <div className="eh-sub line-clamp-2">{item.subtitle}</div>}
            <div className="eh-meta">
              {item.has_response ? 'Has response' : 'No response'}
              {item.message_count != null ? ` · ${item.message_count} msgs` : ''}
              {item.relative_date ? ` · ${item.relative_date}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            {trailing}
          </div>
        </div>

        {children && <div className="eh-inline">{children}</div>}
      </div>
      
      <div className="eh-divider" />
    </>
  );
}
