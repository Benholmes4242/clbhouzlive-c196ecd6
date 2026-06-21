import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import {
  FONT,
  T50,
  T70,
  T100,
  BG_1,
  BG_2,
  LINE,
  LINE_2,
  
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

  const showAllButton = !showAll && filtered.length > INITIAL_LIMIT;

  return (
    <section ref={scrollAnchor} style={{ padding: '0 16px 32px' }}>
      <div
        style={{
          margin: '26px 2px 10px',
          color: T100,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          fontFamily: FONT,
        }}
      >
        Round-by-round
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
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
                        ? 'rgba(15,23,42,0.06)'
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

      {visible.length === 0 ? (
        <div
          style={{
            padding: '32px 8px',
            color: T50,
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
            background: BG_1,
            border: `0.5px solid ${LINE}`,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {visible.map((r, i) => (
            <RoundCard
              key={`${r.play_date}-${r.course_id}-${i}`}
              round={r}
              dim={dim}
              rivalFirstName={rivalFirstName}
              youLabel={youLabel}
              showDivider={i < visible.length - 1 || showAllButton}
            />
          ))}
          {showAllButton && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              style={{
                display: 'block',
                width: '100%',
                padding: '13px 0',
                background: 'transparent',
                border: 'none',
                color: T70,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              Show all {filtered.length} rounds
            </button>
          )}
        </div>
      )}
    </section>
  );
};

const Chip: React.FC<
  React.PropsWithChildren<{ active: boolean; onClick: () => void }>
> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '6px 12px',
      background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
      border: `1px solid ${active ? '#FFFFFF' : LINE_2}`,
      borderRadius: 999,
      color: active ? '#FFFFFF' : T70,
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
