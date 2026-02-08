/**
 * PlayerInfoCard - Personal + Golf Career info sidebar card
 * Glass card, college deep-link with logo, tour membership,
 * 2-column grid on larger phones, birth place fix.
 */

import { Link } from 'react-router-dom';
import { Calendar, MapPin, Building, GraduationCap, Award, Ruler, Scale, User, Hand, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourPlayer } from '../../hooks/useTourHubData';

const GLASS_CARD_STYLE = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.5)',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
};

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

function cleanBirthPlace(bp: string | null | undefined): string | null {
  if (!bp) return null;
  return bp.replace(/,,/g, ',').replace(/, ?$/, '').trim();
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
      <div className="min-w-0">
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
  const birthPlace = cleanBirthPlace(player.birth_place);

  if (!hasPersonal && !hasCareer) {
    return (
      <div className="rounded-[20px] p-6" style={GLASS_CARD_STYLE}>
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
    <div className="rounded-[20px] p-6" style={GLASS_CARD_STYLE}>
      <h2 className="text-sm font-semibold text-foreground mb-5 uppercase tracking-wide flex items-center gap-2">
        <User className="w-4 h-4 text-primary" />
        Player Info
      </h2>

      <div className="space-y-5">
        {hasPersonal && (
          <div>
            <p className="text-xs text-muted-foreground/70 uppercase tracking-wide font-medium mb-3">Personal</p>
            <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-3">
              {player.birth_date && (
                <InfoRow
                  icon={Calendar}
                  label="Birth Date"
                  value={new Date(player.birth_date).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                />
              )}
              {birthPlace && (
                <InfoRow icon={MapPin} label="Birth Place" value={birthPlace} />
              )}
              {player.residence && (
                <InfoRow icon={Building} label="Residence" value={player.residence} />
              )}
            </div>
          </div>
        )}

        {hasPersonal && hasCareer && (
          <div className="border-t border-border/30" />
        )}

        {hasCareer && (
          <div>
            <p className="text-xs text-muted-foreground/70 uppercase tracking-wide font-medium mb-3">Golf Career</p>
            <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-3">
              {/* Tour Membership */}
              <InfoRow
                icon={Trophy}
                label="Tour"
                value={
                  (player as any).is_member
                    ? "PGA Tour Member"
                    : "Non-Member"
                }
              />

              {player.college && (
                <InfoRow
                  icon={GraduationCap}
                  label="College"
                  value={
                    player.college_normalized ? (
                      <Link
                        to={`/tourhub/college-golf/${player.college_normalized}`}
                        className="text-primary hover:underline font-medium active:opacity-70 transition-opacity"
                      >
                        {player.college}
                      </Link>
                    ) : (
                      <span>{player.college}</span>
                    )
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
          </div>
        )}
      </div>
    </div>
  );
}