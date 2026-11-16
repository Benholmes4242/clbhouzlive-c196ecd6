import { useTranslation } from 'react-i18next';

import type { StandoutRound } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';
import type { useRoundHoleShapes } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { SHELF_CARD, recentSentenceParts } from './roundsShelfRules';
import { RoundTileMarks } from './RoundTileMarks';
import { RoundTileFoot, RoundTileWho } from './RoundTileParts';
import './standout-shelf.css';

/**
 * ROUND CARD — the round tile once shared with Explore's retired Recent rounds
 * shelf; its one consumer is the course page's Lately here (CS1).
 */

/** CS1: the course page's own-round amber, name and edge only. */
export const OWN_ROUND_AMBER = '#F7931E';
export const OWN_ROUND_BORDER = 'rgba(247,147,30,0.35)';

/** The course page's Lately here card (CS1); never fork.
 * EXPLORE TILES A: the same markup and classes as the Standout round tile —
 * standout-card / standout-who / standout-story / standout-bottom / standout-foot.
 * The date lives only in the foot; the sentence is never clamped; the tile
 * grows (minHeight) so the rail stretches every tile to the tallest. */
export function RoundCard({
  round,
  shapes,
  locale,
  onOpenRound,
  onOpenMember,
  here = false,
  inCircle = false,
  own = false,
}: {
  round: StandoutRound;
  shapes: ReturnType<typeof useRoundHoleShapes>;
  locale: string;
  onOpenRound?: (scoreId: string, ownerUserId: string | null) => void;
  onOpenMember?: (userId: string) => void;
  /** CS1: on the course page — "here" sentences, CIRCLE-only second line. */
  here?: boolean;
  inCircle?: boolean;
  own?: boolean;
}) {
  const { t } = useTranslation('courses');
  const shape = round.whs_score_id ? shapes?.get(round.whs_score_id) ?? null : null;
  const sentence = recentSentenceParts(round, locale, here ? { here: true } : undefined);
  return (
    <div
      role="button"
      tabIndex={0}
      data-rounds-shelf-card="round"
      data-own-round={own ? 'true' : undefined}
      className="standout-card"
      onClick={() => {
        if (!round.whs_score_id) return;
        analyticsEvents.track('rounds_shelf_card_tapped', { kind: 'round' });
        onOpenRound?.(round.whs_score_id, round.user_id);
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (!round.whs_score_id) return;
        analyticsEvents.track('rounds_shelf_card_tapped', { kind: 'round' });
        onOpenRound?.(round.whs_score_id, round.user_id);
      }}
      style={{
        width: SHELF_CARD.width, minHeight: SHELF_CARD.minHeight,
        border: `1px solid ${own ? OWN_ROUND_BORDER : SHELF_CARD.border}`,
      }}
    >
      <RoundTileWho
        userId={round.user_id}
        name={round.display_name || t('discover.aMember', 'A member')}
        photo={round.profile_photo_url}
        course={round.course_name}
        onOpenMember={onOpenMember}
        nameColor={own ? OWN_ROUND_AMBER : undefined}
        circleOnly={here}
        inCircle={inCircle}
      />
      {sentence ? (
        <div className="standout-story">{t(sentence.key, { ...sentence, defaultValue: sentence.defaultValue })}</div>
      ) : null}
      <div className="standout-bottom">{shape ? <RoundTileMarks shape={shape} /> : null}</div>
      <RoundTileFoot round={round} locale={locale} />
    </div>
  );
}
