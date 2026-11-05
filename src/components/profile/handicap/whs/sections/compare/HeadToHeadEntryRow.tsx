/**
 * HeadToHeadEntryRow - HH3 §1. The one "You and {First} · Compare ›" row on
 * ANOTHER member's profile, under the handicap chart and above Form · last
 * five. The whole row is one button: it emits compareBus (from 'profile') so
 * the page's single CompareMount opens the sheet in place (FIX_PROFILE_COMPARE_1).
 *
 * The caller decides eligibility (signed-in, non-guest viewer, their index
 * block shown). Photos come from useCompareIdentities; the count from
 * useSharedRounds (same cache key the sheet reads). No amber.
 */
import React from 'react';
import { getInitialsFromName, getAvatarFallbackGradient } from '@/lib/avatarFallback';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { useSharedRounds } from '@/lib/whs/hooks';
import { useCompareIdentities } from './useCompareIdentities';
import { compareBus } from './events';
import { entryLine, HH_INK } from './headToHeadRules';

interface Props {
  viewerUserId: string;
  memberUserId: string;
  memberFirstName: string;
  viewerIndex: number | null | undefined;
  memberIndex: number | null | undefined;
}

const Face: React.FC<{ id: string; name: string | null; src: string | null; overlap?: boolean }> = ({ id, name, src, overlap }) => (
  <span
    data-hh-entry-face={id}
    style={{
      width: 30, height: 32, borderRadius: '34%', border: `2px solid ${A.CANVAS}`, marginLeft: overlap ? -8 : 0,
      overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: src ? 'rgba(255,255,255,0.06)' : getAvatarFallbackGradient(id), color: HH_INK, fontSize: 11, fontWeight: 700,
      boxSizing: 'border-box',
    }}
  >
    {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name ? getInitialsFromName(name) : null}
  </span>
);

export const HeadToHeadEntryRow: React.FC<Props> = ({ viewerUserId, memberUserId, memberFirstName, viewerIndex, memberIndex }) => {
  const { data: ids } = useCompareIdentities([viewerUserId, memberUserId]);
  const { data: shared } = useSharedRounds(viewerUserId, memberUserId);
  const n = shared?.shared_rounds_count ?? 0;
  const me = ids?.[viewerUserId];
  const them = ids?.[memberUserId];
  return (
    <button
      type="button"
      data-hh-entry
      onClick={() => compareBus.emit({ targetUserId: memberUserId, from: 'profile' })}
      style={{
        marginTop: 16, padding: '12px 14px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.14)',
        background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: HH_INK,
      }}
    >
      <span style={{ display: 'flex', flexShrink: 0 }}>
        <Face id={viewerUserId} name={me?.name ?? null} src={me?.avatarUrl ?? null} />
        <Face id={memberUserId} name={them?.name ?? null} src={them?.avatarUrl ?? null} overlap />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: 'block', fontSize: 14.5, fontWeight: 700 }}>You and {memberFirstName}</b>
        <span data-hh-entry-line style={{ display: 'block', fontSize: 12, color: 'rgba(248,250,252,0.55)', marginTop: 2, overflowWrap: 'anywhere' }}>
          {entryLine(n, viewerIndex, memberIndex)}
        </span>
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: HH_INK, whiteSpace: 'nowrap', flexShrink: 0 }}>Compare {'\u203A'}</span>
    </button>
  );
};

export default HeadToHeadEntryRow;
