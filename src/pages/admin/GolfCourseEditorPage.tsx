import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import GolfCourseEditor from "@/components/admin/GolfCourseEditor";
import { GolfCourse } from "@/components/admin/golf-courses/types";
import { Loader2 } from "lucide-react";

export default function GolfCourseEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isCreating = !id;

  // Add beforeunload guard for unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      // Simple guard - in production you'd track isDirty state
      e.preventDefault();
      e.returnValue = "";
    };
    
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Fetch course data if editing
  const { data: course, isLoading } = useQuery({
    queryKey: ['golf-course', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('golf_courses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as GolfCourse;
    },
    enabled: !isCreating,
  });

  const handleClose = () => {
    navigate("/admin/golf-courses");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {!isCreating && isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-sm mx-auto px-4">
            <div className="h-12 w-12 rounded-full bg-surface-alt animate-pulse mx-auto mb-3"></div>
            <div className="h-4 w-32 bg-surface-alt animate-pulse mx-auto mb-2 rounded"></div>
            <div className="h-3 w-48 bg-surface-alt animate-pulse mx-auto rounded"></div>
          </div>
        </div>
      ) : (
        <GolfCourseEditor
          course={course || null}
          isCreating={isCreating}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
