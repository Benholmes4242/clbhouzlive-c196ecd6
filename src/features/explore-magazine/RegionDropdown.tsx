import { useMemo, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { A, SANS } from '@/components/explore-tab-new/courseled/tokens';

import type { PlaceChoice, PlaceNode } from './coursesSearch';

/**
 * THE REGION DROPDOWN (BRIEF_COURSES_MERGED §7).
 *
 * NOT A ROW OF PILLS. The trigger reads "Anywhere" until a place is chosen, then
 * the place with an X THAT CLEARS rather than reopening.
 *
 * THE PANEL IS GROUPED BY COUNTRY with the regions nested beneath, THE COUNTRY IS
 * SELECTABLE IN ITS OWN RIGHT, every row CARRIES ITS COUNT from the same index
 * the results come from, and the panel is SEARCHABLE because the real list is
 * long. ONLY PLACES WITH CONTENT APPEAR — the tree handed in is already filtered
 * to the candidate rule (see coursesSearch.placeTree).
 */
export function RegionDropdown({
  tree,
  choice,
  onChoose,
}: {
  tree: PlaceNode[];
  choice: PlaceChoice | null;
  onChoose: (next: PlaceChoice | null) => void;
}) {
  const { t } = useTranslation('courses');
  const [open, setOpen] = useState(false);
  const [find, setFind] = useState('');

  const filtered = useMemo(() => {
    const q = find.trim().toLowerCase();
    if (!q) return tree;
    return tree
      .map((node) => {
        const countryHit = node.country.toLowerCase().includes(q);
        const regions = countryHit ? node.regions : node.regions.filter((r) => r.region.toLowerCase().includes(q));
        return countryHit || regions.length > 0 ? { ...node, regions } : null;
      })
      .filter((node): node is PlaceNode => node !== null);
  }, [tree, find]);

  const label = choice ? choice.region ?? choice.country : t('amateur.courses.anywhere', 'Anywhere');

  return (
    <>
      <button
        type="button"
        onClick={() => (choice ? onChoose(null) : setOpen(true))}
        aria-label={choice ? t('amateur.courses.clearPlace', 'Clear place filter') : t('amateur.courses.choosePlace', 'Choose a place')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
          height: 32,
          padding: '0 12px',
          borderRadius: 999,
          border: `1px solid ${choice ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.16)'}`,
          background: choice ? 'rgba(255,255,255,0.10)' : 'transparent',
          color: A.INK,
          fontFamily: SANS,
          fontSize: 13,
          fontWeight: 700,
          maxWidth: 180,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{label}</span>
        {choice ? <X className="w-3 h-3 shrink-0" strokeWidth={2.5} /> : <ChevronDown className="w-3 h-3 shrink-0" strokeWidth={2.5} />}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} ariaLabelledBy="explore-place-title" maxHeight="85dvh">
        <div style={{ padding: '8px 20px 12px' }}>
          <div id="explore-place-title" style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, color: A.INK, letterSpacing: '-0.02em' }}>
            {t('amateur.courses.placeTitle', 'Browse by place')}
          </div>
        </div>
        <div style={{ padding: '0 20px 12px' }}>
          <div
            className="flex items-center gap-2 px-3 rounded-sq-sm"
            style={{ height: 44, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: A.MUTE }} />
            <input
              type="text"
              value={find}
              onChange={(event) => setFind(event.target.value)}
              placeholder={t('amateur.courses.findPlace', 'Find a country or region')}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[rgba(255,255,255,0.38)]"
              style={{ color: 'rgba(255,255,255,0.96)', fontFamily: SANS, minWidth: 0 }}
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        </div>

        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.10)', overflowY: 'auto' }}>
          <PlaceRow
            label={t('amateur.courses.anywhere', 'Anywhere')}
            count={null}
            active={choice === null}
            indent={false}
            onClick={() => {
              onChoose(null);
              setOpen(false);
            }}
          />
          {filtered.map((node) => (
            <div key={node.country}>
              <PlaceRow
                label={node.country}
                count={node.count}
                active={!!choice && choice.country === node.country && choice.region === null}
                indent={false}
                onClick={() => {
                  onChoose({ country: node.country, region: null });
                  setOpen(false);
                }}
              />
              {node.regions.map((region) => (
                <PlaceRow
                  key={`${node.country}:${region.region}`}
                  label={region.region}
                  count={region.count}
                  active={!!choice && choice.country === node.country && choice.region === region.region}
                  indent
                  onClick={() => {
                    onChoose({ country: node.country, region: region.region });
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          ))}
          {filtered.length === 0 ? (
            <div style={{ padding: '28px 20px', fontFamily: SANS, fontSize: 13, color: 'rgba(248,250,252,0.60)' }}>
              {t('amateur.courses.noPlaceMatch', 'Nothing matches {{query}}.', { query: find.trim() })}
            </div>
          ) : null}
        </div>
        <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 8px)' }} />
      </BottomSheet>
    </>
  );
}

function PlaceRow({
  label,
  count,
  active,
  indent,
  onClick,
}: {
  label: string;
  count: number | null;
  active: boolean;
  indent: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: indent ? '12px 20px 12px 34px' : '14px 20px',
        background: active ? 'rgba(247,147,30,0.10)' : 'transparent',
        border: 'none',
        borderLeft: active ? '3px solid #F7931E' : '3px solid transparent',
        borderBottom: '0.5px solid rgba(255,255,255,0.10)',
        textAlign: 'left',
        fontFamily: SANS,
      }}
    >
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: indent ? 14 : 15,
          fontWeight: active ? 700 : indent ? 500 : 700,
          color: A.INK,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      {count != null ? (
        <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: A.MUTE, fontVariantNumeric: 'tabular-nums' }}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

export default RegionDropdown;
