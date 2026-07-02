import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';

const GEIST = 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const SLATE_BG = '#F4F6F8';

interface Props {
  title: string;
  children: React.ReactNode;
  /** Optional right-aligned slot (e.g. Save). */
  right?: React.ReactNode;
  /** Override the back behaviour. Defaults to navigate(-1). */
  onBack?: () => void;
  /** Renders inside the sticky header, below the title row. */
  belowTitle?: React.ReactNode;
}

/**
 * Direction A pushed sub-page shell used by /manage/* routes.
 * Sticky translucent header, 32px circle back chevron, 18/600 title,
 * 1px hairline bottom border, slate background.
 */
export function ManagePageShell({ title, children, right, onBack, belowTitle }: Props) {
  const navigate = useNavigate();
  const handleBack = () => (onBack ? onBack() : navigate(-1));

  return (
    <PageRoot hasBottomNav={false} className="md:!max-w-[440px]" style={{ background: SLATE_BG } as any}>
      <div className="min-h-screen flex flex-col w-full" style={{ background: SLATE_BG }}>
        <div
          className="sticky top-0 z-30"
          style={{
            background: SLATE_BG,
            borderBottom: '1px solid rgba(15,23,42,0.08)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 pb-3"
            style={{ paddingTop: 'max(var(--safe-top, env(safe-area-inset-top, 0px)), 8px)', minHeight: 56 }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={handleBack}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#fff', border: '1px solid rgba(15,23,42,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, cursor: 'pointer',
                }}
                aria-label="Back"
              >
                <ChevronLeft size={18} strokeWidth={2.5} style={{ color: INK }} />
              </button>
              <h1
                style={{
                  fontFamily: GEIST, fontSize: 18, fontWeight: 600, color: INK,
                  letterSpacing: '-0.01em', margin: 0,
                }}
              >
                {title}
              </h1>
            </div>
            {right}
          </div>
        </div>

        <div className="flex-1 pb-32">
          {children}
        </div>
      </div>
    </PageRoot>
  );
}

export default ManagePageShell;
