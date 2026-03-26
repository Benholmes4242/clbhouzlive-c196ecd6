// CourseTagPanel — Golf course search, light glass bottom sheet
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Search, X, MapPin, Flag } from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, ICON_BG } from '../tokens';
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
        style={{ background: 'rgba(0,0,0,0.25)' }}
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
        className="absolute inset-x-0 bottom-0 z-40 rounded-t-[24px] max-h-[75vh] flex flex-col"
        style={{
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.12)' }} />
        </div>

        <div className="px-5 pb-3 shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] mb-0.5" style={{ color: TEXT_TERTIARY }}>
            Tag a Course
          </p>
          <h3 className="text-[17px] font-semibold tracking-tight" style={{ color: TEXT_PRIMARY }}>
            Where did you play?
          </h3>
        </div>

        {state.taggedCourses.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 pb-3">
            {state.taggedCourses.map((course) => (
              <span key={course.courseId} className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl font-semibold" style={{ background: 'rgba(0,0,0,0.04)', color: TEXT_PRIMARY, border: '1px solid rgba(0,0,0,0.08)' }}>
                ⛳ {course.courseName}
                <button onClick={() => handleRemove(course.courseId)} className="w-4 h-4 flex items-center justify-center rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
                  <X className="w-2.5 h-2.5" style={{ color: TEXT_SECONDARY }} strokeWidth={2.5} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="px-5 pb-3">
          <div className="flex items-center gap-2.5 px-3.5 py-3" style={{ background: '#F8FAFC', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14 }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: TEXT_TERTIARY }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search golf courses…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: TEXT_PRIMARY, caretColor: 'rgba(15,23,42,0.60)' }}
            />
            {query.length > 0 && (
              <button onClick={() => setQuery('')} className="shrink-0">
                <X className="w-3.5 h-3.5" style={{ color: TEXT_TERTIARY }} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6" style={{ scrollbarWidth: 'none' }}>
          {!isSearching && query.length < 2 && state.taggedCourses.length === 0 && (
            <div className="flex flex-col items-center text-center py-10">
              <Flag className="w-6 h-6 mb-2" style={{ color: TEXT_TERTIARY }} strokeWidth={1.5} />
              <p className="text-xs" style={{ color: TEXT_SECONDARY }}>Search for the course you played</p>
            </div>
          )}

          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(0,0,0,0.10)', borderTopColor: 'transparent' }} />
            </div>
          )}

          {!isSearching && results.length === 0 && query.length >= 2 && (
            <p className="text-center py-8 text-sm" style={{ color: TEXT_TERTIARY }}>No courses found for &ldquo;{query}&rdquo;</p>
          )}

          {results.map((course, i) => {
            const isTagged = state.taggedCourses.some((c) => c.courseId === course.id);
            return (
              <motion.button
                key={course.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleSelect(course)}
                disabled={isTagged}
                className="w-full flex items-center gap-3 py-3 min-h-[56px] disabled:opacity-40"
                style={{ borderBottom: i < results.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: ICON_BG, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <span className="text-base">⛳</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: TEXT_PRIMARY }}>{course.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" style={{ color: TEXT_TERTIARY }} strokeWidth={1.5} />
                    <p className="text-xs truncate" style={{ color: TEXT_SECONDARY }}>{[course.region, course.country].filter(Boolean).join(', ')}</p>
                  </div>
                </div>
                {isTagged && (
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: 'rgba(0,0,0,0.04)', color: TEXT_TERTIARY }}>Added</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
