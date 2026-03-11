// CourseTagPanel — Golf course search and tag bottom sheet

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import type { TaggedCourse } from '../types';

interface CourseResult {
  id: string;
  name: string;
  country: string;
  region: string | null;
}

export function CourseTagPanel() {
  const { state, closePanel, setTaggedCourses } = usePostStudioContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CourseResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Search courses
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
          .select('id, name, country, region')
          .ilike('name', `%${query}%`)
          .limit(20);

        if (!error && data) {
          setResults(data as CourseResult[]);
        }
      } catch (err) {
        console.error('[CourseTagPanel] search error:', err);
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
      // Don't add duplicates
      if (state.taggedCourses.some((c) => c.courseId === course.id)) return;

      const newCourse: TaggedCourse = {
        courseId: course.id,
        courseName: course.name,
        country: course.country,
        region: course.region ?? undefined,
      };

      setTaggedCourses([...state.taggedCourses, newCourse]);
      closePanel();
    },
    [state.taggedCourses, setTaggedCourses, closePanel]
  );

  const handleRemove = useCallback(
    (courseId: string) => {
      setTaggedCourses(state.taggedCourses.filter((c) => c.courseId !== courseId));
    },
    [state.taggedCourses, setTaggedCourses]
  );

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', ...SPRING.panel }}
      className="absolute inset-x-0 bottom-0 z-40 bg-background rounded-t-[20px] border-t border-border/50 backdrop-blur-xl max-h-[60vh] flex flex-col"
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2">
        <h3 className="text-sm font-semibold text-foreground">Tag a Course</h3>
        <button onClick={closePanel} className="w-11 h-11 flex items-center justify-center">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Tagged courses */}
      {state.taggedCourses.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {state.taggedCourses.map((course) => (
            <span
              key={course.courseId}
              className="inline-flex items-center gap-1 bg-primary/15 text-primary text-xs px-2.5 py-1 rounded-full"
            >
              ⛳ {course.courseName}
              <button
                onClick={() => handleRemove(course.courseId)}
                className="w-4 h-4 flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses…"
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isSearching && (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {!isSearching && results.length === 0 && query.length >= 2 && (
          <p className="text-center text-muted-foreground text-sm py-6">No courses found</p>
        )}

        {results.map((course) => {
          const isTagged = state.taggedCourses.some((c) => c.courseId === course.id);
          return (
            <button
              key={course.id}
              onClick={() => handleSelect(course)}
              disabled={isTagged}
              className="w-full flex items-center gap-3 py-3 border-b border-border/30 last:border-0 min-h-[52px] disabled:opacity-40"
            >
              <div className="w-10 h-10 rounded-xl bg-muted shrink-0 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-foreground text-sm font-medium">{course.name}</p>
                <p className="text-muted-foreground text-xs">
                  {[course.region, course.country].filter(Boolean).join(', ')}
                </p>
              </div>
              {isTagged && (
                <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Added
                </span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
