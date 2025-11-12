import React from 'react';
import EchoAvatar from '@/components/ai-chat/EchoAvatar';
import { formatSmartWhen } from '@/utils/date';

type Props = {
  item: {
    id: string;
    title: string;
    subtitle?: string;
    preview_snippet?: string;
    has_response?: boolean;
    message_count?: number;
    relative_date?: string;
    created_at?: string;
  };
  onToggle: () => void;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
};

export function HistoryRow({ item, onToggle, trailing, children }: Props) {
  const when = formatSmartWhen(item.created_at);
  
  return (
    <>
      <div className="eh-row" onClick={onToggle} aria-expanded={!!children}>
        <div className="eh-row__avatar">
          <EchoAvatar state="idle" size={36} />
        </div>

        <div className="eh-row__content">
          <div className="eh-row-head">
            <h3 className="eh-row__title">{item.title}</h3>
            <div className="eh-row__meta">
              {when && <time className="eh-row-when">{when}</time>}
              <div className="eh-actions flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                {trailing}
              </div>
            </div>
          </div>
          {item.preview_snippet && (
            <div className="eh-row__preview">{item.preview_snippet}</div>
          )}
        </div>
      </div>

      {children && <div className="eh-thread">{children}</div>}
      
      <div className="eh-divider" />
    </>
  );
}
