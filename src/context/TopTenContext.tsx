import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { isGuestUser } from "@/features/guest/useIsGuest";

export type Course = {
  id: string;
  name: string;
  country?: string;
  sub_country?: string;
  region?: string;
  thumbnail_image?: string;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
};

type TopTenContextType = {
  topTen: (Course | undefined)[];
  setTopTen: (next: (Course | undefined)[]) => void;
  addCourse: (course: Course, index?: number) => void;
  addCourseAtIndex: (course: Course, index: number) => void;
  moveCourse: (fromIndex: number, toIndex: number) => void;
  removeCourse: (index: number) => void;
  clearAll: () => void;
  isInTopTen: (courseId: string) => boolean;
  loading: boolean;
  error: string | null;
};

const TopTenContext = createContext<TopTenContextType | null>(null);

export const useTopTen = () => {
  const ctx = useContext(TopTenContext);
  if (!ctx) throw new Error("useTopTen must be used within TopTenProvider");
  return ctx;
};

const EMPTY10: (Course | undefined)[] = new Array(10).fill(undefined);

export const TopTenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [topTen, setTopTenState] = useState<(Course | undefined)[]>(EMPTY10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Persist only after the member actually changes the list. Loading the list
  // must never write it back — that upsert fired on every app open (and was
  // the write the guest guard rejected).
  const dirtyRef = useRef(false);
  // Load keyed on [userId, isGuest]: a guest keeps their id when they join, so
  // the flip alone must reload. A missing row is an empty list (maybeSingle).
  const { user: sessionUser } = useSupabaseSession();
  const loadUserId = sessionUser?.id ?? null;
  const loadIsGuest = isGuestUser(sessionUser);

  // --- Load from database on mount ---
  useEffect(() => {
    const loadTopTen = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.is_anonymous) {
          // No session, or a guest: nothing stored — an empty list.
          setTopTenState(EMPTY10);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_top_ten_lists')
          .select('courses')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error("TopTen load error:", error);
          setError("Failed to load Top 10");
        } else if (data?.courses && Array.isArray(data.courses)) {
          setTopTenState(data.courses as (Course | undefined)[]);
        }
      } catch (e: any) {
        setError("Failed to load Top 10");
        console.error("TopTen load error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadTopTen();
  }, [loadUserId, loadIsGuest]);

  // --- Persist (debounced) to database, only after a real change ---
  useEffect(() => {
    if (loading || !dirtyRef.current) return;

    const saveToDatabase = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // Guests never write.
        if (user.is_anonymous) return;

        const { error: saveError } = await supabase
          .from('user_top_ten_lists')
          .upsert({
            user_id: user.id,
            courses: topTen
          }, {
            onConflict: 'user_id'
          });
        if (!saveError) dirtyRef.current = false;
      } catch (e) {
        console.error("Failed to save Top 10:", e);
      }
    };

    const tid = setTimeout(saveToDatabase, 400);
    return () => clearTimeout(tid);
  }, [topTen, loading]);

  // Every member-initiated change goes through here so the dirty flag is set
  // in exactly one place; the load effect above uses setTopTenState directly.
  const applyTopTen = (next: (Course | undefined)[]) => {
    dirtyRef.current = true;
    setTopTenState(next);
  };

  const setTopTen = (next: (Course | undefined)[]) => {
    if (next.length !== 10) throw new Error("TopTen must have 10 slots");
    applyTopTen(next);
  };

  const isInTopTen = (courseId: string) => topTen.some((c) => c?.id === courseId);

  const addCourse = (course: Course, index?: number) => {
    if (isInTopTen(course.id)) return; // prevent dupes
    const copy = [...topTen];
    const targetIndex = typeof index === "number" ? index : copy.findIndex((s) => !s);
    if (targetIndex === -1) {
      // bar full — ignore
      return;
    }
    copy[targetIndex] = course;
    applyTopTen(copy);
  };

  const addCourseAtIndex = (course: Course, index: number) => {
    if (isInTopTen(course.id)) return; // prevent dupes
    const copy = [...topTen];
    copy[index] = course;
    applyTopTen(copy);
  };

  const moveCourse = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const copy = [...topTen];
    const item = copy[fromIndex];
    copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, item);
    // ensure length 10 (splice shifts); remove overflow at end
    copy.length = 10;
    applyTopTen(copy);
  };

  const removeCourse = (index: number) => {
    const copy = [...topTen];
    copy[index] = undefined;
    applyTopTen(copy);
  };

  const clearAll = () => applyTopTen(EMPTY10);

  const value = useMemo(
    () => ({
      topTen,
      setTopTen,
      addCourse,
      addCourseAtIndex,
      moveCourse,
      removeCourse,
      clearAll,
      isInTopTen,
      loading,
      error,
    }),
    [topTen, loading, error]
  );

  return <TopTenContext.Provider value={value}>{children}</TopTenContext.Provider>;
};