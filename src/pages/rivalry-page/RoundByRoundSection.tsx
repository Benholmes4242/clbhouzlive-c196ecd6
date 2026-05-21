import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import {
  FONT,
  T60,
  T80,
  T100,
  BG_2,
  LINE,
  LINE_2,
  AMBER,
} from './_shared/tokens';
import { RoundCard } from './RoundCard';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import type { RivalryDimension } from '@/lib/whs/utils/useRivalryDimension';

const INITIAL_LIMIT = 20;

interface Props {
  row: FriendRivalryHydrated;
  dim: RivalryDimension;
  youLabel: string;
  rivalFirstName: string;
  courseFilter: string | null;
  setCourseFilter: (id: string | null) => void;
  scrollAnchor: React.RefObject<HTMLDivElement>;
}

export const RoundByRoundSection: React.FC<Props> = ({
  row,
  dim,
  youLabel,
  rivalFirstName,
  courseFilter,
  setCourseFilter,
  scrollAnchor,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const sorted = useMemo(
    () =>
      (row.shared_round_results ?? [])
        .slice()
        .sort((a, b) => b.play_date.localeCompare(a.play_date)),
    [row.shared_round_results],
  );

  const filtered = useMemo(
    () =>
      courseFilter
        ? sorted.filter((r) => r.course_id === courseFilter)
        : sorted,
    [sorted, courseFilter],
  );

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_LIMIT);
  const filterCourseName = courseFilter
    ? sorted.find((r) => r.course_id === courseFilter)?.course_name ?? null
    : null;

  const courseOpts = useMemo(() => {
    const m = new Map<string, string>();
    sorted.forEach((r) => m.set(r.course_id, r.course_name));
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }));
  }, [sorted]);

  return (
    <section ref={scrollAnchor} style={{ padding: '24px 16px 32px' }}>
      <SectionHeader label="Round-by-round" />

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <Chip
          active={courseFilter === null}
          onClick={() => {
            setCourseFilter(null);
            setDropdownOpen(false);
          }}
        >
          All {sorted.length}
        </Chip>
        <div style={{ position: 'relative' }}>
          <Chip
            active={courseFilter !== null}
            onClick={() => setDropdownOpen((o) => !o)}
          >
            {filterCourseName ?? 'By course'}
            {courseFilter !== null && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCourseFilter(null);
                }}
                aria-label="Clear filter"
                style={{
                  marginLeft: 6,
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <X size={12} strokeWidth={2.4} />
              </button>
            )}
          </Chip>
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                zIndex: 20,
                background: BG_2,
                border: `1px solid ${LINE_2}`,
                borderRadius: 10,
                padding: 6,
                minWidth: 220,
                maxHeight: 280,
                overflowY: 'auto',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              {courseOpts.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setCourseFilter(opt.id);
                    setDropdownOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    background:
                      courseFilter === opt.id
                        ? 'rgba(247,147,30,0.12)'
                        : 'transparent',
                    border: 'none',
                    color: T100,
                    fontSize: 13,
                    fontFamily: FONT,
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rows */}
      {visible.length === 0 ? (
        <div
          style={{
            padding: '32px 8px',
            color: T60,
            fontSize: 13,
            textAlign: 'center',
            fontFamily: FONT,
          }}
        >
          No shared rounds yet
        </div>
      ) : (
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {visible.map((r, i) => (
            <RoundCard
              key={`${r.play_date}-${r.course_id}-${i}`}
              round={r}
              dim={dim}
              rivalFirstName={rivalFirstName}
              youLabel={youLabel}
            />
          ))}
        </div>
      )}

      {!showAll && filtered.length > INITIAL_LIMIT && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          style={{
            marginTop: 16,
            width: '100%',
            padding: 12,
            background: 'transparent',
            border: `1px solid ${LINE_2}`,
            borderRadius: 10,
            color: T100,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          Show all {filtered.length} rounds
        </button>
      )}
    </section>
  );
};

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      color: T60,
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      borderTop: `0.5px solid ${LINE_2}`,
      paddingTop: 12,
      fontFamily: FONT,
    }}
  >
    {label}
  </div>
);

const Chip: React.FC<
  React.PropsWithChildren<{ active: boolean; onClick: () => void }>
> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '6px 12px',
      background: active ? 'rgba(247,147,30,0.14)' : 'transparent',
      border: `1px solid ${active ? AMBER : LINE_2}`,
      borderRadius: 999,
      color: active ? AMBER : T80,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.04em',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: FONT,
    }}
  >
    {children}
  </button>
);
