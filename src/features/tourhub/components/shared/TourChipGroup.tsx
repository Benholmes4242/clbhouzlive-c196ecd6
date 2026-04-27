/**
 * TourChipGroup — uppercase-normalized tour codes joined with " · ".
 *
 * Used in the player hero (below the country/age line) and in the player info
 * card "Tour" field. Returns null when codes is empty/null so consumers can
 * render the surrounding row conditionally.
 *
 * Casing rule: all codes are uppercased. PGAD renders literally as "PGAD"
 * (editorial label mapping deferred — see resume queue "Tour code label
 * mapping").
 */

interface TourChipGroupProps {
  codes: string[] | null | undefined;
  /** Override colour for the dark hero context vs. light info card. */
  color?: string;
  /** Override font size — defaults to 11px. */
  fontSize?: number;
}

export function TourChipGroup({
  codes,
  color = 'rgba(255,255,255,0.55)',
  fontSize = 11,
}: TourChipGroupProps) {
  if (!codes || codes.length === 0) return null;

  const normalized = codes
    .filter(Boolean)
    .map((c) => c.toUpperCase());

  if (normalized.length === 0) return null;

  return (
    <span
      style={{
        fontSize: `${fontSize}px`,
        fontWeight: 700,
        color,
        letterSpacing: '0.08em',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {normalized.join(' · ')}
    </span>
  );
}
