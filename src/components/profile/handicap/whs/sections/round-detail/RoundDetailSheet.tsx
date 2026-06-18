import React, { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { useRoundDetail } from '@/lib/whs/hooks';
import RoundScorecard from './RoundScorecard';
import {
  SheetHero,
  SheetHeroGlass,
  UserEyebrow,
  SheetFooterDark,
  SheetFooterInk,
  ScorecardEmpty,
} from './cinema-sheet';

interface Props {
  open: boolean;
  onClose: () => void;
  scoreId?: string | null;
  handicapDelta?: number | null;
  connectionId?: string | null;
  variant?: 'dark' | 'light';
}

const PAGE_BG = '#0A0E14';
const PAGE_BG_LIGHT = '#F8FAFC';
const INK_MUTE = 'var(--hcp-t-60)';
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const AMBER = '#F7931E';

const SheetSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div style={{ width: '100%', height: 280, background: 'var(--hcp-bg-3)' }} />
    <div style={{ padding: 14 }}>
      <div style={{ height: 150, background: 'var(--hcp-bg-2)', borderRadius: 8, marginBottom: 10 }} />
      <div style={{ height: 50, background: 'var(--hcp-bg-2)', borderRadius: 8 }} />
    </div>
  </div>
);

const SheetEmpty: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: FONT_GEIST }}>
    <p style={{ margin: '0 0 8px', fontSize: 14, color: INK_MUTE }}>No round to show yet.</p>
    <button
      onClick={onClose}
      style={{
        marginTop: 16,
        padding: '10px 20px',
        borderRadius: 999,
        background: AMBER,
        color: '#fff',
        border: 'none',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      Close
    </button>
  </div>
);

export const RoundDetailSheet: React.FC<Props> = ({
  open,
  onClose,
  scoreId,
  handicapDelta,
  variant = 'light',
}) => {
  const isLight = variant === 'light';
  const pageBg = isLight ? PAGE_BG_LIGHT : PAGE_BG;
  const userQuery = useRoundDetail(scoreId, open);
  const userData = userQuery.data;
  const userLoading = userQuery.isLoading;

  const parTotal = useMemo<number | null>(() => {
    const holes = userData?.holes;
    if (!holes || holes.length === 0) return null;
    let total = 0;
    let any = false;
    for (const h of holes) {
      if (h.par != null) {
        total += h.par;
        any = true;
      }
    }
    return any ? total : null;
  }, [userData]);

  const renderBody = (): { scroll: React.ReactNode; footer: React.ReactNode } => {
    if (userLoading) return { scroll: <SheetSkeleton />, footer: null };
    if (!userData) return { scroll: <SheetEmpty onClose={onClose} />, footer: null };

    const holes = userData.holes;
    const hasHoles = !!holes && holes.length > 0;
    const previousIndex =
      handicapDelta != null && userData.handicap_index_at_time != null
        ? userData.handicap_index_at_time - handicapDelta
        : null;

    return {
      scroll: (
        <>
          <SheetHero
            imageUrl={userData.course_header_image}
            onClose={onClose}
            topEyebrow={<UserEyebrow playDate={userData.play_date} />}
            glass={
              <SheetHeroGlass
                courseName={userData.course?.name ?? 'Unknown course'}
                par={parTotal}
                slope={userData.slope_rating}
                gross={userData.adjusted_gross}
                stableford={userData.stableford_points}
                differential={userData.handicap_differential}
                holes={hasHoles ? holes : null}
                isCounter={!!userData.is_counter}
                handicapDelta={handicapDelta ?? null}
              />
            }
          />

          {hasHoles ? (
            <RoundScorecard holes={holes!} isNineHole={userData.is_nine_hole} isLight={isLight} />
          ) : (
            <ScorecardEmpty
              message={
                userData.hole_by_hole_fetched
                  ? 'No hole-by-hole data for this round.'
                  : 'Hole data is still syncing'
              }
              subMessage={
                userData.hole_by_hole_fetched ? undefined : 'Check back in a few hours.'
              }
            />
          )}
        </>
      ),
      footer: isLight ? (
        <SheetFooterInk
          label={
            handicapDelta != null && Math.abs(handicapDelta) >= 0.05 && previousIndex != null
              ? 'Index after this round'
              : 'Current index'
          }
          currentIndex={userData.handicap_index_at_time ?? null}
          previousIndex={previousIndex}
          delta={handicapDelta ?? null}
          action={
            userData.permalink_url ? (
              <a
                href={userData.permalink_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '9px 16px',
                  borderRadius: 999,
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  textDecoration: 'none',
                  fontFamily: FONT_GEIST,
                  flexShrink: 0,
                }}
              >
                Open in MyEG
                <ExternalLink size={13} strokeWidth={2.4} />
              </a>
            ) : null
          }
        />
      ) : (
        <SheetFooterDark
          currentIndex={userData.handicap_index_at_time ?? null}
          previousIndex={previousIndex}
          delta={handicapDelta ?? null}
          myegHref={userData.permalink_url ?? null}
        />
      ),
    };
  };

  const titleText = userData?.course?.name ?? 'Round detail';
  const { scroll, footer } = renderBody();

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      shouldScaleBackground={false}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay
          className="fixed inset-0 z-[10001]"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        />
        <DrawerPrimitive.Content
          aria-labelledby="round-detail-sheet-title"
          className={`${isLight ? 'hcp-light' : 'hcp-dark'} fixed inset-x-0 bottom-0 z-[10002] flex flex-col rounded-t-[20px] outline-none`}
          style={{
            background: pageBg,
            height: '75dvh',
            minHeight: 0,
            overflow: 'hidden',
            boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.5)',
            fontFamily: FONT_GEIST,
          }}
        >
          <DrawerPrimitive.Title className="sr-only">{titleText}</DrawerPrimitive.Title>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              background: pageBg,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100%',
              }}
            >
              {scroll}
            </div>
          </div>

          {footer}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

export default RoundDetailSheet;
