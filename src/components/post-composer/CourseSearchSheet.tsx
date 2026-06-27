// CourseSearchSheet — single-select course search (lifted from CourseTagPanel).
// Shared by Post-mode "Tag a course" chip and Review-mode course picker.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, MapPin, Flag, Check, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRateSuggestions } from '@/hooks/useRateSuggestions';
import type { NudgeCourse } from '@/hooks/useRateNudgeCourse';
import type { TaggedCourse } from './types';

interface CourseResult {
  id: string;
  name: string;
  country: string;
  region: string | null;
  global_rank: number | null;
}

interface CourseSearchSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (course: TaggedCourse) => void;
  title?: string;
  subtitle?: string;
  /**
   * Multi-select mode: stay open after select, show checks on already-tagged courses,
   * and render a "Done" button. Selecting a tagged course is a no-op.
   */
  multi?: boolean;
  /** Course IDs already tagged (shown as checked + non-selectable in multi mode). */
  excludedIds?: string[];
}

export function CourseSearchSheet({
  open,
  onClose,
  onSelect,
  title = 'Tag a course',
  subtitle = 'Where did you play?',
  multi = false,
  excludedIds,
}: CourseSearchSheetProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CourseResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // Anchor the sheet directly to the visualViewport so it sits in the same
  // compact band on first open AND on reopen. We compute a `top` (offset from
  // layout viewport top) and a `height` from visualViewport on every change.
  const [vvBox, setVvBox] = useState<{ top: number; height: number }>(() => ({
    top: 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const excludedSet = React.useMemo(() => new Set(excludedIds ?? []), [excludedIds]);

  // Resolve viewer id once on open so we can preload suggestions (played-unrated,
  // falling back to "try next" courses) in the empty state.
  const [userId, setUserId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUserId(data.user?.id);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);
  const { courses: suggestions, tier: suggestionsTier, loading: suggestionsLoading } =
    useRateSuggestions(userId, 8);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Track the visual viewport (keyboard + iOS layout-scroll). The sheet's top
  // and height are derived from this on every change.
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    const update = () => {
      if (vv) {
        setVvBox({ top: vv.offsetTop, height: vv.height });
      } else {
        setVvBox({ top: 0, height: window.innerHeight });
      }
    };
    update();
    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    }
    window.addEventListener('resize', update);

    // First-open safety net: some iOS/Median WebViews don't emit the initial
    // 'resize' when the keyboard animates in on first focus.
    const polls = [80, 180, 320, 500, 750].map((t) => setTimeout(update, t));

    return () => {
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      }
      window.removeEventListener('resize', update);
      polls.forEach(clearTimeout);
    };
  }, [open]);


  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('golf_courses')
          .select('id, name, country, region, global_rank')
          .ilike('name', `%${query}%`)
          .limit(20);
        if (!error && data) setResults(data as CourseResult[]);
      } catch (err) {
        console.error('[CourseSearchSheet]', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = useCallback(
    (course: CourseResult) => {
      if (excludedSet.has(course.id)) return;
      onSelect({
        courseId: course.id,
        courseName: course.name,
        country: course.country,
        region: course.region ?? undefined,
        globalRank: course.global_rank,
      });
      if (!multi) {
        setQuery('');
        setResults([]);
        onClose();
      }
    },
    [onSelect, onClose, multi, excludedSet]
  );

  const handleSelectSuggestion = useCallback(
    (s: NudgeCourse) => {
      if (excludedSet.has(s.courseId)) return;
      onSelect({
        courseId: s.courseId,
        courseName: s.name,
        region: s.region ?? undefined,
        globalRank: null,
      });
      if (!multi) {
        setQuery('');
        setResults([]);
        onClose();
      }
    },
    [onSelect, onClose, multi, excludedSet]
  );


  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[10000]"
        style={{ background: 'rgba(15,23,42,0.30)' }}
        onClick={onClose}
      />
      <div
        className="fixed inset-x-0 z-[10001] flex flex-col"
        style={{
          // Anchor the sheet to the visualViewport so it sits in the same
          // compact band on first open AND on reopen. No keyboard timing race.
          // Bottom edge is flush with the visualViewport bottom (no gap).
          top: vvBox.top + Math.max(vvBox.height * 0.22, 96),
          bottom: Math.max(
            (typeof window !== 'undefined' ? window.innerHeight : 0) -
              (vvBox.top + vvBox.height),
            0
          ),
          background: '#ffffff',
          borderRadius: '20px 20px 0 0',
          borderTop: '0.5px solid rgba(15,23,42,0.07)',
          boxShadow: '0 -4px 24px rgba(15,23,42,0.10)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
          transition: 'top 0.22s ease, bottom 0.22s ease',
        }}
      >

        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.15)' }} />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 flex items-start justify-between">
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: 'rgba(15,23,42,0.40)',
              }}
            >
              {title}
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: '#0F172A' }}>
              {subtitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(15,23,42,0.05)',
              border: '1px solid rgba(15,23,42,0.07)',
            }}
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" style={{ color: 'rgba(15,23,42,0.50)' }} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 pb-3">
          <div
            className="flex items-center gap-2.5"
            style={{
              background: 'rgba(15,23,42,0.04)',
              border: '1px solid rgba(15,23,42,0.08)',
              borderRadius: 14,
              padding: '11px 14px',
            }}
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: 'rgba(15,23,42,0.40)' }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search golf courses…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: '#0F172A', caretColor: '#F7931E' }}
            />
            {query.length > 0 && (
              <button onClick={() => setQuery('')} className="shrink-0" aria-label="Clear">
                <X className="w-3.5 h-3.5" style={{ color: 'rgba(15,23,42,0.35)' }} />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {!isSearching && query.length < 2 && (
            <>
              {suggestionsLoading && (
                <div className="pt-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 animate-pulse"
                      style={{
                        padding: '11px 0',
                        minHeight: 56,
                        borderBottom: i < 3 ? '0.5px solid rgba(15,23,42,0.07)' : 'none',
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: 'rgba(15,23,42,0.06)',
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          style={{
                            height: 12,
                            width: '60%',
                            borderRadius: 4,
                            background: 'rgba(15,23,42,0.08)',
                          }}
                        />
                        <div
                          style={{
                            height: 10,
                            width: '38%',
                            borderRadius: 4,
                            background: 'rgba(15,23,42,0.06)',
                            marginTop: 8,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!suggestionsLoading && suggestions.length > 0 && (
                <>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      color: 'rgba(15,23,42,0.40)',
                      paddingTop: 10,
                      paddingBottom: 6,
                    }}
                  >
                    {suggestionsTier === 'played' ? 'Played, not rated' : 'Suggested for you'}
                  </p>
                  {suggestions.map((s, i) => {
                    const alreadyTagged = excludedSet.has(s.courseId);
                    return (
                      <button
                        key={s.courseId}
                        onClick={() => handleSelectSuggestion(s)}
                        disabled={alreadyTagged}
                        className="w-full flex items-center gap-3"
                        style={{
                          padding: '11px 0',
                          minHeight: 56,
                          borderBottom:
                            i < suggestions.length - 1
                              ? '0.5px solid rgba(15,23,42,0.07)'
                              : 'none',
                          background: 'transparent',
                          border: 'none',
                          textAlign: 'left',
                          cursor: alreadyTagged ? 'default' : 'pointer',
                          opacity: alreadyTagged ? 0.55 : 1,
                        }}
                      >
                        <div
                          className="shrink-0 flex items-center justify-center overflow-hidden"
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: 'rgba(15,23,42,0.05)',
                            border: '1px solid rgba(15,23,42,0.08)',
                          }}
                        >
                          {s.thumbnail ? (
                            <img
                              src={s.thumbnail}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ fontSize: 16 }}>⛳</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: '#0F172A',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {s.name}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5 min-w-0">
                            <MapPin
                              className="w-3 h-3 shrink-0"
                              style={{ color: 'rgba(15,23,42,0.45)' }}
                              strokeWidth={1.5}
                            />
                            <p
                              style={{
                                fontSize: 12,
                                color: 'rgba(15,23,42,0.45)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {s.region ?? '—'}
                            </p>
                          </div>
                        </div>
                        {alreadyTagged ? (
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: '#16A34A',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Check size={13} strokeWidth={3} color="#fff" />
                          </span>
                        ) : s.tier === 'played' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '5px 9px 5px 11px',
                              borderRadius: 20,
                              flexShrink: 0,
                              background: 'rgba(247,147,30,0.12)',
                              border: '1px solid rgba(247,147,30,0.28)',
                              color: '#9A5B12',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Rate
                            <ChevronRight size={12} strokeWidth={2.5} />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </>
              )}

              {!suggestionsLoading && suggestions.length === 0 && (
                <div className="flex flex-col items-center text-center py-10">
                  <Flag
                    className="w-6 h-6 mb-2"
                    style={{ color: 'rgba(15,23,42,0.25)' }}
                    strokeWidth={1.5}
                  />
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(15,23,42,0.55)' }}>
                    Find your course
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(15,23,42,0.40)', marginTop: 4 }}>
                    Search by name, region or country
                  </p>
                </div>
              )}
            </>
          )}

          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <div
                className="w-5 h-5 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(15,23,42,0.12)', borderTopColor: '#F7931E' }}
              />
            </div>
          )}

          {!isSearching && results.length === 0 && query.length >= 2 && (
            <p className="text-center py-8" style={{ fontSize: 13, color: 'rgba(15,23,42,0.45)' }}>
              No courses found for &ldquo;{query}&rdquo;
            </p>
          )}

          {results.map((course, i) => {
            const alreadyTagged = excludedSet.has(course.id);
            return (
              <button
                key={course.id}
                onClick={() => handleSelect(course)}
                disabled={alreadyTagged}
                className="w-full flex items-center gap-3"
                style={{
                  padding: '11px 0',
                  minHeight: 56,
                  borderBottom: i < results.length - 1 ? '0.5px solid rgba(15,23,42,0.07)' : 'none',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: alreadyTagged ? 'default' : 'pointer',
                  opacity: alreadyTagged ? 0.55 : 1,
                }}
              >
                <div
                  className="shrink-0 flex items-center justify-center"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.18)',
                  }}
                >
                  <span style={{ fontSize: 16 }}>⛳</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#0F172A',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {course.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5 min-w-0">
                    <MapPin
                      className="w-3 h-3 shrink-0"
                      style={{ color: 'rgba(15,23,42,0.45)' }}
                      strokeWidth={1.5}
                    />
                    <p
                      style={{
                        fontSize: 12,
                        color: 'rgba(15,23,42,0.45)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {[course.region, course.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
                {alreadyTagged ? (
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#16A34A',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Check size={13} strokeWidth={3} color="#fff" />
                  </span>
                ) : course.global_rank != null ? (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '3px 7px',
                      borderRadius: 20,
                      flexShrink: 0,
                      background: 'rgba(15,23,42,0.06)',
                      border: '1px solid rgba(15,23,42,0.10)',
                      color: 'rgba(15,23,42,0.70)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Top 100
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {multi && (
          <div style={{ padding: '10px 16px 0', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                height: 46,
                borderRadius: 12,
                background: '#0F172A',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </>
  );
}
