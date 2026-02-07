/**
 * PlayerInfoCard - Personal + Golf Career info sidebar card
 */

import { Link } from 'react-router-dom';
import { Calendar, MapPin, Building, GraduationCap, Award, Ruler, Scale, User, Hand } from 'lucide-react';
import { Globe } from 'lucide-react';
import type { TourPlayer } from '../../hooks/useTourHubData';

function formatHeight(inches: string | number | null | undefined): string {
  if (!inches) return '—';
  const totalInches = typeof inches === 'string' ? parseInt(inches, 10) : inches;
  if (isNaN(totalInches)) return '—';
  const feet = Math.floor(totalInches / 12);
  const remainingInches = totalInches % 12;
  return `${feet}'${remainingInches}"`;
}

function formatWeight(weight: string | number | null | undefined): string {
  if (!weight) return '—';
  const weightNum = typeof weight === 'string' ? parseInt(weight, 10) : weight;
  if (isNaN(weightNum)) return '—';
  return `${weightNum} lbs`;
}

function formatHandedness(hand: string | null | undefined): string | null {
  if (!hand) return null;
  const h = hand.toUpperCase();
  if (h === 'R' || h === 'RIGHT') return 'Right-handed';
  if (h === 'L' || h === 'LEFT') return 'Left-handed';
  return hand;
}

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <div className="text-foreground text-sm">{value}</div>
      </div>
    </div>
  );
}

interface PlayerInfoCardProps {
  player: TourPlayer;
}

export function PlayerInfoCard({ player }: PlayerInfoCardProps) {
  const hasPersonal = !!(player.birth_date || player.birth_place || player.residence);
  const handedness = formatHandedness(player.handedness);
  const hasCareer = !!(player.college || player.turned_pro || player.height || player.weight || handedness);

  if (!hasPersonal && !hasCareer) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-sm font-semibold text-foreground mb-5 uppercase tracking-wide flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Player Info
        </h2>
        <p className="text-muted-foreground text-center py-4 text-sm">
          No additional info available.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h2 className="text-sm font-semibold text-foreground mb-5 uppercase tracking-wide flex items-center gap-2">
        <User className="w-4 h-4 text-primary" />
        Player Info
      </h2>

      <div className="space-y-5">
        {hasPersonal && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground/70 uppercase tracking-wide font-medium">Personal</p>

            {player.birth_date && (
              <InfoRow
                icon={Calendar}
                label="Birth Date"
                value={new Date(player.birth_date).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              />
            )}
            {player.birth_place && (
              <InfoRow icon={MapPin} label="Birth Place" value={player.birth_place} />
            )}
            {player.residence && (
              <InfoRow icon={Building} label="Residence" value={player.residence} />
            )}
          </div>
        )}

        {hasPersonal && hasCareer && (
          <div className="border-t border-border/30" />
        )}

        {hasCareer && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground/70 uppercase tracking-wide font-medium">Golf Career</p>

            {player.college && (
              <InfoRow
                icon={GraduationCap}
                label="College"
                value={
                  <Link
                    to="/tourhub?tab=college-golf"
                    className="text-primary hover:underline font-medium active:opacity-70 transition-opacity"
                  >
                    {player.college}
                  </Link>
                }
              />
            )}
            {player.turned_pro && (
              <InfoRow icon={Award} label="Turned Pro" value={String(player.turned_pro)} />
            )}
            {handedness && (
              <InfoRow icon={Hand} label="Handedness" value={handedness} />
            )}
            {player.height && (
              <InfoRow icon={Ruler} label="Height" value={formatHeight(player.height)} />
            )}
            {player.weight && (
              <InfoRow icon={Scale} label="Weight" value={formatWeight(player.weight)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
