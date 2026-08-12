/**
 * AboutSection - 2-col grid of biographical facts.
 *
 * Per-field null discipline; whole section hides when < 2 fields exist.
 * BORN is deliberately absent: it and AGE are the same fact off the same
 * birth_date field, so only AGE is stated. Cell rules are gone - the grid
 * separates with rowGap, not a ladder of hairlines.
 * The college link renders in INK per the app-wide action ink flip (an
 * underline under a proper noun reads as a spelling error).
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TourPlayer } from '../../hooks/useTourHubData';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { INK, INK_FAINT, SURFACE } from '../../_shared/tokens';

interface AboutSectionProps {
  player: TourPlayer;
}

function fmtHeight(inches: string | number | null | undefined): string | null {
  if (!inches) return null;
  const n = typeof inches === 'string' ? parseInt(inches, 10) : inches;
  if (isNaN(n)) return null;
  return `${Math.floor(n / 12)}'${n % 12}"`;
}

function ageOf(iso: string | null): number | null {
  if (!iso) return null;
  const yrs = Math.floor((Date.now() - new Date(iso).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return isNaN(yrs) ? null : yrs;
}

interface Field {
  label: string;
  value: React.ReactNode;
}

export function AboutSection({ player }: AboutSectionProps) {
  const { t } = useTranslation('tourhub');
  const fields: Field[] = [];

  const age = ageOf(player.birth_date);
  if (age !== null) fields.push({ label: t('player.about.field.age'), value: String(age) });
  if (player.turned_pro) fields.push({ label: t('player.about.field.turnedPro'), value: String(player.turned_pro) });
  const height = fmtHeight(player.height);
  if (height) fields.push({ label: t('player.about.field.height'), value: height });
  if (player.college) {
    fields.push({
      label: t('player.about.field.college'),
      value: player.college_normalized ? (
        <Link
          to={`/tourhub/college-golf/${player.college_normalized}`}
          onClick={() => {
            void analyticsEvents.track('tour_player_college_tapped', {
              player_id: player.id,
              college_slug: player.college_normalized,
            });
          }}
          style={{ color: INK, textDecoration: 'none' }}
          className="active:opacity-60 transition-opacity"
        >
          {player.college}
        </Link>
      ) : (
        player.college
      ),
    });
  }
  if (player.residence) fields.push({ label: t('player.about.field.residence'), value: player.residence });

  if (fields.length < 2) return null;

  return (
    <section style={{ background: SURFACE, padding: '16px 16px 18px' }}>
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 10,
          fontWeight: 700,
          color: INK,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        {t('player.about.eyebrow')}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 20, rowGap: 16 }}>
        {fields.map((f) => (
          <div key={f.label} style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: INK_FAINT,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {f.label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: INK, letterSpacing: '-0.005em' }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
