import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { PAGE_BG } from '@/components/manage/ui';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const SF_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface Props {
  title: string;
  children: React.ReactNode;
  /** Optional right-aligned slot (e.g. Save). */
  right?: React.ReactNode;
  /** Override the back behaviour. Defaults to navigate(-1). */
  onBack?: () => void;
  /** Renders inside the sticky header, below the title row. */
  belowTitle?: React.ReactNode;
  /** When true, the children wrapper becomes a flex column so a child with
   *  `flex-1` stretches to fill the viewport. Default false. */
  fill?: boolean;
  /**
   * DEPRECATED (BRIEF_SETTINGS_AND_MANAGE_DARK): the shell is dark-only now.
   * Kept so the existing `theme="dark"` callers still typecheck; ignored.
   */
  theme?: 'light' | 'dark';
}

/**
 * Direction A pushed sub-page shell used by /manage/* routes.
 * Sticky translucent header, 32px circle back chevron, 18/600 title,
 * 1px hairline bottom border, dark canvas background (A.CANVAS — matches the
 * notch shield exactly so there is no visible seam).
 *
 * Safe-area ownership: `.app-shell` globally pads `padding-top: var(--sat)`
 * on all non-immersive routes, so this header pays only an 8px comfort pad
 * on top of that. Do NOT snapshot safe-area here — it would double the
 * inset and open a visible gap under the notch on device.
 */
export function ManagePageShell({ title, children, right, onBack, belowTitle, fill = false }: Props) {
  const bg = PAGE_BG;
  const ink = A.INK;
  const rule = A.BORDER;
  const backBg = A.PANEL;
  const navigate = useNavigate();
  const handleBack = () => (onBack ? onBack() : navigate(-1));

  return (
    <PageRoot hasBottomNav={false} className="md:!max-w-[440px]" style={{ background: bg } as any}>
      <div className="min-h-screen flex flex-col w-full" style={{ background: bg }}>
        {/* Sticky sticks to the SCROLLPORT, not to .app-shell's safe-area
            padding — `top: 0` let the title row slide under the notch on
            scroll, where the safe-area shield painted over it. Pin at --sat. */}
        <div
          className="sticky z-30"
          style={{
            top: 'var(--sat, env(safe-area-inset-top, 0px))',
            background: bg,
            borderBottom: `1px solid ${rule}`,
          }}
        >

          <div
            className="flex items-center justify-between px-4"
            style={{ paddingTop: 8, paddingBottom: belowTitle ? 8 : 12, minHeight: 56 }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={handleBack}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: backBg, border: `1px solid ${rule}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, cursor: 'pointer',
                }}
                aria-label="Back"
              >
                <ChevronLeft size={18} strokeWidth={2.5} style={{ color: ink }} />
              </button>
              <h1
                style={{
                  fontFamily: SF_STACK, fontSize: 18, fontWeight: 600, color: ink,
                  letterSpacing: '-0.01em', margin: 0,
                }}
              >
                {title}
              </h1>
            </div>
            {right}
          </div>
          {belowTitle}
        </div>

        <div
          className={fill ? 'flex-1 pb-0 flex flex-col' : 'flex-1 pb-0'}
          style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 32px)' }}
        >
          {children}
        </div>
      </div>
    </PageRoot>
  );
}

export default ManagePageShell;

