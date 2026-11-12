import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getInitialsFromName } from '@/lib/avatarFallback';
import { CompetitionTrophy } from '@/components/explore-tab-new/courseled/CompetitionMark';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import type { StandoutRound } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';
import { roundToPar, toParLabel } from './roundsShelfRules';
import { shortStandoutDate } from './standoutShelfRules';

/**
 * EXPLORE TILES A — the two pieces every round tile shares, owned once so
 * Recent rounds, Standout rounds and the course page's Lately rail cannot
 * drift: the Who header (avatar 34, wrapping name, one-line course) and the
 * round foot (NET / GROSS figures, COMP and the date bottom right).
 * Feat tiles use the Who header only; their rarity line stays in the shelf.
 */

export function RoundTileWho({
  userId,
  name,
  photo,
  course,
  onOpenMember,
  nameColor,
  circleOnly = false,
  inCircle = false,
}: {
  userId: string | null;
  name: string;
  photo: string | null;
  course: string | null;
  onOpenMember?: (id: string) => void;
  /** Own-round amber (CS1); undefined keeps the ink default. */
  nameColor?: string;
  /** Course page: the second line carries only the CIRCLE tag, never the course. */
  circleOnly?: boolean;
  inCircle?: boolean;
}) {
  const { t } = useTranslation('courses');
  const secondLine = circleOnly
    ? inCircle
      ? <span className="standout-course"><span data-round-card-circle className="standout-circle">{t('courseDetail.lately.circle', { defaultValue: 'CIRCLE' })}</span></span>
      : null
    : <span className="standout-course">{course ? shortCourseName(course) : ''}</span>;
  return (
    <Button
      variant="ghost"
      className="standout-who"
      aria-label={name}
      onClick={(event) => { event.stopPropagation(); if (userId) onOpenMember?.(userId); }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <SquircleAvatar size={34} src={photo} alt="" fallback={getInitialsFromName(name)} userId={userId ?? undefined} hairlineRing />
      <span className="standout-identity">
        <span data-round-card-name className="standout-name" style={nameColor ? { color: nameColor } : undefined}><InlineProMemberName userId={userId}>{name}</InlineProMemberName></span>
        {secondLine}
      </span>
    </Button>
  );
}

/** NET 20/800 (to-par red when under), GROSS 20/700 mute, COMP + date right. */
export function RoundTileFoot({ round, locale }: { round: StandoutRound; locale: string }) {
  const { t } = useTranslation('courses');
  const netToPar = roundToPar(round);
  const grossToPar = round.gross_score != null && round.course_par != null ? round.gross_score - round.course_par : null;
  const date = shortStandoutDate(round.play_date ?? null, locale);
  return (
    <div className="standout-foot">
      <div className="standout-figure tabular-nums" data-kind="net">
        <small>{t('discover.filterBoard.col.net', { defaultValue: 'NET' })}</small>
        <b>{round.net_score ?? '–'}</b>
        <i data-under={netToPar != null && netToPar < 0}>{toParLabel(netToPar)}</i>
      </div>
      <div className="standout-figure tabular-nums" data-kind="gross">
        <small>{t('discover.filterBoard.col.gross', { defaultValue: 'GROSS' })}</small>
        <b>{round.gross_score ?? '–'}</b>
        <i>{toParLabel(grossToPar)}</i>
      </div>
      <div className="standout-when">
        {round.is_competition ? (
          <span className="standout-comp"><CompetitionTrophy width={9} height={10} />{t('amateur.standoutShelf.comp', { defaultValue: 'COMP' })}</span>
        ) : null}
        {date}
      </div>
    </div>
  );
}
