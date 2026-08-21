import React from 'react';
import { getFlagCode, countryShortCode } from '@/utils/countryFlags';

interface CountryFlagProps {
  country: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-4 h-3',
  md: 'w-6 h-4',
  lg: 'w-9 h-6',
};

/** Chip text sizes, tuned to the largest that fits each flag rectangle. */
const chipTextPx: Record<'sm' | 'md' | 'lg', number> = {
  sm: 6,
  md: 7.5,
  lg: 9.5,
};

/**
 * Flag codes we deliberately do NOT render as a national flag.
 *
 * Empty by design. Every country the map resolves gets its flag, including all
 * four home nations (GB-ENG, GB-SCT, GB-WLS, GB-NIR) — there is no
 * Northern-Ireland-specific branch anywhere in the view layer.
 */
const WITHHELD_FLAG_CODES = new Set<string>();

/**
 * CountryFlag — the single flag system for the app (BRIEF_TOUR_FLAGS_ONE_SYSTEM).
 * Resolves an SVG flag when it can; otherwise draws a chip at exactly the flag
 * dimensions carrying the three-letter code. It never renders nothing when a
 * country string was supplied — silent absence reads as "no nationality"
 * rather than "no asset".
 */
const CountryFlag: React.FC<CountryFlagProps> = ({
  country,
  size = 'md',
  className = '',
}) => {
  const [failed, setFailed] = React.useState(false);
  const flagCode = getFlagCode(country);

  React.useEffect(() => { setFailed(false); }, [flagCode]);

  if (!country || !String(country).trim()) return null;

  const useChip = !flagCode || WITHHELD_FLAG_CODES.has(flagCode) || failed;

  if (useChip) {
    const short = countryShortCode(country);
    if (!short) return null;
    return (
      <span
        role="img"
        aria-label={String(country)}
        title={String(country)}
        className={`inline-flex items-center justify-center shrink-0 rounded-sm border border-border bg-muted text-muted-foreground ${sizeClasses[size]} ${className}`}
        style={{
          fontSize: chipTextPx[size],
          fontWeight: 700,
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}
      >
        {short}
      </span>
    );
  }

  return (
    <img
      src={`https://flagicons.lipis.dev/flags/4x3/${flagCode.toLowerCase()}.svg`}
      alt={`${country} flag`}
      loading="lazy"
      decoding="async"
      className={`inline-block shrink-0 ${sizeClasses[size]} ${className} rounded-sm object-cover`}
      title={String(country)}
      onError={() => setFailed(true)}
    />
  );
};

export default CountryFlag;
