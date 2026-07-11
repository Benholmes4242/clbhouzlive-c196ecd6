import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
      <div className="w-[42px] h-[42px] rounded-[12px] clb-shimmer-light shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 rounded clb-shimmer-light" />
        <div className="h-3 w-20 rounded clb-shimmer-light" />
      </div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div>
      <div style={{ padding: '18px 16px 8px' }}>
        <div className="h-3 w-16 rounded clb-shimmer-light" />
      </div>
      <RowSkeleton />
      <RowSkeleton />
      <RowSkeleton />
    </div>
  );
}

export function SearchOverlayV2({ isOpen, onClose, mode = 'default' }: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [scope, setScope] = useState<Scope>(mode === 'videos' ? 'videos' : 'all');
  const { items: recents, save, clear } = useRecentSearchesV2();

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
    setInputValue('');
    setScope(mode === 'videos' ? 'videos' : 'all');
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [isOpen]);

  const { data, isLoading, error, debouncedQuery } = useGlobalSearchV2({
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

  const showChips = mode !== 'videos';

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
        <motion.div
          className="fixed inset-0 z-[10100] bg-[#F8FAFC] flex flex-col md:items-center"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <SearchField
            ref={inputRef}
            value={inputValue}
            onChange={setInputValue}
            onCancel={handleClose}
            onSubmit={() => q && save(q)}
            placeholder={mode === 'videos' ? 'Search videos' : 'Search clbhouz'}
          />

          {showChips && <ScopeChips scope={scope} onChange={setScope} />}

          <div
            className="flex-1 overflow-y-auto overscroll-contain w-full md:max-w-[560px]"
            style={{
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 'var(--bottom-nav-height, 88px)',
            }}
          >
            {!hasQuery && (
              <RecentsList
                items={recents}
                onPick={(qq) => setInputValue(qq)}
                onClear={clear}
              />
            )}

            {hasQuery && isLoading && (
              <>
                <LoadingBlock />
                <LoadingBlock />
              </>
            )}

            {hasQuery && !isLoading && error && (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <p className="text-[13px]" style={{ color: '#94A3B8' }}>
                  Something went wrong. Tap to retry.
                </p>
                <button
                  type="button"
                  onClick={() => setInputValue((v) => v + ' ')}
                  className="mt-3 text-[13px] font-bold"
                  style={{ color: '#0F172A' }}
                >
                  Retry
                </button>
              </div>
            )}

            {hasQuery && !isLoading && !error && (
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
                            gap: 10,
                            overflowX: 'auto',
                            padding: '4px 16px 8px',
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
                            style={{ color: '#0F172A' }}
                          >
                            Nothing for &ldquo;{q}&rdquo;
                          </p>
                          <p className="text-[12.5px] mt-1" style={{ color: '#64748B' }}>
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
          padding: '10px 16px 16px',
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
      <p className="text-[13.5px]" style={{ color: '#64748B' }}>
        {label}
      </p>
    </div>
  );
}

export default SearchOverlayV2;
