import { useTranslation } from 'react-i18next';
import { Section } from '@/features/explore-magazine/Section';
import { Button } from '@/components/ui/button';
import { A, COMPETITION, FIGS, SANS } from './tokens';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';
import { MemberAvatar } from './MemberAvatar';
import { windowOption, type BoardFilters } from './boardFilters';
import type { BoardRow } from './hooks/useBoardPage';
import { useStandoutRounds, type StandoutRound } from './hooks/useStandoutRounds';
import { playDateAtLocalNoon } from './discoverWhen';
import { standoutSentenceParts } from './standoutSentence';
import { fmtToPar } from './BoardRows';

/** SR1: no independent filter state, no independent round navigation. The host
 * passes its authoritative filters and the very same board-row callback.
 * Below-scope placement is Ben's ruling; cold/failed/empty reads reserve no space. */
export type RoundPressTarget = Pick<BoardRow, 'whs_score_id' | 'user_id'>;

function Figures({ row }: { row: StandoutRound }) {
  const { t } = useTranslation('courses');
  return (
    <span style={{ display: 'flex', flex: 'none', marginTop: 3, gap: 10 }}>
      {(['net', 'gross'] as const).map((kind) => {
        const score = kind === 'net' ? row.net_score : row.gross_score;
        const under = kind === 'net' && score != null && row.course_par != null && score < row.course_par;
        return <span key={kind} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 45 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: A.MUTE, lineHeight: '11px' }}>{t(`discover.filterBoard.col.${kind}`, { defaultValue: kind === 'net' ? 'NET' : 'GROSS' })}</span>
          <span className="tabular-nums" style={{ fontSize: 15, fontWeight: 700, lineHeight: '18px', color: under ? TOPAR_UNDER_DARK : kind === 'net' ? A.INK : A.MUTE }}>
            {score ?? '\u2014'}<span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.01em', marginLeft: 3, color: A.DIM, lineHeight: 1 }}>{score == null || row.course_par == null ? '' : fmtToPar(score - row.course_par)}</span>
          </span>
        </span>;
      })}
    </span>
  );
}

export function StandoutRounds({ viewerId, filters, enabled, onRowPress }: {
  viewerId: string | undefined;
  filters: BoardFilters;
  enabled: boolean;
  onRowPress: (row: RoundPressTarget) => void;
}) {
  const { t, i18n } = useTranslation('courses');
  const query = useStandoutRounds(viewerId, filters, enabled);
  if (!enabled || !query.isSuccess || !query.data?.length) return null;
  const win = windowOption(filters.window);
  return (
    <div data-standout-section style={{ ...FIGS }}>
    <Section
      contest
      eyebrow={t('amateur.standout.eyebrow', { defaultValue: 'In form' })}
      title={t('amateur.standout.title', { defaultValue: 'Standout rounds' })}
      meta={t(win.i18n, { defaultValue: win.label })}
    >
      <div>
        {query.data.map((row) => {
          const { key, ...options } = standoutSentenceParts(row, i18n?.language);
          const date = playDateAtLocalNoon(row.play_date);
          const dateText = date ? `${date.toLocaleDateString(i18n?.language, { month: 'short' })} ${date.getDate()}` : '';
          return <Button key={`${row.pos}:${row.whs_score_id ?? row.user_id}`} variant="ghost" data-standout-row onClick={() => onRowPress(row)}
            className="h-auto w-full rounded-none whitespace-normal text-left"
            style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 11, padding: '11px 0', border: 'none', borderBottom: `1px solid ${A.SOFT}`, background: 'transparent', fontFamily: SANS }}>
            <span style={{ display: 'flex', flex: 'none' }}><MemberAvatar userId={row.user_id} name={row.display_name} photoUrl={row.profile_photo_url} size={36} /></span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', lineHeight: '16px', minWidth: 0 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: A.INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{row.display_name ?? t('discover.aMember')}</span>
                {/* CB6.1 — a category, not a rare achievement, so a bare coloured word, never a pill (rule recorded in BoardRows.tsx). */}
                {row.is_competition === true ? <span data-standout-competition style={{ fontSize: 8.5, lineHeight: 1, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginLeft: 9, flexShrink: 0, whiteSpace: 'nowrap', color: COMPETITION }}>{t('discover.filterBoard.competitionChip', { defaultValue: 'Competition' })}</span> : null}
              </span>
              <span style={{ display: 'block', marginTop: 4, fontSize: 12, fontWeight: 600, color: A.BODY, lineHeight: 1.35 }}>{t(key, options)}</span>
              <span style={{ display: 'block', marginTop: 4, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: A.FAINT, lineHeight: 1.25 }}>{dateText}</span>
            </span>
            <Figures row={row} />
          </Button>;
        })}
      </div>
    </Section>
    </div>
  );
}