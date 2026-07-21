import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronRight, Check, X } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { FONT } from './gamingLightTokens';
import { PickemLeaderboardSheet } from './PickemLeaderboardSheet';

interface PickemRow {
  question_id: string;
  question_text: string;
  my_pick: 'yes' | 'no' | null;
  yes_count: number | null;
  no_count: number | null;
  locked: boolean | null;
  settled: boolean | null;
  outcome: 'yes' | 'no' | null;
  week_end: string | null;
  question_order?: number | null;
}

const INK = '#0F172A';
const MUTE = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const CARD_BG = '#FFFFFF';
const CARD_SHADOW = '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#B45309';
const AMBER_TINT_BG = 'rgba(247,147,30,0.10)';
const AMBER_FILL = '#F7931E';
const GREEN = '#16A34A';
const RED = '#DC2626';

function daysToSunday(weekEndIso?: string | null): number | null {
  if (weekEndIso) {
    const end = new Date(weekEndIso);
    if (!Number.isNaN(end.getTime())) {
      const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return Math.max(0, diff);
    }
  }
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  return day === 0 ? 0 : 7 - day;
}

interface Props {
  userId: string | undefined;
}

export function PickemCard({ userId }: Props) {
  const qc = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  // Optimistic overrides keyed by question_id
  const [optimistic, setOptimistic] = useState<Record<string, 'yes' | 'no' | null>>({});

  const { data } = useQuery({
    queryKey: ['discover', 'weekly-pickem', userId ?? 'anon'],
    enabled: !!userId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_weekly_pickem', {
        p_user_id: userId,
      });
      if (error) throw error;
      return (data ?? []) as PickemRow[];
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ questionId, pick }: { questionId: string; pick: 'yes' | 'no' }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('make_pickem_pick', {
        p_question_id: questionId,
        p_pick: pick,
      });
      if (error) throw error;
      return data as boolean;
    },
    onSuccess: (ok, vars) => {
      if (ok === false) {
        // Revert optimistic value
        setOptimistic((m) => {
          const next = { ...m };
          delete next[vars.questionId];
          return next;
        });
        toast.error("This week's picks are locked");
        qc.invalidateQueries({ queryKey: ['discover', 'weekly-pickem'] });
        return;
      }
      qc.invalidateQueries({ queryKey: ['discover', 'weekly-pickem'] });
    },
    onError: (_e, vars) => {
      setOptimistic((m) => {
        const next = { ...m };
        delete next[vars.questionId];
        return next;
      });
      toast.error('Could not save pick — try again');
    },
  });

  const rows = useMemo(() => {
    const list = (data ?? []).slice().sort((a, b) => {
      const oa = a.question_order ?? 0;
      const ob = b.question_order ?? 0;
      return oa - ob;
    });
    return list;
  }, [data]);

  if (!userId) return null;
  if (!rows || rows.length === 0) return null;

  const daysLeft = daysToSunday(rows[0]?.week_end ?? null);

  const handlePick = (row: PickemRow, pick: 'yes' | 'no') => {
    if (row.locked || row.settled) return;
    const current = optimistic[row.question_id] ?? row.my_pick;
    if (current === pick) return;
    setOptimistic((m) => ({ ...m, [row.question_id]: pick }));
    mutation.mutate({ questionId: row.question_id, pick });
  };

  return (
    <section style={{ padding: '0 16px', fontFamily: FONT }}>
      <div
        style={{
          background: CARD_BG,
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 16,
          boxShadow: CARD_SHADOW,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 14px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: `1px solid ${HAIRLINE}`,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: AMBER_DEEP,
                lineHeight: 1,
              }}
            >
              Pick'em
            </div>
            <div
              style={{
                marginTop: 5,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: INK,
                lineHeight: 1.15,
              }}
            >
              Call this week's golf
            </div>
          </div>
          {daysLeft != null ? (
            <div
              className="tabular-nums"
              style={{
                flexShrink: 0,
                background: AMBER_TINT_BG,
                color: AMBER_DEEP,
                padding: '5px 9px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}
            >
              {daysLeft === 0 ? 'Locks tonight' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`}
            </div>
          ) : null}
        </div>

        {/* Questions */}
        {rows.map((row, idx) => {
          const effectivePick = optimistic[row.question_id] ?? row.my_pick;
          return (
            <QuestionRow
              key={row.question_id}
              row={row}
              effectivePick={effectivePick}
              onPick={(p) => handlePick(row, p)}
              isLast={idx === rows.length - 1}
            />
          );
        })}

        {/* Standings link */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          style={{
            width: '100%',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            background: 'transparent',
            border: 'none',
            borderTop: `1px solid ${HAIRLINE}`,
            cursor: 'pointer',
            fontFamily: FONT,
            color: AMBER_DEEP,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <span>Standings</span>
          <ChevronRight size={16} />
        </button>
      </div>

      <PickemLeaderboardSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        userId={userId}
      />
    </section>
  );
}

function QuestionRow({
  row,
  effectivePick,
  onPick,
  isLast,
}: {
  row: PickemRow;
  effectivePick: 'yes' | 'no' | null;
  onPick: (pick: 'yes' | 'no') => void;
  isLast: boolean;
}) {
  const locked = !!row.locked || !!row.settled;
  const settled = !!row.settled;
  const hasPicked = !!effectivePick;

  const yesCount = row.yes_count ?? 0;
  const noCount = row.no_count ?? 0;
  const total = yesCount + noCount;
  const yesPct = total > 0 ? Math.round((yesCount / total) * 100) : 50;
  const noPct = 100 - yesPct;

  return (
    <div
      style={{
        padding: '12px 14px',
        borderBottom: isLast ? 'none' : `1px solid ${HAIRLINE}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: INK,
          lineHeight: 1.35,
          letterSpacing: '-0.005em',
        }}
      >
        {row.question_text}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <PickPill
          label="Yes"
          selected={effectivePick === 'yes'}
          locked={locked}
          outcome={settled ? row.outcome === 'yes' : null}
          onClick={() => onPick('yes')}
        />
        <PickPill
          label="No"
          selected={effectivePick === 'no'}
          locked={locked}
          outcome={settled ? row.outcome === 'no' : null}
          onClick={() => onPick('no')}
        />
      </div>

      {hasPicked && total > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              height: 4,
              borderRadius: 999,
              overflow: 'hidden',
              display: 'flex',
              background: 'rgba(15,23,42,0.06)',
            }}
          >
            <div
              style={{
                width: `${yesPct}%`,
                background: AMBER,
                transition: 'width 240ms ease',
              }}
            />
            <div
              style={{
                width: `${noPct}%`,
                background: 'rgba(15,23,42,0.35)',
                transition: 'width 240ms ease',
              }}
            />
          </div>
          <div
            className="tabular-nums"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: MUTE,
              textTransform: 'uppercase',
            }}
          >
            <span>Yes {yesPct}%</span>
            <span>No {noPct}%</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PickPill({
  label,
  selected,
  locked,
  outcome,
  onClick,
}: {
  label: string;
  selected: boolean;
  locked: boolean;
  outcome: boolean | null;
  onClick: () => void;
}) {
  const showTick = outcome === true;
  const showCross = outcome === false;

  const bg = selected ? AMBER_FILL : 'transparent';
  const border = selected ? AMBER_FILL : 'rgba(15,23,42,0.18)';
  const color = selected ? '#FFFFFF' : INK;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      style={{
        flex: 1,
        padding: '9px 12px',
        borderRadius: 10,
        background: bg,
        border: `1px solid ${border}`,
        color,
        fontFamily: FONT,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.02em',
        cursor: locked ? 'default' : 'pointer',
        opacity: locked && !selected ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        transition: 'background 160ms ease, color 160ms ease, border-color 160ms ease',
      }}
    >
      <span>{label}</span>
      {showTick ? <Check size={14} strokeWidth={2.6} color={GREEN} /> : null}
      {showCross ? <X size={14} strokeWidth={2.6} color={RED} /> : null}
    </button>
  );
}

export default PickemCard;
