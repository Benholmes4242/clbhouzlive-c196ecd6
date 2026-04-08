// CourseTagPanel — Dark sheet with numbered amber pills, Top 100 badge, Done CTA
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Search, X, MapPin, Flag } from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import type { TaggedCourse } from '../types';

interface CourseResult { id: string; name: string; country: string; region: string | null; }

export function CourseTagPanel() {
  const { state, closePanel, setTaggedCourses } = usePostStudioContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CourseResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const dragControls = useDragControls();

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('golf_courses')
          .select('id, name, country, region')
          .ilike('name', `%${query}%`)
          .limit(20);
        if (!error && data) setResults(data as CourseResult[]);
      } catch (err) { console.error('[CourseTagPanel]', err); }
      finally { setIsSearching(false); }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = useCallback((course: CourseResult) => {
    if (state.taggedCourses.some((c) => c.courseId === course.id)) return;
    if (state.taggedCourses.length >= 5) { toast.error('Maximum 5 courses per post'); return; }
    const newCourse: TaggedCourse = {
      courseId: course.id, courseName: course.name,
      country: course.country, region: course.region ?? undefined,
    };
    setTaggedCourses([...state.taggedCourses, newCourse]);
  }, [state.taggedCourses, setTaggedCourses]);

  const handleRemove = useCallback((courseId: string) => {
    setTaggedCourses(state.taggedCourses.filter((c) => c.courseId !== courseId));
  }, [state.taggedCourses, setTaggedCourses]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-30"
        style={{ background: 'rgba(0,0,0,0.55)' }}
        onClick={closePanel}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', ...SPRING.panel }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={(_e, info) => {
          if (info.offset.y > 80 || info.velocity.y > 400) closePanel();
        }}
        className="absolute inset-x-0 bottom-0 z-40 flex flex-col"
        style={{
          maxHeight: '72%',
          background: '#161616',
          borderRadius: '20px 20px 0 0',
          borderTop: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 flex items-start justify-between">
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>
              Tag a course
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.92)' }}>
              Where did you play?
            </h3>
          </div>
          <button
            onClick={closePanel}
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}
          >
            <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.45)' }} strokeWidth={2.5} />
          </button>
        </div>

        {/* Tagged courses — amber numbered pills */}
        {state.taggedCourses.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 pb-3">
            {state.taggedCourses.map((course, i) => (
              <span key={course.courseId} className="inline-flex items-center gap-1.5" style={{
                padding: '5px 10px 5px 6px', borderRadius: 999,
                background: 'rgba(247,147,30,0.10)', border: '1px solid rgba(247,147,30,0.22)',
              }}>
                <span className="flex items-center justify-center" style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(247,147,30,0.15)',
                  fontSize: 11, fontWeight: 700, color: '#F7931E',
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.92)' }}>
                  {course.courseName}
                </span>
                <button
                  onClick={() => handleRemove(course.courseId)}
                  className="flex items-center justify-center"
                  style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}
                >
                  <X className="w-2 h-2" style={{ color: 'rgba(255,255,255,0.50)' }} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search input */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2.5" style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '11px 14px',
          }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.28)' }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search golf courses…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'rgba(255,255,255,0.92)', caretColor: '#F7931E' }}
            />
            {query.length > 0 && (
              <button onClick={() => setQuery('')} className="shrink-0">
                <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.30)' }} />
              </button>
            )}
          </div>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto px-5" style={{ scrollbarWidth: 'none' }}>
          {!isSearching && query.length < 2 && state.taggedCourses.length === 0 && (
            <div className="flex flex-col items-center text-center py-10">
              <Flag className="w-6 h-6 mb-2" style={{ color: 'rgba(255,255,255,0.20)' }} strokeWidth={1.5} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.50)' }}>Find your course</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 4 }}>Search by name, region or country</p>
            </div>
          )}

          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(255,255,255,0.10)', borderTopColor: 'transparent' }} />
            </div>
          )}

          {!isSearching && results.length === 0 && query.length >= 2 && (
            <p className="text-center py-8" style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)' }}>No courses found for &ldquo;{query}&rdquo;</p>
          )}

          {results.map((course, i) => {
            const isTagged = state.taggedCourses.some((c) => c.courseId === course.id);
            return (
              <div
                key={course.id}
                className="flex items-center gap-3"
                style={{
                  padding: '11px 0',
                  borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  opacity: isTagged ? 0.45 : 1,
                }}
              >
                {/* Course icon */}
                <div className="shrink-0 flex items-center justify-center" style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)',
                }}>
                  <span style={{ fontSize: 16 }}>⛳</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.92)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {course.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5 min-w-0">
                    <MapPin className="w-3 h-3 shrink-0" style={{ color: 'rgba(255,255,255,0.28)' }} strokeWidth={1.5} />
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[course.region, course.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>

                {/* Action */}
                {isTagged ? (
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>Added</span>
                ) : (
                  <button
                    onClick={() => handleSelect(course)}
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: '#F7931E',
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1 }}>+</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Done CTA */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '10px 20px 24px',
        }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={closePanel}
            className="w-full flex items-center justify-center"
            style={{
              background: '#F7931E', borderRadius: 16,
              fontSize: 15, fontWeight: 700, color: '#fff',
              minHeight: 48,
            }}
          >
            Done — {state.taggedCourses.length} course{state.taggedCourses.length !== 1 ? 's' : ''} tagged
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
