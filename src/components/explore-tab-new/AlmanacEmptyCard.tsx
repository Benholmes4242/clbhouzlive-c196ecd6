import { useRegionFeats } from './hooks/useRegionFeats';
import { REGION_TABS } from './AlmanacSections';
import { FONT, DEEP_AMBER } from './gamingLightTokens';

interface Props {
  region: string | null;
}

function regionDisplay(slug: string | null): string {
  const label = REGION_TABS.find((t) => t.slug === slug)?.label ?? 'Region';
  return label;
}

/**
 * Editorial "no feats yet" card. Rendered ONLY when every tier
 * (legendary + records + eagles + birdie_hauls) for the active region
 * returns zero rows. Absence is not a stat, so this stays light and
 * quiet -- not a dark scoreboard.
 *
 * The four useRegionFeats calls are already cached by the visible rails,
 * so no additional network traffic is incurred.
 */
export function AlmanacEmptyCard({ region }: Props) {
  const legendary = useRegionFeats(region, 'legendary');
  const records = useRegionFeats(region, 'records');
  const eagles = useRegionFeats(region, 'eagles');
  const birdieHauls = useRegionFeats(region, 'birdie_hauls');

  const anyLoading =
    legendary.isLoading ||
    records.isLoading ||
    eagles.isLoading ||
    birdieHauls.isLoading;
  const anyPopulated =
    (legendary.data?.length ?? 0) > 0 ||
    (records.data?.length ?? 0) > 0 ||
    (eagles.data?.length ?? 0) > 0 ||
    (birdieHauls.data?.length ?? 0) > 0;

  if (anyLoading || anyPopulated) return null;

  const isWorldwide = region === null;
  const display = regionDisplay(region);
  const eyebrow = isWorldwide
    ? 'THE ALMANAC'
    : `THE ${display.toUpperCase()} ALMANAC`;
  const copy = isWorldwide
    ? 'No verified feats logged yet. The first record, eagle or albatross logged here opens this page.'
    : `No verified feats in ${display} yet. The first record, eagle or albatross logged here opens this page.`;

  return (
    <div
      style={{
        margin: '16px 16px 0',
        background: '#fff',
        border: '1px solid rgba(15,23,42,0.07)',
        borderRadius: 16,
        padding: '18px 16px',
        textAlign: 'left',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: DEEP_AMBER,
          lineHeight: 1,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 12.5,
          color: '#64748B',
          lineHeight: 1.55,
        }}
      >
        {copy}
      </div>
    </div>
  );
}

export default AlmanacEmptyCard;
