import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  // --- Load from database on mount ---
  useEffect(() => {
    const loadTopTen = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
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
  }, []);

  // --- Persist (debounced) to database ---
  useEffect(() => {
    if (loading) return;
    
    const saveToDatabase = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from('user_top_ten_lists')
          .upsert({
            user_id: user.id,
            courses: topTen
          }, {
            onConflict: 'user_id'
          });
      } catch (e) {
        console.error("Failed to save Top 10:", e);
      }
    };

    const tid = setTimeout(saveToDatabase, 400);
    return () => clearTimeout(tid);
  }, [topTen, loading]);

  const setTopTen = (next: (Course | undefined)[]) => {
    if (next.length !== 10) throw new Error("TopTen must have 10 slots");
    setTopTenState(next);
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
    setTopTenState(copy);
  };

  const addCourseAtIndex = (course: Course, index: number) => {
    if (isInTopTen(course.id)) return; // prevent dupes
    const copy = [...topTen];
    copy[index] = course;
    setTopTenState(copy);
  };

  const moveCourse = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const copy = [...topTen];
    const item = copy[fromIndex];
    copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, item);
    // ensure length 10 (splice shifts); remove overflow at end
    copy.length = 10;
    setTopTenState(copy);
  };

  const removeCourse = (index: number) => {
    const copy = [...topTen];
    copy[index] = undefined;
    setTopTenState(copy);
  };

  const clearAll = () => setTopTenState(EMPTY10);

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