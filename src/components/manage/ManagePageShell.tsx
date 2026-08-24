import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { PAGE_BG } from '@/components/manage/ui';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const SF_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const SLATE_BG = PAGE_BG;

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
   * BRIEF_ACTIVITY_PAGE_DARK: the shell paints the page ground, the sticky
   * header and the back chevron, so converting only a page's body leaves a
   * light bar above a dark page. This is OPT-IN and defaults to 'light' — the
   * other 24 /manage/* consumers are untouched.
   */
  theme?: 'light' | 'dark';
}

/**
 * Direction A pushed sub-page shell used by /manage/* routes.
 * Sticky translucent header, 32px circle back chevron, 18/600 title,
 * 1px hairline bottom border, slate background (#F8FAFC — matches the
 * notch shield exactly so there is no visible seam).
 *
 * Safe-area ownership: `.app-shell` globally pads `padding-top: var(--sat)`
 * on all non-immersive routes, so this header pays only an 8px comfort pad
 * on top of that. Do NOT snapshot safe-area here — it would double the
 * inset and open a visible gap under the notch on device.
 */
export function ManagePageShell({ title, children, right, onBack, belowTitle, fill = false, theme = 'light' }: Props) {
  const dark = theme === 'dark';
  const bg = dark ? A.CANVAS : SLATE_BG;
  const ink = dark ? A.INK : INK;
  const rule = dark ? A.BORDER : 'rgba(15,23,42,0.08)';
  const backBg = dark ? A.PANEL : '#fff';
  const navigate = useNavigate();
  const handleBack = () => (onBack ? onBack() : navigate(-1));

  return (
    <PageRoot hasBottomNav={false} className="md:!max-w-[440px]" style={{ background: bg } as any}>
      <div className="min-h-screen flex flex-col w-full" style={{ background: bg }}>
        <div
          className="sticky top-0 z-30"
          style={{
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

