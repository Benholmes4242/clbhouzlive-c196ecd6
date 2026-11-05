/**
 * BRIEF 1 §5 — the Golf professional row under the Creator row. Four pill
 * states (Not requested / Being checked / Verified / Not verified); tapping
 * opens ProDetailsSheet except when verified. Status comes from
 * useMyProStatus; the sheet saves through the pro RPCs, not the editor's
 * profile partials.
 */
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { ProDetailsSheet } from '@/features/pro-verification/ProDetailsSheet';
import { ProStatusSheet } from '@/features/pro-verification/ProStatusSheet';
import { useMyProStatus } from '@/features/pro-verification/useMyProStatus';
import { proDeclineReasonText, proStatusLine } from '@/features/pro-verification/proRules';

export function EditProfilePro({ userId }: { userId: string }) {
  const pro = useMyProStatus(userId);
  const [sheetOpen, setSheetOpen] = useState(false);

  const pill = pro.verified ? 'Verified' : pro.pending ? 'Being checked' : pro.declined ? 'Not verified' : 'Not requested';
  const sub = pro.verified || pro.pending
    ? proStatusLine(pro.kind, pro.tour, pro.club)
    : pro.declined
      ? `${proDeclineReasonText(pro.reviewReason, pro.tour)} Tap to send it again.`
      : 'Tour player or PGA professional. A PRO label, no handicap needed.';

  return <>
    <div className="ep-rows" data-testid="ep-pro">
      <button type="button" className="ep-row" onClick={() => setSheetOpen(true)}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>Golf professional</span>
          <span style={{ display: 'block', marginTop: 3, fontSize: 12.5, color: 'var(--ep-mute)', lineHeight: 1.4 }}>{sub}</span>
        </span>
        <span className="ep-pro-pill" data-state={pill} style={{
          flex: 'none', height: 24, padding: '0 9px', borderRadius: 999,
          fontSize: 11.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center',
          border: `1px solid ${pro.verified ? 'rgba(52,211,153,0.5)' : 'var(--ep-hair)'}`,
          color: pro.verified ? '#34D399' : 'var(--ep-mute)', whiteSpace: 'nowrap',
        }}>{pill}</span>
        <ChevronRight size={18} className="ep-row-chev" />
      </button>
    </div>
    {pro.verified ? <ProStatusSheet userId={userId} open={sheetOpen} onClose={() => setSheetOpen(false)} /> : <ProDetailsSheet userId={userId} open={sheetOpen} onClose={() => setSheetOpen(false)} />}
  </>;
}
