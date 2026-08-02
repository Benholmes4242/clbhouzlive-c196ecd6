import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  A,
  FIGS,
  LABEL,
  Panel,
  SANS,
  TITLE,
} from '@/features/courses/components/holes/analytical/tokens';
import { groupWireEvents, type WireEvent, type WireGroupId } from '../hooks/useDiscoverWire';
import { WireRow } from './WireRow';

/**
 * TheWire — day-grouped panels, paginated in place.
 *
 * Ten events per page behind an IntersectionObserver sentinel, guarded on
 * `isPaging`, reset to page 1 on any scope change (or the list appends one
 * region's events under another region's headers). The sentinel unmounts when
 * the source is exhausted and a quiet end marker takes its place.
 */

const PAGE_SIZE = 10;

const GROUP_DEFAULTS: Record<WireGroupId, { key: string; en: string }> = {
  today: { key: 'discover.groupToday', en: 'Today' },
  thisWeek: { key: 'discover.groupThisWeek', en: 'This week' },
  earlier: { key: 'discover.groupEarlier', en: 'Earlier' },
};

/** Flat row placeholder. An empty state is a claim about the data; while a
 *  query is in flight the surface shows a skeleton instead. */
function WireSkeleton() {
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '34px 1fr', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 34, height: 34, borderRadius: '34%', background: A.TRACK }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ height: 11, width: '42%', borderRadius: 3, background: A.TRACK }} />
              <div style={{ height: 10, width: '62%', borderRadius: 3, background: A.TRACK }} />
              <div style={{ height: 9, width: '52%', borderRadius: 3, background: A.TRACK }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

interface Props {
  events: WireEvent[];
  isLoading: boolean;
  /** Any change resets pagination. */
  scopeKey: string;
  /** Rendered after the first day group. */
  newsSlot?: React.ReactNode;
  onRowPress: (event: WireEvent) => void;
  onLoadedChange?: (count: number) => void;
}

export function TheWire({ events, isLoading, scopeKey, newsSlot, onRowPress, onLoadedChange }: Props) {
  const { t } = useTranslation('courses');
  const [page, setPage] = useState(1);
  const isPaging = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Scope change resets to page 1.
  useEffect(() => {
    setPage(1);
  }, [scopeKey]);

  const visible = useMemo(() => events.slice(0, page * PAGE_SIZE), [events, page]);
  const exhausted = visible.length >= events.length;

  useEffect(() => {
    onLoadedChange?.(visible.length);
  }, [visible.length, onLoadedChange]);

  useEffect(() => {
    if (exhausted || isLoading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || isPaging.current) return;
        isPaging.current = true;
        setPage((p) => p + 1);
        window.setTimeout(() => {
          isPaging.current = false;
        }, 120);
      },
      { rootMargin: '320px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [exhausted, isLoading, visible.length]);

  const groups = useMemo(() => groupWireEvents(visible), [visible]);

  if (isLoading) return <WireSkeleton />;

  if (events.length === 0) {
    return (
      <Panel>
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ ...TITLE, fontSize: 15 }}>
            {t('discover.wire.emptyTitle', 'Nothing on the wire yet')}
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, lineHeight: 1.5, color: A.MUTE }}>
            {t(
              'discover.wire.emptyBody',
              'Records, crowns and rare cards appear here as official WHS rounds land.',
            )}
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: SANS, ...FIGS }}>
      {groups.map((g, gi) => (
        <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Panel>
            <header
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 12,
                marginBottom: 2,
              }}
            >
              <span style={TITLE}>{t(GROUP_DEFAULTS[g.id].key, GROUP_DEFAULTS[g.id].en)}</span>
              <span style={LABEL}>
                {t('discover.eventCount', {
                  defaultValue: '{{count}} events',
                  count: g.events.length,
                })}
              </span>
            </header>
            {g.events.map((e) => (
              <WireRow key={e.id} event={e} onPress={() => onRowPress(e)} />
            ))}
          </Panel>
          {gi === 0 && newsSlot}
        </div>
      ))}

      {exhausted ? (
        <div style={{ textAlign: 'center', padding: '6px 0 2px' }}>
          <span style={LABEL}>{t('discover.endOfWire', 'You are up to date')}</span>
        </div>
      ) : (
        <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />
      )}
    </div>
  );
}

export default TheWire;
