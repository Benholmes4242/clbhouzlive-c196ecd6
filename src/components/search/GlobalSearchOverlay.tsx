import { memo, useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, BadgeCheck, Briefcase, Star, Lock } from 'lucide-react';
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

/* ─── Design tokens ─── */
const INK = '#0F172A';
const INK_SOFT = '#475569';
const INK_SUBTLE = '#94A3B8';
const BORDER = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const GREEN = '#006747';

const CROSSFADE = { duration: 0.15 };
const FADE_PROPS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: CROSSFADE,
};

/* ─── Reusable section header ─── */

function SectionHeader({
  label,
  action,
  onActionClick,
}: {
  label: string;
  action?: string;
  onActionClick?: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        padding: '18px 16px 10px',
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: INK,
          letterSpacing: '-0.01em',
        }}
      >
        {label}
      </span>
      {action && onActionClick && (
        <button
          type="button"
          onClick={onActionClick}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: AMBER,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

/* ─── Skeletons ─── */

function EyebrowSkeleton({ width = 'w-16' }: { width?: string }) {
  return (
    <div style={{ padding: '18px 16px 10px' }}>
      <div className={`h-3 ${width} rounded clb-shimmer-light`} />
    </div>
  );
}

function RowSkeleton({ avatarShape, nameW = 'w-32', subtitleW = 'w-24' }: {
  avatarShape: string;
  nameW?: string;
  subtitleW?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 min-h-[60px]">
      <div className={`w-10 h-10 ${avatarShape} clb-shimmer-light shrink-0`} />
      <div className="flex-1 space-y-2">
        <div className={`h-3.5 ${nameW} rounded clb-shimmer-light`} />
        <div className={`h-3 ${subtitleW} rounded clb-shimmer-light`} />
      </div>
    </div>
  );
}

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
            <RowSkeleton
              key={i}
              avatarShape={shape}
              nameW={label === 'People' ? 'w-28' : 'w-32'}
              subtitleW={label === 'People' ? 'w-20' : 'w-24'}
            />
          ))}
        </div>
      ))}
    </>
  );
}

function TrendingShelfSkeleton() {
  return (
    <div>
      <EyebrowSkeleton width="w-20" />
      <div
        className="flex scrollbar-hide"
        style={{
          gap: 10,
          overflowX: 'auto',
          padding: '4px 16px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ flexShrink: 0, width: 140 }}>
            <div
              className="clb-shimmer-light"
              style={{ width: 140, height: 175, borderRadius: 14 }}
            />
            <div className="h-3 w-28 rounded clb-shimmer-light mt-2" />
            <div className="h-2.5 w-20 rounded clb-shimmer-light mt-1.5" />
          </div>
        ))}
      </div>
    </div>
  );
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
  const [typeFilter, setTypeFilter] = useState<'all' | 'courses' | 'people' | 'businesses'>('all');

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

  // Reset filter when query changes
  useEffect(() => {
    setTypeFilter('all');
  }, [debouncedQuery]);

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

  const selectCourseRate = useCallback((course: ClubResult) => {
    handleSaveRecent(course.name);
    onClose();
    navigate(`/courses/${course.id}/rate`);
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

  const showCourses = typeFilter === 'all' || typeFilter === 'courses';
  const showPeople = typeFilter === 'all' || typeFilter === 'people';
  const showBusinesses = typeFilter === 'all' || typeFilter === 'businesses';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[10100] bg-[#F8FAFC] flex flex-col md:items-center"
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
              <Search className="w-4 h-4 shrink-0" style={{ color: INK_SUBTLE }} />
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
                    style={{ width: 24, height: 24, background: 'rgba(0,0,0,0.08)' }}
                  >
                    <X className="w-[12px] h-[12px]" style={{ color: '#64748b' }} strokeWidth={2.5} />
                  </div>
                </button>
              )}
            </div>

            {/* Cancel button — brand amber */}
            <button
              type="button"
              onClick={handleClose}
              className="shrink-0 text-[14px] font-semibold min-h-[44px] px-1"
              style={{ color: AMBER }}
            >
              Cancel
            </button>
          </div>

          {/* Type filter pills — only in active state */}
          {hasQuery && !isLoading && !allEmpty && (
            <div
              className="w-full md:max-w-[560px] flex scrollbar-hide"
              style={{
                gap: 8,
                padding: '10px 16px 2px',
                overflowX: 'auto',
              }}
            >
              {[
                { key: 'all' as const, label: 'All', count: clubs.length + people.length + businesses.length },
                { key: 'courses' as const, label: 'Courses', count: clubs.length },
                { key: 'people' as const, label: 'People', count: people.length },
                { key: 'businesses' as const, label: 'Businesses', count: businesses.length },
              ]
                .filter(pill => pill.key === 'all' || pill.count > 0)
                .map(pill => {
                  const isActive = typeFilter === pill.key;
                  return (
                    <button
                      key={pill.key}
                      type="button"
                      onClick={() => setTypeFilter(pill.key)}
                      style={{
                        flexShrink: 0,
                        padding: '6px 14px',
                        borderRadius: 999,
                        fontSize: 12.5,
                        fontWeight: 600,
                        border: `1px solid ${isActive ? INK : BORDER}`,
                        background: isActive ? INK : '#fff',
                        color: isActive ? '#fff' : INK_SOFT,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {pill.label}
                      {pill.key !== 'all' && pill.count > 0 && (
                        <span style={{ opacity: 0.5 }}>{pill.count}</span>
                      )}
                    </button>
                  );
                })}
            </div>
          )}

          {/* Scroll area */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain w-full md:max-w-[560px]"
            style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'var(--bottom-nav-height, 88px)' }}
          >
            {/* Idle state */}
            {!hasQuery && (
              <>
                {/* Recent — pill chips */}
                {recent.length > 0 && (
                  <div>
                    <SectionHeader label="Recent" action="Clear all" onActionClick={handleClearAll} />
                    <div
                      style={{
                        padding: '0 16px 6px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                      }}
                    >
                      {recent.slice(0, 10).map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => commitRecentSearch(item.query)}
                          style={{
                            padding: '7px 12px',
                            borderRadius: 999,
                            background: '#fff',
                            border: `1px solid ${BORDER}`,
                            fontSize: 12.5,
                            color: INK,
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer',
                          }}
                        >
                          <Clock size={11} color={INK_SUBTLE} strokeWidth={2} />
                          {item.query}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Today's Picks — horizontal shelf */}
                {trendingLoading ? (
                  <TrendingShelfSkeleton />
                ) : trending.length > 0 ? (
                  <div>
                    <SectionHeader
                      label="Today's picks"
                      action="See all"
                      onActionClick={() => {
                        navigate('/courses');
                        onClose();
                      }}
                    />
                    <div
                      className="flex scrollbar-hide"
                      style={{
                        gap: 10,
                        overflowX: 'auto',
                        padding: '4px 16px',
                        WebkitOverflowScrolling: 'touch',
                      }}
                    >
                      {trending.slice(0, 12).map(item => (
                        <button
                          key={item.id ?? item.label}
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
                          style={{
                            flexShrink: 0,
                            width: 140,
                            background: 'transparent',
                            border: 'none',
                            padding: 0,
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            style={{
                              position: 'relative',
                              width: 140,
                              height: 175,
                              borderRadius: 14,
                              background: '#E2E8F0',
                              overflow: 'hidden',
                              boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
                            }}
                          >
                            {item.image && (
                              <img
                                src={item.image}
                                alt=""
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                                loading="lazy"
                              />
                            )}
                          </div>
                          <div style={{ padding: '8px 2px 0' }}>
                            <div
                              style={{
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: INK,
                                letterSpacing: '-0.01em',
                                lineHeight: 1.25,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical' as const,
                                overflow: 'hidden',
                                // Reserve 2 lines of height so 1-line names don't collapse the card
                                minHeight: 'calc(12.5px * 1.25 * 2)',
                              }}
                            >
                              {item.label}
                            </div>
                            {item.subtitle && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: INK_SUBTLE,
                                  marginTop: 2,
                                }}
                              >
                                {item.subtitle.split('·')[0].trim()}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Golfers to follow — horizontal cards (existing component) */}
                <SuggestedCreatorsShelf
                  userId={user?.id}
                  title="Golfers to follow"
                  showViewAll={true}
                  onViewAll={() => { navigate('/golfers'); onClose(); }}
                  containerStyle={{
                    background: 'transparent',
                    borderTop: 'none',
                    borderBottom: 'none',
                  }}
                />
              </>
            )}

            {/* Active search states — AnimatePresence crossfade */}
            <AnimatePresence mode="wait">
              {isLoading && hasQuery ? (
                <motion.div key="search-skeleton" {...FADE_PROPS}>
                  <SearchSkeleton />
                </motion.div>
              ) : hasResults ? (
                <motion.div key="search-results" {...FADE_PROPS}>
                  {/* Courses */}
                  {showCourses && clubs.length > 0 && (
                    <div>
                      <SectionHeader label="Courses" />
                      {clubs.map(course => (
                        <div key={course.id}>
                          <button
                            type="button"
                            onClick={() => selectCourse(course)}
                            className="w-full flex items-center gap-3 px-4 min-h-[56px] active:bg-black/[0.02]"
                          >
                            <div className="w-[42px] h-[42px] rounded-[12px] bg-muted overflow-hidden shrink-0">
                              {course.logo_url && (
                                <img src={course.logo_url} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-[14px] font-medium truncate" style={{ color: INK }}>{course.name}</p>
                              <p className="text-[12px] truncate" style={{ color: INK_SUBTLE }}>
                                {[course.region, course.country].filter(Boolean).join(', ')}
                                {course.global_rank && ` · #${course.global_rank} World`}
                              </p>
                            </div>
                          </button>
                          {/* Secondary actions row */}
                          <div style={{ display: 'flex', gap: 6, padding: '0 16px 10px 58px' }}>
                            {course.user_has_rated ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => selectCourse(course)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    padding: '5px 12px', borderRadius: 7,
                                    background: 'rgba(0,103,71,0.10)',
                                    border: '1px solid rgba(0,103,71,0.25)',
                                    fontSize: 11, fontWeight: 700,
                                    color: GREEN,
                                    cursor: 'pointer',
                                  }}
                                >
                                  ✓ Played
                                </button>
                                <button
                                  type="button"
                                  onClick={() => selectCourse(course)}
                                  style={{
                                    padding: '5px 12px', borderRadius: 7,
                                    background: 'rgba(15,23,42,0.04)',
                                    border: '0.5px solid rgba(15,23,42,0.1)',
                                    fontSize: 11, fontWeight: 500,
                                    color: INK_SOFT,
                                    cursor: 'pointer',
                                  }}
                                >
                                  View course
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => selectCourse(course)}
                                  style={{
                                    padding: '5px 12px', borderRadius: 7,
                                    background: 'rgba(15,23,42,0.04)',
                                    border: '0.5px solid rgba(15,23,42,0.1)',
                                    fontSize: 11, fontWeight: 500,
                                    color: INK_SOFT,
                                    cursor: 'pointer',
                                  }}
                                >
                                  View course
                                </button>
                                <button
                                  type="button"
                                  onClick={() => selectCourseRate(course)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    padding: '5px 12px', borderRadius: 7,
                                    background: 'rgba(247,147,30,0.10)',
                                    border: '1px solid rgba(247,147,30,0.30)',
                                    fontSize: 11, fontWeight: 700,
                                    color: AMBER,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Star size={10} fill={AMBER} stroke={AMBER} />
                                  Rate
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* People */}
                  {showPeople && people.length > 0 && (
                    <div>
                      <SectionHeader label="People" />
                      {people.map(person => (
                        <button
                          key={person.id}
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
                              <p className="text-[14px] font-medium truncate" style={{ color: INK }}>{person.display_name}</p>
                              {person.verified && <BadgeCheck className="w-3.5 h-3.5 shrink-0" style={{ color: AMBER }} />}
                              {person.is_public === false && <Lock className="w-3 h-3 shrink-0" style={{ color: INK_SUBTLE }} />}
                            </div>
                            <p className="text-[12px] truncate" style={{ color: INK_SUBTLE }}>
                              {person.username && !person.username.includes('@')
                                ? `@${person.username}`
                                : ''}
                              {person.home_club_name
                                ? `${person.username && !person.username.includes('@') ? ' · ' : ''}${person.home_club_name}`
                                : ''}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Businesses */}
                  {showBusinesses && businesses.length > 0 && (
                    <div>
                      <SectionHeader label="Businesses" />
                      {businesses.map(business => (
                        <button
                          key={business.id}
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
                              <p className="text-[14px] font-medium truncate" style={{ color: INK }}>{business.name}</p>
                              {business.verified && <BadgeCheck className="w-3.5 h-3.5 shrink-0" style={{ color: AMBER }} />}
                            </div>
                            <p className="text-[12px] truncate" style={{ color: INK_SUBTLE }}>
                              {[business.city, business.country].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        </button>
                      ))}
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
                      <Search className="w-7 h-7" style={{ color: INK_SUBTLE }} />
                    </div>
                    <p className="text-[14px] font-medium" style={{ color: INK }}>
                      No results for "<span className="inline-block max-w-[180px] truncate align-bottom">{debouncedQuery}</span>"
                    </p>
                    <p className="text-[12px] text-center max-w-[280px]" style={{ color: INK_SUBTLE }}>
                      Try a different spelling, or search for a nearby course
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default memo(GlobalSearchOverlay);
