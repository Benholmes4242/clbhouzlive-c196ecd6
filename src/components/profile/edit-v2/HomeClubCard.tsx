import { MapPin, Check, Search, Clock } from 'lucide-react';
import { VisibilityRow, type VisibilityValue } from './VisibilityDropdown';
import { FieldLabel } from '@/components/manage/fieldTreatment';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { openHomeClubPicker } from '@/features/home-club/homeClubPickerStore';

interface Props {
  clubName: string;
  clubId: string | null;
  visibility: string;
  onClubSelect: (name: string, id: string | null) => void;
  onVisibilityChange: (v: VisibilityValue) => void;
  /** Typed name awaiting an admin adding the club (§3.5). Read-only here. */
  pendingName?: string | null;
}

const INK = A.INK;
const GREEN = A.GREEN;

/**
 * BRIEF_HOME_CLUB_PICKER §2.1/§2.3 — the club field in the profile editor (and
 * therefore in onboarding, which is the same form) is now a door to the shared
 * picker sheet. There is no free-text club entry any more: a name that never
 * resolved to an id is exactly the state this brief exists to end.
 *
 * The picker hands the club back rather than writing it, so the club is saved
 * with the rest of the form.
 */
export function HomeClubCard({
  clubName, clubId, visibility,
  onClubSelect, onVisibilityChange, pendingName,
}: Props) {
  const open = () => openHomeClubPicker({
    onSelected: (club) => onClubSelect(club.name, club.id),
  });

  const header = (
    <div>
      <FieldLabel>Home club</FieldLabel>
      <VisibilityRow value={visibility as VisibilityValue} onChange={onVisibilityChange} />
    </div>
  );

  // CONFIRMED: a real club chosen from the picker, so an id exists.
  if (clubId) {
    return (
      <div className="space-y-3">
        {header}
        <div
          className="w-full flex items-center justify-between rounded-[14px] px-3.5 py-3 min-h-[48px]"
          style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${A.BORDER}` }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <MapPin size={16} className="shrink-0" style={{ color: INK }} />
            <span className="truncate text-[15px] font-medium" style={{ color: INK }}>
              {clubName}
            </span>
            <Check size={14} strokeWidth={2.5} style={{ color: GREEN, flexShrink: 0 }} />
          </div>
          <button
            type="button"
            onClick={open}
            className="text-[12px] font-semibold uppercase tracking-[0.08em] px-2 min-h-[44px] flex items-center"
            style={{ color: A.MUTE }}
            aria-label="Change home club"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  // PENDING: requested but not yet in the catalogue. Not a club, not invisible.
  if (pendingName) {
    return (
      <div className="space-y-3">
        {header}
        <div
          className="w-full rounded-[14px] px-3.5 py-3"
          style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${A.BORDER}` }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Clock size={15} className="shrink-0" style={{ color: A.AMBER }} />
              <span className="truncate text-[15px] font-medium" style={{ color: INK }}>
                {pendingName}
              </span>
            </div>
            <span
              className="text-[9.5px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-[6px] shrink-0"
              style={{ background: 'rgba(247,147,30,0.14)', color: A.AMBER }}
            >
              Pending
            </span>
          </div>
          <p className="text-[12.5px] mt-1.5" style={{ color: A.MUTE }}>
            We're adding this club — you'll be connected automatically.
          </p>
          <button
            type="button"
            onClick={open}
            className="text-[12px] font-semibold uppercase tracking-[0.08em] mt-1 min-h-[40px] flex items-center"
            style={{ color: A.MUTE }}
          >
            Pick a different club
          </button>
        </div>
      </div>
    );
  }

  // EMPTY
  return (
    <div className="space-y-3">
      {header}
      <button
        type="button"
        onClick={open}
        className="w-full flex items-center gap-2.5 rounded-[14px] px-3.5 min-h-[48px] text-left"
        style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${A.BORDER}` }}
      >
        <Search size={16} style={{ color: A.DIM }} />
        <span className="text-[15px]" style={{ color: A.MUTE }}>Search for your home club</span>
      </button>
    </div>
  );
}
