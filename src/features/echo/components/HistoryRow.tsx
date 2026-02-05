import React from 'react';
import { Squircle } from '@/components/ui/squircle';
import { PiWaveform } from 'react-icons/pi';
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
      <div 
        className="eh-row transition-all duration-200 active:scale-[1.01]" 
        onClick={onToggle} 
        aria-expanded={!!children}
      >
        <div className="eh-row__avatar">
          <Squircle width={42} height={42}>
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--hub-glass-bg)',
                border: '1px solid var(--hub-stroke)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, var(--hub-glass-bg-elevated) 0%, var(--hub-glass-bg) 100%)',
                  opacity: 0.5,
                  pointerEvents: 'none'
                }}
              />
              <PiWaveform size={29} style={{ color: 'var(--hub-text-sub)', position: 'relative', zIndex: 1 }} />
            </div>
          </Squircle>
        </div>

        <div className="eh-row__content">
          <div className="eh-row-head">
            <h3 className="eh-row__title line-clamp-2" style={{ color: 'var(--hub-text)' }}>{item.title}</h3>
            <div className="eh-row__meta">
              {when && <time className="eh-row-when" style={{ color: 'var(--hub-text-sub)' }}>{when}</time>}
              <div className="eh-actions flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                {trailing}
              </div>
            </div>
          </div>
          {item.preview_snippet && (
            <div className="eh-row__preview line-clamp-2" style={{ color: 'var(--hub-text-sub)' }}>{item.preview_snippet}</div>
          )}
        </div>
      </div>

      {children && <div className="eh-thread">{children}</div>}
      
      {/* Neutral gray divider - no red */}
      <div className="eh-divider" style={{ backgroundColor: '#E5E5EA' }} />
    </>
  );
}
