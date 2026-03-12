// CourseTagPanel — Golf course search, dark glass bottom sheet

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Search, X, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import type { TaggedCourse } from '../types';

const PANEL_STYLE: React.CSSProperties = {
  background: 'rgba(18,18,18,0.98)',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
};

const SEARCH_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
};

interface CourseResult { id: string; name: string; country: string; region: string | null; }

export function CourseTagPanel() {
  const { state, closePanel, setTaggedCourses } = usePostStudioContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CourseResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase.from('golf_courses').select('id, name, country, region').ilike('name', `%${query}%`).limit(20);
        if (!error && data) setResults(data as CourseResult[]);
      } catch (err) { console.error('[CourseTagPanel]', err); }
      finally { setIsSearching(false); }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = useCallback((course: CourseResult) => {
    if (state.taggedCourses.some((c) => c.courseId === course.id)) return;
    if (state.taggedCourses.length >= 5) { toast.error('Maximum 5 courses per post'); return; }
    const newCourse: TaggedCourse = { courseId: course.id, courseName: course.name, country: course.country, region: course.region ?? undefined };
    setTaggedCourses([...state.taggedCourses, newCourse]);
    closePanel();
  }, [state.taggedCourses, setTaggedCourses, closePanel]);

  const handleRemove = useCallback((courseId: string) => {
    setTaggedCourses(state.taggedCourses.filter((c) => c.courseId !== courseId));
  }, [state.taggedCourses, setTaggedCourses]);

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', ...SPRING.panel }} className="absolute inset-x-0 bottom-0 z-40 rounded-t-[24px] max-h-[70vh] flex flex-col" style={PANEL_STYLE}>
      <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.20)' }} /></div>

      <div className="flex items-center justify-between px-5 pb-3 pt-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: 'rgba(245,158,11,0.70)' }}>Tag a Course</p>
          <h3 className="text-base font-semibold text-white mt-0.5">Where did you play?</h3>
        </div>
        <button onClick={closePanel} className="w-11 h-11 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.60)' }} />
        </button>
      </div>

      {state.taggedCourses.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-3">
          {state.taggedCourses.map((course) => (
            <span key={course.courseId} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: 'rgba(245,158,11,0.15)', color: 'rgba(245,158,11,0.90)', border: '1px solid rgba(245,158,11,0.25)' }}>
              ⛳ {course.courseName}
              <button onClick={() => handleRemove(course.courseId)} className="w-4 h-4 flex items-center justify-center rounded-full" style={{ background: 'rgba(245,158,11,0.25)' }}>
                <X className="w-2.5 h-2.5" style={{ color: 'rgba(245,158,11,0.90)' }} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="px-5 pb-3">
        <div className="flex items-center gap-2.5 px-3.5 py-3" style={SEARCH_STYLE}>
          <Search className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search golf courses…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'rgba(255,255,255,0.85)', caretColor: '#f59e0b' }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6" style={{ scrollbarWidth: 'none' }}>
        {isSearching && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(245,158,11,0.30)', borderTopColor: 'transparent' }} />
          </div>
        )}
        {!isSearching && results.length === 0 && query.length >= 2 && (
          <p className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>No courses found for "{query}"</p>
        )}
        {results.map((course, i) => {
          const isTagged = state.taggedCourses.some((c) => c.courseId === course.id);
          return (
            <motion.button key={course.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => handleSelect(course)} disabled={isTagged} className="w-full flex items-center gap-3 py-3.5 min-h-[56px] disabled:opacity-40" style={{ borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.20)' }}>
                <span className="text-base">⛳</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-white truncate">{course.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" style={{ color: 'rgba(255,255,255,0.30)' }} strokeWidth={1.5} />
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.40)' }}>{[course.region, course.country].filter(Boolean).join(', ')}</p>
                </div>
              </div>
              {isTagged && <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: 'rgba(245,158,11,0.15)', color: 'rgba(245,158,11,0.80)' }}>Added</span>}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
