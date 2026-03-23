import { memo, useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, BadgeCheck, Briefcase, ChevronRight } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { SuggestedCreatorsShelf } from '@/components/shared/SuggestedCreatorsShelf';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useGlobalEntitySearch,
  saveRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  type ClubResult,
  type PersonResult,
  type BusinessResult,
  type RecentSearch,
} from '@/hooks/useGlobalEntitySearch';

/* ─── Skeleton sub-components ─── */

const CROSSFADE = { duration: 0.15 };
const FADE_PROPS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: CROSSFADE,
};

/** Eyebrow shimmer pill matching real section headers */
function EyebrowSkeleton({ width = 'w-16' }: { width?: string }) {
  return (
    <div className="px-4 pt-4 pb-2">
      <div className={`h-2.5 ${width} rounded clb-shimmer-dark`} />
    </div>
  );
}

/** Row shimmer matching a real result row */
function RowSkeleton({ avatarShape, nameW = 'w-32', subtitleW = 'w-24' }: {
  avatarShape: string;
  nameW?: string;
  subtitleW?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 min-h-[60px]">
      <div className={`w-10 h-10 ${avatarShape} clb-shimmer-dark shrink-0`} />
      <div className="flex-1 space-y-2">
        <div className={`h-3.5 ${nameW} rounded clb-shimmer-dark`} />
        <div className={`h-3 ${subtitleW} rounded clb-shimmer-dark`} />
      </div>
    </div>
  );
}

/** Divider matching real result dividers */
function SkeletonDivider() {
  return <div className="ml-[52px] border-b border-border/30" />;
}

/** Section-aware search skeleton (Gap 2, 3, 6, 7) */
function SearchSkeleton() {
  const sections = [
    { label: 'Courses', count: 2, shape: 'rounded-xl', eyebrowW: 'w-14' },
    { label: 'People', count: 2, shape: 'clbhouz-squircle', eyebrowW: 'w-12' },
    { label: 'Businesses', count: 2, shape: 'clbhouz-squircle', eyebrowW: 'w-16' },
  ];
  return (
    <>
      {sections.map(({ label, count, shape, eyebrowW }) => (
        <div key={label}>
          <EyebrowSkeleton width={eyebrowW} />
          {Array.from({ length: count }).map((_, i) => (
            <div key={i}>
              <RowSkeleton
                avatarShape={shape}
                nameW={label === 'People' ? 'w-28' : 'w-32'}
                subtitleW={label === 'People' ? 'w-20' : 'w-24'}
              />
              {i < count - 1 && <SkeletonDivider />}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

/** Trending skeleton (Gap 1) — 4 rows matching real trending item layout */
function TrendingSkeletonSection() {
  return (
    <div>
      <EyebrowSkeleton width="w-20" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 min-h-[56px]">
          <div className="w-10 h-10 rounded-xl clb-shimmer-dark shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-32 rounded clb-shimmer-dark" />
            <div className="h-3 w-24 rounded clb-shimmer-dark" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Reusable white card wrapper ── */

function WhiteCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`mx-4 overflow-hidden rounded-2xl ${className}`}
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {children}
    </div>
  );
}

function CardDivider() {
  return <div style={{ height: 1, background: 'rgba(0,0,0,0.05)' }} />;
}

/* ─── Main component ─── */

interface GlobalSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

function GlobalSearchOverlay({ isOpen, onClose }: GlobalSearchOverlayProps) {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const debouncedQuery = useDebounce(inputValue, 250);
  const [recent, setRecent] = useState<RecentSearch[]>(() => getRecentSearches());

  const { people, clubs, businesses, trending, trendingLoading, isLoading } =
    useGlobalEntitySearch({ query: debouncedQuery, enabled: isOpen });

  // Auto-focus 100ms after open, refresh recent searches
  useEffect(() => {
    if (isOpen) {
      setRecent(getRecentSearches());
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    } else {
      setInputValue('');
    }
  }, [isOpen]);

  const handleDeleteRecent = useCallback((id: string) => {
    const updated = recent.filter(s => s.id !== id);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
    setRecent(updated);
  }, [recent]);

  const handleClearAll = useCallback(() => {
    clearRecentSearches();
    setRecent([]);
  }, []);

  const handleSaveRecent = useCallback((query: string) => {
    saveRecentSearch(query);
    setRecent(getRecentSearches());
  }, []);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleSaveRecent(inputValue.trim());
      // Track search query
      const totalResults = (people?.length ?? 0) + (clubs?.length ?? 0) + (businesses?.length ?? 0);
      import('@/utils/analyticsEvents').then(({ analyticsEvents }) => {
        analyticsEvents.track('search_query', {
          query: inputValue.trim(),
          result_count: totalResults,
          query_length: inputValue.trim().length,
        });
      });
    }
  }, [inputValue, handleSaveRecent, people, clubs, businesses]);

  const handleClear = useCallback(() => {
    setInputValue('');
    inputRef.current?.focus();
  }, []);

  const handleClose = useCallback(() => {
    setInputValue('');
    onClose();
  }, [onClose]);

  const selectCourse = useCallback((course: ClubResult) => {
    handleSaveRecent(course.name);
    navigate(`/courses/${course.id}`);
    onClose();
  }, [navigate, onClose, handleSaveRecent]);

  const selectPerson = useCallback((person: PersonResult) => {
    handleSaveRecent(person.display_name);
    navigate(`/profile/${person.username}`);
    onClose();
  }, [navigate, onClose, handleSaveRecent]);

  const selectBusiness = useCallback((business: BusinessResult) => {
    handleSaveRecent(business.name);
    navigate(`/business/${business.slug}`);
    onClose();
  }, [navigate, onClose, handleSaveRecent]);

  const commitRecentSearch = useCallback((query: string) => {
    setInputValue(query);
  }, []);

  const hasQuery = debouncedQuery.trim().length > 0;
  const allEmpty = clubs.length === 0 && people.length === 0 && businesses.length === 0;
  const hasResults = hasQuery && !isLoading && !allEmpty;
  const showNoResults = hasQuery && !isLoading && allEmpty;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[1100] bg-[#F8FAFC] flex flex-col md:items-center"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* Header */}
          <div
            className="w-full md:max-w-[560px] flex items-center gap-3 px-4 pb-3"
            style={{
              paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {/* Search input container — white pill */}
            <div
              className="flex-1 flex items-center gap-2 px-3 rounded-full"
              style={{
                height: 44,
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <Search className="w-4 h-4 shrink-0" style={{ color: '#94a3b8' }} />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search courses, players, businesses..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                autoComplete="off"
                spellCheck="false"
              />
              {inputValue.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px] -mr-3"
                  aria-label="Clear"
                >
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{ width: 22, height: 22, background: 'rgba(0,0,0,0.06)' }}
                  >
                    <X className="w-[11px] h-[11px]" style={{ color: '#64748b' }} strokeWidth={2.5} />
                  </div>
                </button>
              )}
            </div>

            {/* Cancel button — amber */}
            <button
              type="button"
              onClick={handleClose}
              className="shrink-0 text-[14px] font-semibold min-h-[44px] px-1"
              style={{ color: '#F5A623' }}
            >
              Cancel
            </button>
          </div>

          {/* Scroll area */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain pb-safe w-full md:max-w-[560px]"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Idle state */}
            {!hasQuery && (
              <>
                {/* Recent searches */}
                {recent.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                      <span
                        className="text-[11px] font-bold uppercase"
                        style={{ letterSpacing: '0.1em', color: '#94a3b8' }}
                      >
                        Recent Searches
                      </span>
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-[11px] font-semibold"
                        style={{ color: '#F5A623' }}
                      >
                        Clear all
                      </button>
                    </div>
                    <WhiteCard>
                      {recent.map((item, index) => (
                        <div key={item.id}>
                          <div className="min-h-[44px] flex items-center px-4 gap-3">
                            <Clock className="w-[15px] h-[15px] shrink-0" style={{ color: '#94a3b8' }} />
                            <button
                              type="button"
                              onClick={() => commitRecentSearch(item.query)}
                              className="flex-1 text-left truncate min-w-0 block text-[14px] font-medium"
                              style={{ color: '#0f172a' }}
                            >
                              {item.query}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecent(item.id)}
                              className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full"
                              style={{ background: 'rgba(0,0,0,0.04)' }}
                              aria-label={`Remove ${item.query}`}
                            >
                              <X className="w-[11px] h-[11px]" style={{ color: '#94a3b8' }} strokeWidth={2.5} />
                            </button>
                          </div>
                          {index < recent.length - 1 && <CardDivider />}
                        </div>
                      ))}
                    </WhiteCard>
                  </div>
                )}

                {/* Suggested creators shelf */}
                <SuggestedCreatorsShelf
                  userId={user?.id}
                  title="Golfers to follow"
                  showViewAll={true}
                  onViewAll={() => { navigate('/golfers'); onClose(); }}
                  containerStyle={{
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    background: '#ffffff',
                  }}
                />

                {/* Today's Picks — skeleton while loading, real list when resolved */}
                {trendingLoading ? (
                  <TrendingSkeletonSection />
                ) : trending.length > 0 ? (
                  <div>
                    <div className="px-4 pt-4 pb-2">
                      <span
                        className="text-[11px] font-bold uppercase"
                        style={{ letterSpacing: '0.1em', color: '#94a3b8' }}
                      >
                        Today's Picks
                      </span>
                    </div>
                    <WhiteCard>
                      {trending.slice(0, 8).map((item, index) => (
                        <div key={item.id ?? item.label}>
                          <button
                            type="button"
                            onClick={() => {
                              if (item.id) {
                                handleSaveRecent(item.label);
                                navigate(`/courses/${item.id}`);
                                onClose();
                              } else {
                                commitRecentSearch(item.label);
                              }
                            }}
                            className="min-h-[56px] flex items-center px-4 gap-3 w-full active:bg-black/[0.02]"
                          >
                            <div className="w-[42px] h-[42px] rounded-[12px] bg-muted overflow-hidden shrink-0">
                              {item.image && (
                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-[14px] font-medium truncate" style={{ color: '#0f172a' }}>{item.label}</p>
                              {item.subtitle && (
                                <p className="text-[12px] truncate" style={{ color: '#94a3b8' }}>{item.subtitle}</p>
                              )}
                            </div>
                            <ChevronRight className="w-[14px] h-[14px] shrink-0" style={{ color: '#d1d5db' }} />
                          </button>
                          {index < Math.min(trending.length, 8) - 1 && <CardDivider />}
                        </div>
                      ))}
                    </WhiteCard>
                  </div>
                ) : null}
              </>
            )}

            {/* Active search states — AnimatePresence crossfade (Gap 4) */}
            <AnimatePresence mode="wait">
              {isLoading && hasQuery ? (
                <motion.div key="search-skeleton" {...FADE_PROPS}>
                  <SearchSkeleton />
                </motion.div>
              ) : hasResults ? (
                <motion.div key="search-results" {...FADE_PROPS}>
                  {/* Courses */}
                  {clubs.length > 0 && (
                    <div>
                      <div className="px-4 pt-4 pb-2">
                        <span
                          className="text-[11px] font-bold uppercase"
                          style={{ letterSpacing: '0.1em', color: '#94a3b8' }}
                        >
                          Courses
                        </span>
                      </div>
                      <WhiteCard>
                        {clubs.map((course, idx) => (
                          <div key={course.id}>
                            <button
                              type="button"
                              onClick={() => selectCourse(course)}
                              className="w-full flex items-center gap-3 px-4 min-h-[60px] active:bg-black/[0.02]"
                            >
                              <div className="w-[42px] h-[42px] rounded-[12px] bg-muted overflow-hidden shrink-0">
                                {course.logo_url && (
                                  <img src={course.logo_url} alt="" className="w-full h-full object-cover" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-[14px] font-medium truncate" style={{ color: '#0f172a' }}>{course.name}</p>
                                <p className="text-[12px] truncate" style={{ color: '#94a3b8' }}>
                                  {[course.region, course.country].filter(Boolean).join(', ')}
                                  {course.global_rank && ` · #${course.global_rank} World`}
                                </p>
                              </div>
                              <ChevronRight className="w-[14px] h-[14px] shrink-0" style={{ color: '#d1d5db' }} />
                            </button>
                            {idx < clubs.length - 1 && <CardDivider />}
                          </div>
                        ))}
                      </WhiteCard>
                    </div>
                  )}

                  {/* People */}
                  {people.length > 0 && (
                    <div>
                      <div className="px-4 pt-4 pb-2">
                        <span
                          className="text-[11px] font-bold uppercase"
                          style={{ letterSpacing: '0.1em', color: '#94a3b8' }}
                        >
                          People
                        </span>
                      </div>
                      <WhiteCard>
                        {people.map((person, idx) => (
                          <div key={person.id}>
                            <button
                              type="button"
                              onClick={() => selectPerson(person)}
                              className="w-full flex items-center gap-3 px-4 min-h-[60px] active:bg-black/[0.02]"
                            >
                              <div className="w-[42px] h-[42px] clbhouz-squircle bg-muted overflow-hidden shrink-0 relative">
                                {person.avatar_url && (
                                  <img src={person.avatar_url} alt="" className="w-full h-full object-cover" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-1 min-w-0">
                                  <p className="text-[14px] font-medium truncate" style={{ color: '#0f172a' }}>{person.display_name}</p>
                                  {person.verified && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                                </div>
                                <p className="text-[12px] truncate" style={{ color: '#94a3b8' }}>
                                  {person.username && !person.username.includes('@')
                                    ? `@${person.username}`
                                    : ''}
                                  {person.home_club_name
                                    ? `${person.username && !person.username.includes('@') ? ' · ' : ''}${person.home_club_name}`
                                    : ''}
                                </p>
                              </div>
                              <ChevronRight className="w-[14px] h-[14px] shrink-0" style={{ color: '#d1d5db' }} />
                            </button>
                            {idx < people.length - 1 && <CardDivider />}
                          </div>
                        ))}
                      </WhiteCard>
                    </div>
                  )}

                  {/* Businesses */}
                  {businesses.length > 0 && (
                    <div>
                      <div className="px-4 pt-4 pb-2">
                        <span
                          className="text-[11px] font-bold uppercase"
                          style={{ letterSpacing: '0.1em', color: '#94a3b8' }}
                        >
                          Businesses
                        </span>
                      </div>
                      <WhiteCard>
                        {businesses.map((business, idx) => (
                          <div key={business.id}>
                            <button
                              type="button"
                              onClick={() => selectBusiness(business)}
                              className="w-full flex items-center gap-3 px-4 min-h-[60px] active:bg-black/[0.02]"
                            >
                              <div className="w-[42px] h-[42px] clbhouz-squircle bg-muted overflow-hidden shrink-0 relative flex items-center justify-center">
                                {business.logo_url
                                  ? <img src={business.logo_url} alt="" className="w-full h-full object-cover" />
                                  : <Briefcase className="w-5 h-5 text-muted-foreground" />
                                }
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-1 min-w-0">
                                  <p className="text-[14px] font-medium truncate" style={{ color: '#0f172a' }}>{business.name}</p>
                                  {business.verified && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
                                </div>
                                <p className="text-[12px] truncate" style={{ color: '#94a3b8' }}>
                                  {[business.city, business.country].filter(Boolean).join(', ')}
                                </p>
                              </div>
                              <ChevronRight className="w-[14px] h-[14px] shrink-0" style={{ color: '#d1d5db' }} />
                            </button>
                            {idx < businesses.length - 1 && <CardDivider />}
                          </div>
                        ))}
                      </WhiteCard>
                    </div>
                  )}
                </motion.div>
              ) : showNoResults ? (
                <motion.div key="search-no-results" {...FADE_PROPS}>
                  <div className="flex flex-col items-center justify-center py-20 px-6 gap-3">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.05)' }}
                    >
                      <Search className="w-7 h-7" style={{ color: '#94a3b8' }} />
                    </div>
                    <p className="text-[14px] font-medium" style={{ color: '#0f172a' }}>
                      No results for "<span className="inline-block max-w-[180px] truncate align-bottom">{debouncedQuery}</span>"
                    </p>
                    <p className="text-[12px] text-center max-w-[240px] md:max-w-[360px]" style={{ color: '#94a3b8' }}>
                      Try searching for a course name, player, or business
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Bottom safe area */}
          <div className="pb-safe" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(GlobalSearchOverlay);
