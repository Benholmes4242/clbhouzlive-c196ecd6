/**
 * StoryPage — /tour/news/:slug. A single Wire story, deep-linkable and
 * shareable, and it MUST render for a guest: a share that hits a login wall is
 * worthless. Nothing on this page reads the viewing member.
 *
 * The live tournament card is the point of the page: a story about a leader,
 * sitting above the live board that shows him leading.
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useLogout } from '@/hooks/useLogout';
import { safeGoBack } from '@/utils/navigation';
import { useSetChromeLeftSlot } from '@/features/chrome-v2/leftOverride';
import { TourSideMenu } from '../components/TourSideMenu';

import { useMoreFromTheWire, useStoryTournament, useTourStory, type TourStory } from './useTourStories';
import { StoryRow } from './NewsTab';
import { StoryBody } from './StoryBody';
import { storyTime } from './storyTime';
import {
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  SLATE_50,
  SLATE_100,
  STATUS_LIVE,
} from '../_shared/tokens';

const TOUR_TAG: Record<string, string> = {
  pga: 'PGA TOUR',
  lpga: 'LPGA',
  euro: 'DP WORLD TOUR',
  pgad: 'KORN FERRY',
  champ: 'CHAMPIONS',
  liv: 'LIV GOLF',
};

const KICKER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
};

function toParText(n: number | null): string {
  if (n === null) return '';
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : `\u2212${Math.abs(n)}`;
}

function LiveTournamentCard({ tournamentId }: { tournamentId: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const { data } = useStoryTournament(tournamentId);
  if (!data) return null;

  const leader =
    data.leaderName && data.leaderToPar !== null
      ? data.leaderCount > 1
        ? `${data.leaderName} ${t('news.andCoLead', { defaultValue: '+{{count}}', count: data.leaderCount - 1 })} ${toParText(data.leaderToPar)}`
        : `${data.leaderName} ${toParText(data.leaderToPar)}`
      : null;

  return (
    <button
      type="button"
      onClick={() => navigate(`/tourhub/tournament/${data.id}`)}
      className="active:scale-[0.99]"
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
        marginTop: 22, padding: '14px 12px', cursor: 'pointer', fontFamily: FONT,
        background: 'rgba(255,255,255,0.05)', border: `1px solid ${HAIRLINE_INK_10}`, borderRadius: 14,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {data.isLive && (
            <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_LIVE, flexShrink: 0 }} />
          )}
          <span style={{ ...KICKER, color: data.isLive ? STATUS_LIVE : INK_FAINT }}>
            {data.isLive
              ? data.currentRound
                ? t('news.liveRound', { defaultValue: 'LIVE \u00b7 ROUND {{n}}', n: data.currentRound })
                : t('news.live', 'LIVE')
              : t('news.tournament', 'TOURNAMENT')}
          </span>
        </div>
        <div style={{ marginTop: 5, fontSize: 14.5, fontWeight: 700, color: INK, lineHeight: 1.25 }}>
          {data.name}
        </div>
        {leader && (
          <div style={{ marginTop: 3, fontSize: 12, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}>
            {leader}
          </div>
        )}
      </div>
      <ChevronRight size={16} color={INK_FAINT} strokeWidth={2.2} aria-hidden />
    </button>
  );
}

/**
 * StoryArticle — the story itself: lead image, headline, standfirst, the blocks
 * and the live tournament card. Extracted from the page so the ADMIN PREVIEW can
 * render the REAL article rather than an approximation of it. If the preview and
 * the live page could disagree, the preview would be worthless.
 *
 * Everything above it (the sticky masthead, the loading state, MORE FROM THE
 * WIRE) belongs to the page, not the article.
 */
export function StoryArticle({ story }: { story: TourStory }) {
  return (
    <>
      {story.image_url && (
        <div style={{ position: 'relative', height: 232, width: '100%', overflow: 'hidden', background: SLATE_100 }}>
          <img
            src={story.image_url}
            alt={story.headline}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.35) 100%)',
            }}
          />
          {story.kicker && (
            <div style={{ position: 'absolute', top: 12, left: 14, right: 14 }}>
              <span style={{ ...KICKER, color: '#FFFFFF' }}>{story.kicker}</span>
            </div>
          )}
          {story.image_credit && (
            <div style={{ position: 'absolute', bottom: 8, right: 14, fontSize: 9, color: 'rgba(255,255,255,0.72)' }}>
              {story.image_credit}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '16px 14px 0' }}>
        {!story.image_url && story.kicker && (
          <div style={{ ...KICKER, color: INK_FAINT, marginBottom: 8 }}>{story.kicker}</div>
        )}
        <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: INK, margin: 0 }}>
          {story.headline}
        </h1>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...KICKER, color: INK_FAINT }}>{storyTime(story.published_at)}</span>
          {story.tour_slug && TOUR_TAG[story.tour_slug] && (
            <>
              <span aria-hidden style={{ width: 3, height: 3, borderRadius: '50%', background: INK_FAINT }} />
              <span style={{ ...KICKER, color: INK_FAINT }}>{TOUR_TAG[story.tour_slug]}</span>
            </>
          )}
        </div>

        {story.standfirst && (
          <p style={{ marginTop: 14, fontSize: 15, fontWeight: 600, lineHeight: 1.45, color: INK, whiteSpace: 'pre-wrap' }}>
            {story.standfirst}
          </p>
        )}
        {story.body_blocks.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <StoryBody blocks={story.body_blocks} />
          </div>
        )}

        {story.tournament_id && <LiveTournamentCard tournamentId={story.tournament_id} />}
      </div>
    </>
  );
}

/**
 * StoryIslandLeft — the story page's left-capsule content: back to the wire,
 * then the tour burger. NO TOUR PICKER: a reader inside one article has nothing
 * to filter, and a tour label there would state something the page does not do.
 *
 * The burger only renders for a signed-in member — the drawer's tail is
 * Settings / Profile / Sign out, none of which mean anything to a guest on a
 * shared link. A guest gets the back arrow alone.
 */
function StoryChromeBridge() {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const { user } = useSupabaseSession();
  const { logout } = useLogout();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const back = React.useCallback(
    () => safeGoBack(navigate, '/tourhub?tab=news'),
    [navigate],
  );

  const slot = React.useMemo(
    () => (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, height: '100%' }}>
        <button
          type="button"
          aria-label={t('news.back', 'Back')}
          onClick={back}
          className="active:scale-[0.94]"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
        >
          <ChevronLeft size={17} color="#FFFFFF" strokeWidth={2.2} />
        </button>
        {user && (
          <>
            <span aria-hidden style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.18)', flexShrink: 0 }} />
            <button
              type="button"
              aria-label={t('picker.openMenuAria')}
              onClick={() => setMenuOpen(true)}
              className="active:scale-[0.94]"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
            >
              <Menu size={15} color="#FFFFFF" strokeWidth={2.2} />
            </button>
          </>
        )}
      </div>
    ),
    [back, t, user],
  );

  useSetChromeLeftSlot(slot);

  return (
    <TourSideMenu
      open={menuOpen}
      onClose={() => setMenuOpen(false)}
      activeTab="news"
      onSelectTab={(id) => { setMenuOpen(false); navigate(`/tourhub?tab=${id}`); }}
      onSettings={() => navigate('/edit-profile?tab=settings')}
      onProfile={() => navigate('/profile')}
      onSignOut={() => { void logout(); }}
    />
  );
}

export function StoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const { data: story, isLoading } = useTourStory(slug);
  const { data: more } = useMoreFromTheWire(story?.id);

  return (
    <div
      style={{
        background: SLATE_50,
        minHeight: '100dvh',
        fontFamily: FONT,
        /* The ChromeIsland owns the top of this page now (bleed:false), so the
           article starts clear of it — the island sits on the canvas, never on
           the photograph and never on the headline. */
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 27px)',
      }}
    >
      <StoryChromeBridge />


      {isLoading ? (
        <div style={{ padding: 14 }}>
          <Skeleton style={{ height: 232, width: '100%' }} />
          <Skeleton style={{ height: 22, width: '80%', marginTop: 14 }} />
          <Skeleton style={{ height: 90, width: '100%', marginTop: 12 }} />
        </div>
      ) : !story ? (
        <div style={{ padding: '18px 14px', fontSize: 13, color: INK_MUTE }}>
          {t('news.notFound', 'This story is no longer available.')}
        </div>
      ) : (
        <>
          <StoryArticle story={story} />

          {(more?.length ?? 0) > 0 && (
            <div style={{ marginTop: 28 }}>
              <div style={{ ...KICKER, color: INK, padding: '0 14px 6px', letterSpacing: '0.14em', fontSize: 11 }}>
                {t('news.more', 'MORE FROM THE WIRE')}
              </div>
              {(more ?? []).map((s, i) => (
                <div key={s.id} style={{ borderTop: `1px solid ${HAIRLINE_INK_10}` }}>
                  <StoryRow story={s} onOpen={() => navigate(`/tour/news/${s.slug}`)} />
                </div>
              ))}
            </div>
          )}
          <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }} />
        </>
      )}
    </div>
  );
}

export default StoryPage;
