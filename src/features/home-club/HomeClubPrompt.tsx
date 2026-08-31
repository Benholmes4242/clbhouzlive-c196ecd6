import { useState } from 'react';
import { MapPinPlus, X, Clock } from 'lucide-react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { openHomeClubPicker } from './homeClubPickerStore';
import { useHomeClubStatus } from './useHomeClubStatus';

const DISMISS_KEY = 'homeClubPrompt.dismissed';

function dismissedThisSession() {
  try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
}

/**
 * BRIEF_HOME_CLUB_PICKER §2.2 — a dismissible prompt on the member's own
 * profile, shown only to members with NO club and NO outstanding request
 * (§2.4). Once dismissed it does not return in the same session.
 *
 * Where the club is PENDING (§3.5) this renders the pending treatment instead:
 * their answer is visible but visibly unconfirmed. A pending club never leaves
 * this surface — nothing else reads it (§3.6).
 */
export function HomeClubPrompt({ userId }: { userId: string | undefined }) {
  const status = useHomeClubStatus(userId);
  const [dismissed, setDismissed] = useState(dismissedThisSession);

  if (status.isLoading || status.state === 'set') return null;

  if (status.state === 'pending') {
    return (
      <div
        className="rounded-[14px] px-4 py-3.5"
        style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: A.MUTE }}
          >
            Home club
          </span>
          <span
            className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-[6px]"
            style={{ background: 'rgba(247,147,30,0.14)', color: A.AMBER }}
          >
            <Clock size={10} strokeWidth={2.5} /> Pending
          </span>
        </div>
        <p className="text-[15px] font-semibold mt-1" style={{ color: A.INK }}>
          {status.pendingName}
        </p>
        <p className="text-[12.5px] mt-1" style={{ color: A.MUTE }}>
          We're adding this club. You'll be connected to it automatically — nothing more to do.
        </p>
      </div>
    );
  }

  if (dismissed || status.hasOpenRequest) return null;

  return (
    <div
      className="rounded-[14px] px-4 py-3.5 relative"
      style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
    >
      <button
        type="button"
        onClick={() => {
          try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* non-fatal */ }
          setDismissed(true);
        }}
        className="absolute top-1 right-1 min-h-[40px] min-w-[40px] flex items-center justify-center"
        style={{ color: A.DIM }}
        aria-label="Dismiss home club prompt"
      >
        <X size={15} />
      </button>
      <div className="flex items-start gap-3 pr-8">
        <div
          className="shrink-0 flex items-center justify-center rounded-[11px]"
          style={{ width: 38, height: 38, background: 'rgba(247,147,30,0.12)' }}
        >
          <MapPinPlus size={19} color={A.AMBER} strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <p className="text-[14.5px] font-semibold" style={{ color: A.INK }}>
            Where do you play?
          </p>
          <p className="text-[12.5px] mt-0.5" style={{ color: A.MUTE }}>
            Add your home club so other members can find you.
          </p>
          <button
            type="button"
            onClick={() => openHomeClubPicker()}
            className="mt-2.5 h-10 px-3.5 rounded-[11px] text-[13.5px] font-semibold text-white"
            style={{ background: A.AMBER }}
          >
            Choose your club
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomeClubPrompt;
