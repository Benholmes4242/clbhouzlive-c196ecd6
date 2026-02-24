/**
 * PlayerInfoCard - Clean biographical grid.
 * Editorial layout on page background.
 */

import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import type { TourPlayer } from '../../hooks/useTourHubData';

function formatHeight(inches: string | number | null | undefined): string | null {
  if (!inches) return null;
  const totalInches = typeof inches === 'string' ? parseInt(inches, 10) : inches;
  if (isNaN(totalInches)) return null;
  const feet = Math.floor(totalInches / 12);
  const remainingInches = totalInches % 12;
  return `${feet}'${remainingInches}"`;
}

function formatWeight(weight: string | number | null | undefined): string | null {
  if (!weight) return null;
  const weightNum = typeof weight === 'string' ? parseInt(weight, 10) : weight;
  if (isNaN(weightNum)) return null;
  return `${weightNum} lbs`;
}

function formatHandedness(hand: string | null | undefined): string | null {
  if (!hand) return null;
  const h = hand.toUpperCase();
  if (h === 'R' || h === 'RIGHT') return 'Right-handed';
  if (h === 'L' || h === 'LEFT') return 'Left-handed';
  return hand;
}

function cleanBirthPlace(bp: string | null | undefined): string | null {
  if (!bp) return null;
  return bp.replace(/,,/g, ',').replace(/, ?$/, '').trim() || null;
}

interface InfoFieldProps {
  label: string;
  value: React.ReactNode;
}

function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div>
      <p className="text-muted-foreground/50" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</p>
      <div className="text-foreground" style={{ fontSize: '14px', fontWeight: 500, marginTop: '2px' }}>{value}</div>
    </div>
  );
}

interface PlayerInfoCardProps {
  player: TourPlayer;
}

export function PlayerInfoCard({ player }: PlayerInfoCardProps) {
  const birthPlace = cleanBirthPlace(player.birth_place);
  const handedness = formatHandedness(player.handedness);
  const height = formatHeight(player.height);
  const weight = formatWeight(player.weight);

  const personalFields: { label: string; value: React.ReactNode }[] = [];
  if (player.birth_date) {
    personalFields.push({
      label: 'Birth Date',
      value: new Date(player.birth_date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }),
    });
  }
  if (birthPlace) personalFields.push({ label: 'Birth Place', value: birthPlace });
  if (player.residence) personalFields.push({ label: 'Residence', value: player.residence });

  const careerFields: { label: string; value: React.ReactNode }[] = [];
  careerFields.push({
    label: 'Tour',
    value: (player as any).is_member ? 'PGA Tour' : 'Non-Member',
  });
  if (player.turned_pro) careerFields.push({ label: 'Turned Pro', value: String(player.turned_pro) });
  if (handedness) careerFields.push({ label: 'Handedness', value: handedness });
  if (height) careerFields.push({ label: 'Height', value: height });
  if (weight) careerFields.push({ label: 'Weight', value: weight });
  if (player.college) {
    careerFields.push({
      label: 'College',
      value: player.college_normalized ? (
        <Link
          to={`/tourhub/college-golf/${player.college_normalized}`}
          className="text-primary hover:underline font-medium active:opacity-70 transition-opacity"
        >
          {player.college}
        </Link>
      ) : player.college,
    });
  }

  if (personalFields.length === 0 && careerFields.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-6">
      {/* Section header — 22px / 700 / -0.3px */}
      {/* Section header — 11px / 700 / uppercase / muted */}
      <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
        <User className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-foreground" style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }}>
          Player Info
        </h2>
      </div>

      {personalFields.length > 0 && (
        <div>
          {/* Sub-section: PERSONAL — amber */}
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(245, 158, 11, 0.9)', marginBottom: '12px' }}>
            Personal
          </p>
          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
            {personalFields.map((f) => (
              <InfoField key={f.label} label={f.label} value={f.value} />
            ))}
          </div>
        </div>
      )}

      {personalFields.length > 0 && careerFields.length > 0 && (
        <div style={{ borderTop: '1px solid hsl(var(--border) / 0.15)', margin: '16px 0' }} />
      )}

      {careerFields.length > 0 && (
        <div>
          {/* Sub-section: GOLF CAREER — amber */}
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(245, 158, 11, 0.9)', marginBottom: '12px' }}>
            Golf Career
          </p>
          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
            {careerFields.map((f) => (
              <InfoField key={f.label} label={f.label} value={f.value} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
