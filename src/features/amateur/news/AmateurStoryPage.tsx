/**
 * Amateur News — one story (/discover/news/:slug).
 *
 * The REAL `StoryArticle` from the wire renders it. The only difference between
 * an amateur story and a tour story on the page is the tag beside the timestamp:
 * amateur golf has no tour to name, so the categories and the free-text event
 * name go there instead.
 *
 * It MUST render for a guest, and nothing here reads the viewing member.
 * NO PAGE-LEVEL BACK BUTTON and NO SIDE MENU — the chrome island's back slot is
 * the whole navigation, because there is no amateur hub to drawer into.
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

import { StoryArticle } from '@/features/tourhub/news/StoryPage';
import { NewsChromeBridge } from '@/features/tourhub/news/NewsChromeBridge';
import { StoryRow } from '@/features/tourhub/news/NewsTab';
import { StoryEngagementBlock } from '@/features/stories/StoryEngagementBlock';
import { useStoryEngagement } from '@/features/stories/useStoryEngagement';
import { FONT, HAIRLINE_INK_10, INK, INK_MUTE, SLATE_50 } from '@/features/tourhub/_shared/tokens';

import { categoriesLine } from './categories';
import { useAmateurStory, useMoreAmateurNews, type AmateurStory } from './useAmateurStories';

const KICKER: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
};

/**
 * The tag beside the timestamp: the category line and the event, joined. Either
 * half may be missing; when both are, there is no tag and StoryArticle renders
 * nothing there. Exported because the admin preview must show the same string.
 */
export function amateurTag(
  story: Pick<AmateurStory, 'categories' | 'tournament_name' | 'kicker'>,
  resolve?: (value: string, fallback: string) => string,
): string | null {
  const cats = categoriesLine(story.categories, resolve);
  const event = (story.tournament_name ?? '').trim().toUpperCase() || null;
  const kicker = (story.kicker ?? '').trim().toUpperCase() || null;
  const eventDeduped = event && event === kicker ? null : event;
  const parts = [cats, eventDeduped].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(' \u00b7 ') : null;
}

export function AmateurStoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('courses');
  const { data: story, isPending } = useAmateurStory(slug);
  const { data: more } = useMoreAmateurNews(story?.id);

  /* ONE read for the MORE AMATEUR NEWS window. */
  const { engagementFor } = useStoryEngagement(
    'amateur_story',
    React.useMemo(() => (more ?? []).map((s) => s.id), [more]),
  );

  const label = (value: string, fallback: string) => t(`amateurNews.categories.${value}`, fallback);

  return (
    <div style={{ background: SLATE_50, minHeight: '100dvh', fontFamily: FONT }}>
      <NewsChromeBridge label="Amateur News" mode="back" backFallback="/discover/news" />
      {isPending ? (
        <div style={{ padding: 14 }}>
          <Skeleton style={{ height: 232, width: '100%' }} />
          <Skeleton style={{ height: 22, width: '80%', marginTop: 14 }} />
          <Skeleton style={{ height: 90, width: '100%', marginTop: 12 }} />
        </div>
      ) : !story ? (
        <div style={{ padding: '18px 14px', fontSize: 13, color: INK_MUTE }}>
          {t('amateurNews.notFound', 'This story is no longer available.')}
        </div>
      ) : (
        <>
          <StoryArticle story={story} immersiveHero={false} tagLabel={amateurTag(story, label)} />

          {/* Below the article, above MORE AMATEUR NEWS. */}
          <StoryEngagementBlock targetType="amateur_story" storyId={story.id} />

          {(more?.length ?? 0) > 0 && (
            <div style={{ marginTop: 28 }}>
              <div style={{ ...KICKER, color: INK, padding: '0 14px 6px' }}>
                {t('amateurNews.more', 'MORE AMATEUR NEWS')}
              </div>
              {(more ?? []).map((s) => (
                <div key={s.id} style={{ borderTop: `1px solid ${HAIRLINE_INK_10}` }}>
                  <StoryRow story={s} onOpen={() => navigate(`/discover/news/${s.slug}`)} engagement={engagementFor(s.id)} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div
        aria-hidden
        style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + var(--bottom-nav-height, 88px) + 16px)' }}
      />
    </div>
  );
}

export default AmateurStoryPage;
