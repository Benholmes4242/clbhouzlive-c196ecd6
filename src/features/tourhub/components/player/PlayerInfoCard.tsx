/**
 * PlayerInfoCard - Dispatch-style flat biographical grid.
 */

import { Link } from 'react-router-dom';
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
    <div style={{ paddingBottom: '10px', borderBottom: '0.5px solid rgba(15,23,42,0.06)' }}>
      <p style={{ fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '0 0 3px' }}>
        {label}
      </p>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{value}</div>
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
          className="text-primary font-medium active:opacity-70 transition-opacity"
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
    <div style={{ background: '#ffffff', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px', padding: '14px 16px 16px' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
        <span style={{ fontSize: '9px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          Player Info
        </span>
      </div>

      {personalFields.length > 0 && (
        <div>
          <p style={{ fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.14em', textTransform: 'uppercase' as const, margin: '0 0 10px' }}>
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
        <div style={{ height: '0.5px', background: 'rgba(15,23,42,0.07)', margin: '8px 0' }} />
      )}

      {careerFields.length > 0 && (
        <div>
          <p style={{ fontSize: '8.5px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.14em', textTransform: 'uppercase' as const, margin: '14px 0 10px' }}>
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
