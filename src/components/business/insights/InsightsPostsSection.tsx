/**
 * CB85 — Insights section 4 "Your posts". Replaces "CONTENT · Top posts".
 * Draws nothing until the first read settles and nothing if it fails; period
 * switches keep the previous card. Rows render exactly in the server's order;
 * bars are relative to posts[0]. Styled as sections 1–3.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber, formatDayMonthShortGB, formatDayMonthYearShortGB } from '@/i18n/format';
import { stripMentionMarkup } from '@/lib/mentions/format';
import { useBusinessPostReach, type BusinessPostReach, type PostReachRow } from '@/hooks/useBusinessPostReach';

export const POSTS_FOLD = 4;
export const BAR_MIN_PCT = 2;

type K = (key: string, o?: Record<string, unknown>) => string;

export type PostsTitleKind = 'outsized' | 'best' | 'none' | 'nothing';
export function postsTitleKind(posts: PostReachRow[]): PostsTitleKind {
  const r = posts.filter(p => p.reached > 0);
  if (posts.length === 0) return 'nothing';
  if (r.length === 0) return 'none';
  if (r.length >= 2 && r[0].reached > r.slice(1).reduce((a, p) => a + p.reached, 0)) return 'outsized';
  return 'best';
}

export type FoldKind = 'all-zero' | 'none-zero' | 'mixed';
export function foldKind(hidden: PostReachRow[]): FoldKind {
  const z = hidden.filter(p => p.reached === 0).length;
  return z === hidden.length ? 'all-zero' : z === 0 ? 'none-zero' : 'mixed';
}

export function postDate(iso: string, now = new Date()): string {
  try {
    const d = new Date(iso);
    return d.getFullYear() === now.getFullYear() ? formatDayMonthShortGB(d) : formatDayMonthYearShortGB(d);
  } catch { return iso; }
}

export function barPct(reached: number, top: number): number {
  if (top <= 0) return 0;
  return Math.max(BAR_MIN_PCT, (reached / top) * 100);
}

/** Renders `<b>…</b>` spans from a translated string as bold ink spans. */
const bolded = (s: string): ReactNode[] =>
  s.split(/<b>(.*?)<\/b>/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part));

const Row = ({ p, i, top, k, onOpen }: { p: PostReachRow; i: number; top: number; k: K; onOpen: (id: string) => void }) => {
  const preview = stripMentionMarkup(p.preview ?? '').trim();
  const meta = [
    postDate(p.created_at),
    p.likes > 0 ? k('likes', { count: p.likes, n: formatNumber(p.likes) }) : null,
    p.comments > 0 ? k('comments', { count: p.comments, n: formatNumber(p.comments) }) : null,
    p.not_following > 0 ? k('notFollowing', { count: p.not_following, n: formatNumber(p.not_following) }) : null,
  ].filter(Boolean).join(' · ');
  return (
    <button
      type="button"
      className="insights-posts-row"
      data-post-row={p.post_id}
      data-zero={p.reached === 0 || undefined}
      onClick={() => onOpen(p.post_id)}
    >
      <div className="insights-posts-top">
        <span className="insights-posts-rank">{i + 1}</span>
        <span className="insights-posts-preview" data-empty-preview={!preview || undefined}>{preview || k('noCaption')}</span>
        <span className="insights-posts-count" data-count={p.reached}>{formatNumber(p.reached)}</span>
      </div>
      <div className="insights-posts-meta" data-meta>{meta}</div>
      {p.reached > 0 && (
        <div className="insights-posts-bar"><i data-bar style={{ width: `${barPct(p.reached, top)}%` }} /></div>
      )}
    </button>
  );
};

const Card = ({ d, days, k, canPost, onPost, onOpen }: {
  d: BusinessPostReach; days: number; k: K; canPost: boolean; onPost: () => void; onOpen: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [days]);
  const { posts } = d;
  const kind = postsTitleKind(posts);
  const top = posts[0]?.reached ?? 0;
  const title =
    kind === 'outsized' ? k('titleOutsized')
      : kind === 'best' ? k('titleBest', { count: top, n: formatNumber(top) })
        : kind === 'none' ? k('titleNone', { count: posts.length, n: formatNumber(posts.length) })
          : k(`titleNothing_${days}`);
  const hidden = posts.slice(POSTS_FOLD);
  const shown = open ? posts : posts.slice(0, POSTS_FOLD);
  const z = hidden.filter(p => p.reached === 0).length;
  const fk = foldKind(hidden);
  const foldText = fk === 'all-zero'
    ? k('foldAllZero', { count: hidden.length, n: formatNumber(hidden.length) })
    : fk === 'none-zero'
      ? k('foldNoneZero', { count: hidden.length, n: formatNumber(hidden.length) })
      : k('foldMixed', { n: formatNumber(hidden.length), z: formatNumber(z) });

  return (
    <section className="insights-posts-card" data-card="posts" data-title={kind}>
      <div className="insights-visits-kicker">
        <span>{k('kicker')}</span>
        {kind !== 'nothing' && <span data-kicker-right>{k('reachedLabel')}</span>}
      </div>
      <h3 className="insights-posts-title">{title}</h3>
      {kind === 'nothing' ? (
        <>
          {d.last_post && (
            <p className="insights-posts-last" data-last-reached={d.last_post.reached}>
              {bolded(d.last_post.reached === 0
                ? k('lastZero', { date: postDate(d.last_post.created_at) })
                : k('lastReached', { count: d.last_post.reached, n: formatNumber(d.last_post.reached), date: postDate(d.last_post.created_at) }))}
            </p>
          )}
          {canPost && (
            <button type="button" className="insights-posts-write" data-write-post onClick={onPost}>{k('write')}</button>
          )}
        </>
      ) : (
        <>
          <div className="insights-posts-list">
            {shown.map((p, i) => <Row key={p.post_id} p={p} i={i} top={top} k={k} onOpen={onOpen} />)}
          </div>
          {hidden.length > 0 && (
            <div className="insights-posts-more" data-fold={open ? 'open' : fk} data-hidden={hidden.length} data-hidden-zero={z}>
              <span>{open ? '' : foldText}</span>
              <button type="button" data-fold-toggle onClick={() => setOpen(o => !o)}>{open ? k('showFewer') : k('show')}</button>
            </div>
          )}
          <p className="insights-posts-fine" data-fine={kind === 'none' ? 'none' : 'reached'}>
            {kind === 'none' ? k('fineNone') : k('fineReached')}
          </p>
        </>
      )}
    </section>
  );
};

export function InsightsPostsSection({ businessId, days, canPost, onPost, onOpen }: {
  businessId: string; days: number; canPost: boolean; onPost: () => void; onOpen: (postId: string) => void;
}) {
  const { t } = useTranslation('common');
  const q = useBusinessPostReach(businessId, days);
  if (q.isError || !q.data) return null;
  const k: K = (key, options = {}) => t(`business.insights.posts.${key}`, { ...options, defaultValue: '' });
  return <Card d={q.data} days={days} k={k} canPost={canPost} onPost={onPost} onOpen={onOpen} />;
}
