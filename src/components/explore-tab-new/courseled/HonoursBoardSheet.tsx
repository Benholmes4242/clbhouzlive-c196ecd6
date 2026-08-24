import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { formatYearNumeric } from '@/i18n/format';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { WireEvent } from '../hooks/useDiscoverWire';
import {
  HonoursHeading,
  HonoursModeToggle,
  LeaderHead,
  groupLeaders,
  sortHonours,
  useHoleDetail,
  useKindLabel,
  type HonoursLeader,
  type HonoursMode,
} from './HonoursBoard';
import { A, LABEL, NUMF, SANS } from './tokens';

/**
 * THE HONOURS BOARD, ALL TIME (BRIEF_HONOURS_BOARD_REBUILD part 2).
 *
 * THE RAIL IS THE SUMMARY, THE SHEET IS THE RECORD. It no longer re-renders the
 * rail in a taller box: it has a design of its own, on the app canvas, and
 * NOTHING in it is capped — it must never need its own "see all".
 *
 *   RECENT   groups by YEAR under a sticky header carrying the year and its
 *            feat count, because a history should read as a history and at
 *            fifty entries the eye needs somewhere to rest.
 *   LEADERS  gives each member the SAME PHOTO BAND as their rail card and lists
 *            EVERY feat beneath, uncapped — this is the surface the rail's
 *            "9 more" points at. A band is TAPPABLE TO COLLAPSE the member;
 *            all are expanded on open, or the sheet is doing the rail's job.
 *
 * ONE ROW SHAPE IN BOTH MODES, which is what keeps it scannable at volume.
 * Leaders drops the member and promotes the year to the left column, because
 * the member is already the header.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  events: WireEvent[];
  onRowPress?: (event: WireEvent) => void;
  /** Mode to open in. 'leaders' when the rail's "{{n}} more" was tapped. */
  initialMode?: HonoursMode;
  /** Member to scroll to on open (the leader whose "{{n}} more" was tapped). */
  focusUserId?: string | null;
}

const PANEL: React.CSSProperties = {
  background: A.PANEL,
  border: `1px solid ${A.BORDER}`,
  borderRadius: 14,
  overflow: 'hidden',
};

/* ─────────────────────────────── the row ─────────────────────────────── */

function HonoursRow({
  event: e,
  mode,
  onPress,
  divider,
}: {
  event: WireEvent;
  mode: HonoursMode;
  onPress?: (event: WireEvent) => void;
  divider: boolean;
}) {
  const { t } = useTranslation('courses');
  const holeDetail = useHoleDetail();
  const kindLabel = useKindLabel();
  const tappable = !!onPress && !!e.scoreId;
  const detail = holeDetail(e);

  return (
    <button
      type="button"
      disabled={!tappable}
      onClick={tappable ? () => onPress?.(e) : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        textAlign: 'left',
        border: 'none',
        borderTop: divider ? `1px solid ${A.BORDER}` : 'none',
        background: 'transparent',
        padding: '10px 12px',
        cursor: tappable ? 'pointer' : 'default',
        opacity: tappable ? 1 : 0.62,
        fontFamily: SANS,
      }}
    >
      {mode === 'recent' ? (
        <span style={{ flex: '0 0 auto', display: 'block' }}>
          <SquircleAvatar
            size={34}
            src={e.actorAvatar}
            alt={e.actorName}
            userId={e.userId}
            hairlineRing
          />
        </span>
      ) : (
        <span style={{ ...NUMF, fontSize: 12, color: A.MUTE, flex: '0 0 auto', width: 30 }}>
          {formatYearNumeric(e.at)}
        </span>
      )}

      <span style={{ minWidth: 0, flex: 1 }}>
        {mode === 'recent' ? (
          <span
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '-0.015em',
              color: e.isOwn ? A.AMBER_DEEP : A.INK,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {e.isOwn ? t('discover.wire.you', 'You') : e.actorName}
          </span>
        ) : null}
        <span
          style={{
            display: 'block',
            fontSize: mode === 'recent' ? 12.5 : 13,
            fontWeight: mode === 'recent' ? 600 : 700,
            letterSpacing: '-0.015em',
            color: mode === 'recent' ? A.BODY : A.INK,
            marginTop: mode === 'recent' ? 1 : 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {e.courseName ?? t('discover.unknownCourse', 'Course')}
        </span>
        {detail ? (
          <span
            style={{
              ...LABEL,
              fontSize: 8.5,
              color: A.MUTE,
              display: 'block',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {detail}
          </span>
        ) : null}
      </span>

      <span style={{ flex: '0 0 auto', textAlign: 'right' }}>
        <span style={{ ...LABEL, fontSize: 8.5, color: A.BODY, display: 'block' }}>
          {kindLabel(e)}
        </span>
        {mode === 'recent' ? (
          <span
            style={{ ...NUMF, fontSize: 11, color: A.MUTE, display: 'block', marginTop: 2 }}
          >
            {formatYearNumeric(e.at)}
          </span>
        ) : null}
      </span>

      <ChevronRight size={14} strokeWidth={2.5} color={A.DIM} style={{ flex: '0 0 auto' }} />
    </button>
  );
}

/* ─────────────────────────── leaders in the sheet ─────────────────────── */

function LeaderSection({
  leader: l,
  onRowPress,
  anchorRef,
}: {
  leader: HonoursLeader;
  onRowPress?: (event: WireEvent) => void;
  anchorRef?: (node: HTMLDivElement | null) => void;
}) {
  /* COLLAPSE IS GONE (CORRECTION_HONOURS_SHEET_TAP_TARGETS §2), overruling
     BRIEF_HONOURS_BOARD_REBUILD §2.6: every member is expanded, always, with no
     open state and no chevron. Tapping the photograph used to fold the record
     away, which is what Ben saw when he meant to open a scorecard.

     THE PHOTO'S JOB NOW DEPENDS ON THE RECORD (§1). One feat: the band opens
     that feat's scorecard, because there is only one thing the tap could mean.
     More than one: the band is INERT (§4/§5) — no press state, no cursor — since
     the photo is the most recent feat but the card is about all of them, and the
     rows are the only place that can say which round. */
  const single = l.events.length === 1 ? l.events[0] : null;
  const bandPress =
    single && onRowPress && single.scoreId ? () => onRowPress(single) : undefined;

  return (
    <div ref={anchorRef} style={{ ...PANEL, scrollMarginTop: 12 }}>
      <LeaderHead leader={l} />
      {l.events.map((e, i) => (
        <HonoursRow key={e.id} event={e} mode="leaders" onPress={onRowPress} divider={i > 0} />
      ))}
    </div>
  );
}

/* ─────────────────────────────── the sheet ───────────────────────────── */

export function HonoursBoardSheet({
  open,
  onClose,
  events,
  onRowPress,
  initialMode = 'recent',
  focusUserId = null,
}: Props) {
  const { t } = useTranslation('courses');
  const [mode, setMode] = useState<HonoursMode>(initialMode);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const anchors = useRef(new Map<string, HTMLDivElement>());

  const feats = useMemo(() => sortHonours(events), [events]);
  const leaders = useMemo(() => groupLeaders(events), [events]);

  /* The mode a caller asks for wins on every open, so the rail's "{{n}} more"
     always lands in leaders. */
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  /* Scrolling to a member needed nothing beyond an ANCHOR: the sections are all
     mounted (nothing is virtualised, nothing is collapsed on open), so the node
     exists as soon as the sheet paints and scrollIntoView can find it. */
  useLayoutEffect(() => {
    if (!open || mode !== 'leaders' || !focusUserId) return;
    const node = anchors.current.get(focusUserId);
    if (!node) return;
    const id = requestAnimationFrame(() =>
      node.scrollIntoView({ block: 'start', behavior: 'auto' }),
    );
    return () => cancelAnimationFrame(id);
  }, [open, mode, focusUserId, leaders]);

  /* RECENT groups by year, newest first — the list is already sorted DESC. */
  const years = useMemo(() => {
    const out: { year: string; events: WireEvent[] }[] = [];
    for (const e of feats) {
      const y = formatYearNumeric(e.at);
      const last = out[out.length - 1];
      if (last && last.year === y) last.events.push(e);
      else out.push({ year: y, events: [e] });
    }
    return out;
  }, [feats]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="courseled-honours-title"
      variant="light"
      surfaceColor={A.CANVAS}
      style={{
        height: 'auto',
        maxHeight: '85dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: SANS,
        background: A.CANVAS,
      }}
    >
      <div
        style={{
          padding: '10px 16px 12px',
          background: A.CANVAS,
          borderBottom: `1px solid ${A.BORDER}`,
        }}
      >
        <div id="courseled-honours-title">
          {/* §S4.1 — THE ONLY RECENT / LEADERS TOGGLE IN THE APP LIVES HERE. */}
          <HonoursHeading
            aside={<HonoursModeToggle mode={mode} onChange={setMode} />}
          />
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '0 14px' }}>
        {mode === 'recent' ? (
          years.map((y) => (
            <div key={y.year}>
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  background: A.CANVAS,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  padding: '14px 2px 8px',
                }}
              >
                <span
                  style={{
                    ...NUMF,
                    fontSize: 15,
                    color: A.INK,
                  }}
                >
                  {y.year}
                </span>
                <span
                  style={{
                    ...LABEL,
                    fontSize: 9,
                    color: A.MUTE,
                    marginLeft: 'auto',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  {t('discover.honours.featCountWith', {
                    count: y.events.length,
                    defaultValue: '{{count}} feats',
                    defaultValue_one: '{{count}} feat',
                  })}
                </span>
              </div>
              <div style={PANEL}>
                {y.events.map((e, i) => (
                  <HonoursRow
                    key={e.id}
                    event={e}
                    mode="recent"
                    onPress={onRowPress}
                    divider={i > 0}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 14 }}
          >
            {leaders.map((l) => (
              <LeaderSection
                key={l.key}
                leader={l}
                onRowPress={onRowPress}
                anchorRef={(node) => {
                  if (!l.userId) return;
                  if (node) anchors.current.set(l.userId, node);
                  else anchors.current.delete(l.userId);
                }}
              />
            ))}
          </div>
        )}
        <div aria-hidden style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default HonoursBoardSheet;
