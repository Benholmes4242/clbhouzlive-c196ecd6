
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type Course = {
  id: string;
  name: string;
  country: string;
  region: string;
  global_rank: number;
};

type UserCourse = {
  id: string;
  course_id: string;
  checked: boolean;
};

interface UseCourseTrackerEditProps {
  userId: string;
  open: boolean;
  onTrackerUpdate: () => void;
}

export const useCourseTrackerEdit = ({ userId, open, onTrackerUpdate }: UseCourseTrackerEditProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && userId) {
      fetchCourses();
      fetchUserCourses();
    }
  }, [open, userId]);

  async function fetchCourses() {
    setLoading(true);
    const { data, error } = await supabase
      .from("golf_courses")
      .select("id, name, country, region, global_rank")
      .not("global_rank", "is", null)
      .order("global_rank", { ascending: true })
      .limit(100);
    
    if (!error && data) {
      setCourses(data);
    }
    setLoading(false);
  }

  async function fetchUserCourses() {
    const { data, error } = await supabase
      .from("user_course_tracker")
      .select("id, course_id, checked")
      .eq("user_id", userId);
    
    if (!error && data) {
      setUserCourses(data);
    }
  }

  async function handleCourseToggle(courseId: string, checked: boolean) {
    console.log('Toggling course:', courseId, 'checked:', checked);
    
    const existingUserCourse = userCourses.find(uc => uc.course_id === courseId);
    
    if (existingUserCourse) {
      // Update existing record
      const { error } = await supabase
        .from("user_course_tracker")
        .update({ checked, updated_at: new Date().toISOString() })
        .eq("id", existingUserCourse.id);
      
      if (error) {
        console.error('Error updating course:', error);
        return;
      }
      
      setUserCourses(prev => 
        prev.map(uc => 
          uc.id === existingUserCourse.id 
            ? { ...uc, checked } 
            : uc
        )
      );
    } else {
      // Create new record
      const { data, error } = await supabase
        .from("user_course_tracker")
        .insert([{
          user_id: userId,
          course_id: courseId,
          checked
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating course record:', error);
        return;
      }
      
      if (data) {
        setUserCourses(prev => [...prev, data]);
      }
    }
    
    // Invalidate all relevant queries to ensure the tracker updates
    queryClient.invalidateQueries({ queryKey: ['trackerStats'] });
    queryClient.invalidateQueries({ queryKey: ['playedCourses'] });
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    
    // Call the update callback
    onTrackerUpdate();
    
    console.log('Course toggle completed, queries invalidated');
  }

  const isCoursePlayed = (courseId: string) => {
    return userCourses.find(uc => uc.course_id === courseId)?.checked || false;
  };

  return {
    courses,
    userCourses,
    loading,
    handleCourseToggle,
    isCoursePlayed
  };
};
