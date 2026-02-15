/**
 * PlayerInfoCard - Clean biographical grid without icons.
 * No card container — editorial layout on page background.
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
      <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">{label}</p>
      <div className="text-sm font-medium text-foreground">{value}</div>
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

  // Build personal fields, skip empty
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

  // Build career fields, skip empty
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
    <div>
      <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4 flex items-center gap-2">
        <User className="w-4 h-4" />
        Player Info
      </h2>

      {personalFields.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60 mb-3">Personal</p>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8">
            {personalFields.map((f) => (
              <InfoField key={f.label} label={f.label} value={f.value} />
            ))}
          </div>
        </div>
      )}

      {personalFields.length > 0 && careerFields.length > 0 && (
        <div className="border-t border-border my-5" />
      )}

      {careerFields.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60 mb-3">Golf Career</p>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8">
            {careerFields.map((f) => (
              <InfoField key={f.label} label={f.label} value={f.value} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
