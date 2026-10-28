/**
 * TourIsland — the Tour hub's left island content (BRIEF_TOUR_ISLAND §1,
 * tour-island-signed-off.html). ONE control: the tour you are viewing plus
 * one line of context, opening TourGlance. Replaces TourIslandLeft's
 * burger + picker pair; Profile/Settings/Sign out live in the account tile.
 *
 * The glass capsule comes from ChromeIsland's LeftCapsule; this component
 * carries data-island-flush so the capsule adds no padding of its own and the
 * signed-off padding (0 16px 0 8px) is the whole story. Height 46 = ISLAND_H.
 *
 * Back mode: sub-pages that show a back chevron keep it as a separate leading
 * control in place of the chip, with the same behaviour; the label still
 * opens the tile.
 */
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { getTourLogo } from '../utils/tourLogos';
import { TourIcon, TourLiveDot } from './tourIslandIcons';
import { islandDescriptor, type IslandDescriptor } from './tourIslandRules';
import { useTourPickerRows } from '../hooks/useTourPickerRows';
import { useActiveMensMajor } from '../hooks/useActiveMensMajor';
import { useLiveTournaments } from '../hooks/useLiveTournaments';
import { useTourSelection } from '../context/TourSelectionContext';

const INK = '#F8FAFC';
const DIM = 'rgba(248,250,252,0.42)';
const GREEN = '#34D77F';

/**
 * What the island shows for the current tab and tour in view. Shared by the
 * ChromeIsland slot (TourHubChromeBridge) and the sub-tab header control, so
 * both surfaces of the same page never disagree.
 */
export function useTourIslandDescriptor(activeTab: string): IslandDescriptor {
  const { rows } = useTourPickerRows();
  const { selectedTourSlug, viewingTourSlug, appliedTourSlug } = useTourSelection();
  const activeMajor = useActiveMensMajor();
  const { data: liveTournaments } = useLiveTournaments();
  const liveRows = Array.isArray(liveTournaments)
    ? liveTournaments.filter((tt) => (tt.status || '').toLowerCase() === 'inprogress')
    : [];
  const liveRoundById = new Map(liveRows.map((tt) => [tt.id, tt.currentRound] as const));
  const activeTourSlug = appliedTourSlug ?? selectedTourSlug ?? viewingTourSlug ?? 'all';
  return islandDescriptor({
    activeTab,
    activeTourSlug,
    rows,
    liveCount: liveRows.length,
    major: activeMajor,
    liveRound: (id) => (id ? liveRoundById.get(id) ?? null : null),
  });
}

export interface TourIslandProps {
  label: string;
  /** Sentence case; rendered uppercase via textTransform. */
  caption: string;
  captionLive: boolean;
  /** Tour slug for the white logo chip; null when a glyph chip shows. */
  logoSlug?: string | null;
  glyph?: 'globe' | 'trophy' | null;
  mode?: 'menu' | 'back';
  onBackTap?: () => void;
  /** Opens TourGlance; receives the anchor element the tile aligns to. */
  onOpen: (anchor: HTMLElement) => void;
}

function Chip({ logoSlug, glyph }: { logoSlug?: string | null; glyph?: 'globe' | 'trophy' | null }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0, overflow: 'hidden',
        background: logoSlug ? '#FFFFFF' : 'rgba(255,255,255,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {logoSlug
        ? <img src={getTourLogo(logoSlug)} alt="" style={{ width: 25, height: 25, objectFit: 'contain' }} />
        : <TourIcon n={glyph ?? 'globe'} s={18.6} c={INK} w={1.7} />}
    </span>
  );
}

export const TourIsland: React.FC<TourIslandProps> = ({
  label,
  caption,
  captionLive,
  logoSlug,
  glyph,
  mode = 'menu',
  onBackTap,
  onOpen,
}) => {
  const labelAndCaption = (
    <>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: INK, whiteSpace: 'nowrap' }}>{label}</span>
        <TourIcon n="down" s={13} c={DIM} w={2.4} />
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
        {captionLive && <TourLiveDot s={5} />}
        <span
          data-testid="tour-island-caption"
          style={{
            fontSize: 8.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: captionLive ? GREEN : DIM, whiteSpace: 'nowrap',
          }}
        >
          {caption}
        </span>
      </span>
    </>
  );

  return (
    <div data-island-flush="true" style={{ display: 'flex', alignItems: 'center', gap: 10, height: 46 }}>
      {mode === 'back' && (
        <button
          type="button"
          aria-label="Back"
          onClick={onBackTap}
          className="active:scale-[0.94]"
          style={{
            background: 'none', border: 'none', padding: '0 0 0 8px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch',
          }}
        >
          <ChevronLeft size={17} color={INK} strokeWidth={2.2} />
        </button>
      )}
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`${label}, ${caption} — open tour menu`}
        onClick={(e) => onOpen(e.currentTarget)}
        className="active:scale-[0.98]"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'stretch',
          padding: mode === 'back' ? '0 16px 0 0' : '0 16px 0 8px',
          fontFamily: 'inherit',
        }}
      >
        {mode !== 'back' && <Chip logoSlug={logoSlug} glyph={glyph} />}
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, textAlign: 'left' }}>
          {labelAndCaption}
        </span>
      </button>
    </div>
  );
};

export default TourIsland;
