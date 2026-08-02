import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  A,
  Action,
  FIGS,
  LABEL,
  Panel,
  SANS,
  TITLE,
} from '@/features/courses/components/holes/analytical/tokens';
import { formatMonthLongGB, formatMonthYearLongGB, formatNumber } from '@/i18n/format';
import { groupWireByMonth, type WireEvent } from '../hooks/useDiscoverWire';
import { WireRow } from './WireRow';

/**
 * TheWire — calendar-month panels over a 90-day horizon
 * (BRIEF_DISCOVER_REBUILD §1).
 *
 * Paging lives INSIDE each panel: four events, then an inline "Show n more"
 * that expands that month only and never collapses again. At roughly a dozen
 * events a month, infinite scroll was machinery for a problem that does not
 * exist — and it is what let eighty rows land in one panel.
 */

const INITIAL_PER_MONTH = 4;

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
  /** Any change resets expansion. */
  scopeKey: string;
  /** Rendered after the first month group. */
  newsSlot?: React.ReactNode;
  onRowPress: (event: WireEvent) => void;
  onMonthExpand?: (month: string, revealed: number) => void;
}

export function TheWire({ events, isLoading, scopeKey, newsSlot, onRowPress, onMonthExpand }: Props) {
  const { t } = useTranslation('courses');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // A month name alone for the current year; the year only when it is history.
  const labelFor = useCallback((year: number, monthIndex: number) => {
    const d = new Date(year, monthIndex, 1);
    return year === new Date().getFullYear() ? formatMonthLongGB(d) : formatMonthYearLongGB(d);
  }, []);

  const groups = useMemo(() => groupWireByMonth(events, labelFor), [events, labelFor]);

  const handleExpand = useCallback(
    (id: string, revealed: number) => {
      setExpanded((prev) => ({ ...prev, [id]: true }));
      onMonthExpand?.(id, revealed);
    },
    [onMonthExpand],
  );

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
      {groups.map((g, gi) => {
        const key = `${scopeKey}:${g.id}`;
        const isOpen = !!expanded[key];
        const visible = isOpen ? g.events : g.events.slice(0, INITIAL_PER_MONTH);
        const hidden = g.events.length - visible.length;
        return (
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
                <span style={TITLE}>{g.label}</span>
                <span style={LABEL}>
                  {t('discover.nFeats', {
                    defaultValue: '{{value}} feats',
                    count: g.events.length,
                    value: formatNumber(g.events.length),
                  })}
                </span>
              </header>
              {visible.map((e) => (
                <WireRow key={e.id} event={e} onPress={() => onRowPress(e)} />
              ))}
              {hidden > 0 && (
                <Action
                  label={t('discover.showNMore', {
                    defaultValue: 'Show {{value}} more',
                    count: hidden,
                    value: formatNumber(hidden),
                  })}
                  onClick={() => handleExpand(key, hidden)}
                  style={{ marginTop: 6 }}
                />
              )}
            </Panel>
            {gi === 0 && newsSlot}
          </div>
        );
      })}
    </div>
  );
}

export default TheWire;
