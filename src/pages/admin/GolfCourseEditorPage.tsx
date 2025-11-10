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

  // Loading state while fetching course data
  if (!isCreating && isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <GolfCourseEditor
        course={course || null}
        isCreating={isCreating}
        onClose={handleClose}
      />
    </div>
  );
}
