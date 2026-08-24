import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { claimOverlayChrome, releaseOverlayChrome } from '@/lib/routeChrome';
import { A, S } from './lib/tokens';

import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';
import { SearchField } from './components/SearchField';
import { ScopeChips } from './components/ScopeChips';
import { SectionHeader } from './components/SectionHeader';
import { PersonRow } from './components/PersonRow';
import { CourseRow } from './components/CourseRow';
import { PlayerRow } from './components/PlayerRow';
import { ClubRow } from './components/ClubRow';
import { VideoRailCard } from './components/VideoRailCard';
import { PostRow } from './components/PostRow';
import { RecentsList } from './components/RecentsList';
import { RequestCourseCTAV2 } from './components/RequestCourseCTAV2';
import { SearchEmptyState } from './components/SearchEmptyState';
import { useGlobalSearchV2, type Scope } from './hooks/useGlobalSearchV2';
import { useRecentSearchesV2 } from './hooks/useRecentSearchesV2';
import {
  navPerson,
  navCourse,
  navPlayer,
  navClub,
  navVideo,
  navPost,
} from './lib/searchNavigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Overlay behaviour:
   * - 'default' — Directory (all scopes + chips, tapping a row navigates).
   * - 'videos'  — Directory locked to videos scope, chips hidden.
   * - 'commit'  — Watch commit mode: input + recents + LIVE video preview
   *               rail from RPC while typing. Committing (Enter or the
   *               "Search '<term>'" row) calls onCommit(term), saves the
   *               recent, and closes. Tapping a preview video navigates.
   */
  mode?: 'default' | 'videos' | 'commit';
  /** Placeholder for the input; defaults per mode. */
  placeholder?: string;
  /** Required for 'commit' mode; called with the committed term. */
  onCommit?: (term: string) => void;
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 min-h-[60px]">
      <div className="w-[42px] h-[42px] rounded-[12px] clb-shimmer-dark shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 rounded clb-shimmer-dark" />
        <div className="h-3 w-20 rounded clb-shimmer-dark" />
      </div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div>
      <div style={{ padding: '16px 16px 12px' }}>
        <div className="h-3 w-16 rounded clb-shimmer-dark" />
      </div>
      <RowSkeleton />
      <RowSkeleton />
      <RowSkeleton />
    </div>
  );
}

export function SearchOverlayV2({
  isOpen,
  onClose,
  mode = 'default',
  placeholder,
  onCommit,
}: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const initialScope: Scope =
    mode === 'videos' || mode === 'commit' ? 'videos' : 'all';
  const [scope, setScope] = useState<Scope>(initialScope);
  const { items: recents, save, clear } = useRecentSearchesV2();

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
    setInputValue('');
    setScope(initialScope);
  }, [isOpen, initialScope]);

  useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [isOpen]);

  // Search overlay is always a DARK surface: claim dark chrome while open.
  // The claim stack ensures returning from immersive overlays (fullscreen
  // viewer, etc.) restores the overlay's chrome instead of the underlying route.
  // Claim dark chrome SYNCHRONOUSLY at commit (useLayoutEffect) so the
  // native status bar repaint is dispatched one frame ahead of the slide
  // animation, preventing a visible recolour mid-slide on device.
  useLayoutEffect(() => {
    if (!isOpen) return;
    claimOverlayChrome({
      id: 'search-overlay-v2',
      // 'light' = LIGHT icons (clock/signal/battery) over a DARK bar. The
      // naming describes the ICONS, not the background.
      statusBarStyle: S.STATUS_BAR_STYLE,
      statusBarColor: S.STATUS_BAR_COLOR,
      shieldColor: S.GROUND,
    });
    return () => releaseOverlayChrome('search-overlay-v2');
  }, [isOpen]);


  const { data, isLoading, error, debouncedQuery, refetch } = useGlobalSearchV2({
    query: inputValue,
    scope,
    enabled: isOpen,
  });

  const q = debouncedQuery.trim();
  const hasQuery = q.length > 0;

  const handleClose = useCallback(() => {
    setInputValue('');
    onClose();
  }, [onClose]);

  const commit = useCallback(
    (fn: () => void) => {
      if (q) save(q);
      fn();
      onClose();
    },
    [q, save, onClose],
  );

  const commitTerm = useCallback(
    (term: string) => {
      const t = term.trim();
      if (!t) return;
      save(t);
      onCommit?.(t);
      setInputValue('');
      onClose();
    },
    [save, onCommit, onClose],
  );

  const hasInput = inputValue.trim().length >= 1;
  const showChips = mode === 'default' && hasInput;

  // Reset scope to the mode's initial scope whenever the query clears.
  useEffect(() => {
    if (!hasInput && scope !== initialScope) setScope(initialScope);
  }, [hasInput, scope, initialScope]);
  const isCommit = mode === 'commit';

  const totalHits =
    data.people.length +
    data.courses.length +
    data.players.length +
    data.clubs.length +
    data.videos.length +
    data.posts.length;

  const allEmpty = hasQuery && !isLoading && totalHits === 0;

  const goScope = (s: Scope) => setScope(s);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Static safe-area cap: present immediately so the sliding
              panel never reveals an uncovered notch band mid-animation. */}
          <motion.div
            className="fixed inset-x-0 top-0 z-[10099]"
            style={{
              background: S.GROUND,
              height: 'max(var(--safe-top, env(safe-area-inset-top, 0px)), 0px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
          />
          <motion.div
            className="fixed inset-0 z-[10100] flex flex-col md:items-center"
            style={{ background: S.GROUND }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          >
          <SearchField
            ref={inputRef}
            value={inputValue}
            onChange={setInputValue}
            onCancel={handleClose}
            onSubmit={() => {
              if (isCommit) {
                commitTerm(inputValue);
              } else if (q) {
                save(q);
              }
            }}
            placeholder={
              placeholder ??
              (mode === 'videos'
                ? 'Search videos'
                : isCommit
                  ? 'Search videos…'
                  : 'Search clbhouz')
            }
          />

          {mode === 'default' && (
            <motion.div
              initial={false}
              animate={{ height: showChips ? 'auto' : 0, opacity: showChips ? 1 : 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{ overflow: 'hidden', width: '100%' }}
            >
              <ScopeChips scope={scope} onChange={setScope} />
            </motion.div>
          )}

          <div
            className="flex-1 overflow-y-auto overscroll-contain w-full md:max-w-[560px]"
            style={{
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 'var(--bottom-nav-height, 88px)',
            }}
          >
            {!hasQuery && (
              <>
                <RecentsList
                  items={recents}
                  onPick={(qq) => {
                    if (isCommit) commitTerm(qq);
                    else setInputValue(qq);
                  }}
                  onClear={clear}
                />
                {mode === 'default' && (
                  <SearchEmptyState onSelect={onClose} />
                )}
              </>
            )}

            {hasQuery && isLoading && (
              <>
                <LoadingBlock />
                <LoadingBlock />
              </>
            )}

            {hasQuery && !isLoading && error && (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <p className="text-[13px]" style={{ color: S.QUIET }}>
                  Something went wrong. Tap to retry.
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-3 text-[13px] font-bold"
                  style={{ color: S.INK }}
                >
                  Retry
                </button>
              </div>
            )}

            {hasQuery && !isLoading && !error && isCommit && (
              <CommitResults
                query={q}
                videos={data.videos}
                onCommit={commitTerm}
                onSelectVideo={(v) => commit(() => navVideo(navigate, v))}
              />
            )}

            {hasQuery && !isLoading && !error && !isCommit && (
              <>
                {scope === 'all' ? (
                  <>
                    {data.people.length > 0 && (
                      <div>
                        <SectionHeader
                          label="People"
                          onSeeAll={
                            data.people.length >= 5 ? () => goScope('people') : undefined
                          }
                        />
                        {data.people.map((p) => (
                          <PersonRow
                            key={p.id}
                            person={p}
                            query={q}
                            onSelect={() => commit(() => navPerson(navigate, p))}
                          />
                        ))}
                      </div>
                    )}

                    {data.courses.length > 0 && (
                      <div>
                        <SectionHeader
                          label="Courses"
                          onSeeAll={
                            data.courses.length >= 5 ? () => goScope('courses') : undefined
                          }
                        />
                        {data.courses.map((c) => (
                          <CourseRow
                            key={c.id}
                            course={c}
                            query={q}
                            onSelect={() => commit(() => navCourse(navigate, c))}
                          />
                        ))}
                      </div>
                    )}

                    {data.players.length > 0 && (
                      <div>
                        <SectionHeader
                          label="Players"
                          onSeeAll={
                            data.players.length >= 5 ? () => goScope('players') : undefined
                          }
                        />
                        {data.players.map((p) => (
                          <PlayerRow
                            key={p.id}
                            player={p}
                            query={q}
                            onSelect={() => commit(() => navPlayer(navigate, p))}
                          />
                        ))}
                      </div>
                    )}

                    {data.clubs.length > 0 && (
                      <div>
                        <SectionHeader
                          label="Clubs"
                          onSeeAll={
                            data.clubs.length >= 5 ? () => goScope('clubs') : undefined
                          }
                        />
                        {data.clubs.map((b) => (
                          <ClubRow
                            key={b.id}
                            club={b}
                            query={q}
                            onSelect={() => commit(() => navClub(navigate, b))}
                          />
                        ))}
                      </div>
                    )}

                    {data.videos.length > 0 && (
                      <div>
                        <SectionHeader
                          label="Videos"
                          onSeeAll={
                            data.videos.length >= 5 ? () => goScope('videos') : undefined
                          }
                        />
                        <div
                          className="flex scrollbar-hide"
                          style={{
                            gap: 12,
                            overflowX: 'auto',
                            padding: '0 16px 16px',
                            WebkitOverflowScrolling: 'touch',
                          }}
                        >
                          {data.videos.map((v) => (
                            <VideoRailCard
                              key={v.id}
                              video={v}
                              onSelect={() => commit(() => navVideo(navigate, v))}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {data.posts.length > 0 && (
                      <div>
                        <SectionHeader
                          label="Posts"
                          onSeeAll={
                            data.posts.length >= 5 ? () => goScope('posts') : undefined
                          }
                        />
                        {data.posts.map((p) => (
                          <PostRow
                            key={p.id}
                            post={p}
                            query={q}
                            onSelect={() => commit(() => navPost(navigate, p))}
                          />
                        ))}
                      </div>
                    )}

                    {allEmpty && (
                      <div>
                        <div style={{ padding: '32px 16px 8px', textAlign: 'center' }}>
                          <p
                            className="text-[15px] font-bold"
                            style={{ color: S.INK }}
                          >
                            Nothing for &ldquo;{q}&rdquo;
                          </p>
                          <p className="text-[12.5px] mt-1" style={{ color: S.QUIET }}>
                            Try a different spelling or check the course request below.
                          </p>
                        </div>
                        <RequestCourseCTAV2 prefillName={q} onBeforeOpen={onClose} />
                      </div>
                    )}
                  </>
                ) : (
                  <SingleScope
                    scope={scope}
                    query={q}
                    data={data}
                    onCommit={commit}
                    navigate={navigate}
                    onClose={onClose}
                  />
                )}
              </>
            )}
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function SingleScope({
  scope,
  query,
  data,
  onCommit,
  navigate,
  onClose,
}: {
  scope: Scope;
  query: string;
  data: ReturnType<typeof useGlobalSearchV2>['data'];
  onCommit: (fn: () => void) => void;
  navigate: ReturnType<typeof useNavigate>;
  onClose: () => void;
}) {
  if (scope === 'people') {
    if (data.people.length === 0)
      return <EmptyScope label={`No people for “${query}”`} />;
    return (
      <div>
        {data.people.map((p) => (
          <PersonRow
            key={p.id}
            person={p}
            query={query}
            onSelect={() => onCommit(() => navPerson(navigate, p))}
          />
        ))}
      </div>
    );
  }
  if (scope === 'courses') {
    return (
      <div>
        {data.courses.length === 0 ? (
          <EmptyScope label={`No courses for “${query}”`} />
        ) : (
          data.courses.map((c) => (
            <CourseRow
              key={c.id}
              course={c}
              query={query}
              onSelect={() => onCommit(() => navCourse(navigate, c))}
            />
          ))
        )}
        <RequestCourseCTAV2 prefillName={query} onBeforeOpen={onClose} />
      </div>
    );
  }
  if (scope === 'players') {
    if (data.players.length === 0)
      return <EmptyScope label={`No players for “${query}”`} />;
    return (
      <div>
        {data.players.map((p) => (
          <PlayerRow
            key={p.id}
            player={p}
            query={query}
            onSelect={() => onCommit(() => navPlayer(navigate, p))}
          />
        ))}
      </div>
    );
  }
  if (scope === 'clubs') {
    if (data.clubs.length === 0)
      return <EmptyScope label={`No clubs for “${query}”`} />;
    return (
      <div>
        {data.clubs.map((b) => (
          <ClubRow
            key={b.id}
            club={b}
            query={query}
            onSelect={() => onCommit(() => navClub(navigate, b))}
          />
        ))}
      </div>
    );
  }
  if (scope === 'videos') {
    if (data.videos.length === 0)
      return <EmptyScope label={`No videos for “${query}”`} />;
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 12,
          padding: '8px 16px 16px',
        }}
      >
        {data.videos.map((v) => (
          <VideoRailCard
            key={v.id}
            video={v}
            onSelect={() => onCommit(() => navVideo(navigate, v))}
          />
        ))}
      </div>
    );
  }
  if (scope === 'posts') {
    if (data.posts.length === 0)
      return <EmptyScope label={`No posts for “${query}”`} />;
    return (
      <div>
        {data.posts.map((p) => (
          <PostRow
            key={p.id}
            post={p}
            query={query}
            onSelect={() => onCommit(() => navPost(navigate, p))}
          />
        ))}
      </div>
    );
  }
  return null;
}

function EmptyScope({ label }: { label: string }) {
  return (
    <div style={{ padding: '40px 16px 16px', textAlign: 'center' }}>
      <p className="text-[13.5px]" style={{ color: S.QUIET }}>
        {label}
      </p>
    </div>
  );
}

function CommitResults({
  query,
  videos,
  onCommit,
  onSelectVideo,
}: {
  query: string;
  videos: ReturnType<typeof useGlobalSearchV2>['data']['videos'];
  onCommit: (term: string) => void;
  onSelectVideo: (video: ReturnType<typeof useGlobalSearchV2>['data']['videos'][number]) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onCommit(query)}
        className="w-full flex items-center gap-3 px-4 min-h-[56px] text-left active:opacity-70"
        style={{ borderBottom: `1px solid ${S.HAIRLINE}` }}
      >
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{
            width: 32,
            height: 32,
            background: S.TILE,
            color: S.INK,
            fontSize: 14,
            fontWeight: 700,
          }}
          aria-hidden="true"
        >
          <Search size={15} strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold truncate" style={{ color: S.INK }}>
            Search “{query}”
          </div>
          <div className="text-[11.5px]" style={{ color: S.QUIET }}>
            Filter the grid to matching clips
          </div>
        </div>
      </button>

      {videos.length > 0 ? (
        <>
          <div style={{ padding: '16px 16px 12px' }}>
            <span
              className="text-[11px] font-bold tracking-[0.08em] uppercase"
              style={{ color: S.QUIET }}
            >
              Previews
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 12,
              padding: '0 16px 16px',
            }}
          >
            {videos.map((v) => (
              <VideoRailCard key={v.id} video={v} onSelect={() => onSelectVideo(v)} />
            ))}
          </div>
        </>
      ) : (
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <p className="text-[13px]" style={{ color: S.QUIET }}>
            No preview clips yet — tap “Search” to filter the grid.
          </p>
        </div>
      )}
    </div>
  );
}

export default SearchOverlayV2;
