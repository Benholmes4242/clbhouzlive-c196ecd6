/**
 * AmateurStoryPage — /discover/news/:slug. One amateur story.
 *
 * It renders THE TOUR WIRE'S ARTICLE COMPONENT (StoryArticle). Same lead band
 * height, same headline scale, same prose, same pull quotes, same images. The
 * two differences are declared, not designed: the tag beside the timestamp is
 * the category line plus the free-text event name, and there is no live
 * tournament card because there is no amateur tournament table to drive one.
 *
 * It MUST render for a guest — a shared amateur story that hits a login wall is
 * worthless. Nothing here reads the viewing member.
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { safeGoBack } from '@/utils/navigation';
import { StoryArticle } from '@/features/tourhub/news/StoryPage';
import { StoryRow } from '@/features/tourhub/news/NewsTab';
import { OVERVIEW_HERO_HEIGHT } from '@/features/tourhub/components/overview-v3/OverviewHero';
import {
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
  SLATE_50,
} from '@/features/tourhub/_shared/tokens';
import { categoriesLine } from './categories';
import { useAmateurStory, useMoreAmateurNews, type AmateurStory } from './useAmateurStories';

/** "GIRLS · COUNTY · ENGLISH WOMEN'S COUNTY CHAMPIONSHIP" — either half may be absent. */
export function amateurTag(story: AmateurStory): string | null {
  const parts = [categoriesLine(story.categories), (story.tournament_name ?? '').toUpperCase()]
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts.join(' \u00b7 ') : null;
}

export function AmateurStoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: story, isLoading } = useAmateurStory(slug);
  const { data: more } = useMoreAmateurNews(story?.id);

  return (
    <div style={{ background: SLATE_50, minHeight: '100dvh', fontFamily: FONT, position: 'relative' }}>
      <button
        type="button"
        aria-label="Back"
        onClick={() => safeGoBack(navigate, '/discover/news')}
        className="active:scale-[0.94]"
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          left: 10,
          zIndex: 3,
          width: 34,
          height: 34,
          borderRadius: 12,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.42)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <ChevronLeft size={18} color="#FFFFFF" strokeWidth={2.2} />
      </button>

      {isLoading ? (
        <div style={{ padding: 14 }}>
          <Skeleton style={{ height: OVERVIEW_HERO_HEIGHT, width: '100%' }} />
          <Skeleton style={{ height: 22, width: '80%', marginTop: 14 }} />
          <Skeleton style={{ height: 90, width: '100%', marginTop: 12 }} />
        </div>
      ) : !story ? (
        <div
          style={{
            padding: 'calc(env(safe-area-inset-top, 0px) + 76px) 14px 0',
            fontSize: 13,
            color: INK_MUTE,
          }}
        >
          This story is no longer available.
        </div>
      ) : (
        <>
          <StoryArticle story={story} immersiveHero tagLabel={amateurTag(story)} />

          {(more?.length ?? 0) > 0 && (
            <div style={{ marginTop: 28 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: INK,
                  padding: '0 14px 6px',
                }}
              >
                More amateur news
              </div>
              {(more ?? []).map((s) => (
                <div key={s.id} style={{ borderTop: `1px solid ${HAIRLINE_INK_10}` }}>
                  <StoryRow story={s} onOpen={() => navigate(`/discover/news/${s.slug}`)} />
                </div>
              ))}
            </div>
          )}

          <div
            aria-hidden
            style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + var(--bottom-nav-height, 88px) + 16px)' }}
          />
        </>
      )}
    </div>
  );
}

export default AmateurStoryPage;
