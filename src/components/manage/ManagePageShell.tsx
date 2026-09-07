import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { PAGE_BG } from '@/components/manage/ui';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { FixedPageHeader } from '@/components/chrome/FixedPageHeader';

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
      <div
        className="min-h-screen flex flex-col w-full"
        style={{
          background: bg,
          marginTop: 'calc(-1 * var(--sat, env(safe-area-inset-top, 0px)))',
          maxWidth: '100%',
        }}
      >
        {/* The Discover band: fixed, pays its own safe-area inset, 42px control
            row, 1px A.BORDER edge. FixedPageHeader renders the reservation for
            its own MEASURED height immediately after itself, so nothing can
            render beneath it — on a cold launch or an in-app navigation. */}
        <FixedPageHeader
          title={title}
          onBack={handleBack}
          right={right}
          below={belowTitle}
        />

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

