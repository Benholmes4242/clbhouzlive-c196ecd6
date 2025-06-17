
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";

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
  played: boolean;
};

interface CourseTrackerEditDialogProps {
  userId: string;
  onTrackerUpdate: () => void;
}

const CourseTrackerEditDialog: React.FC<CourseTrackerEditDialogProps> = ({ 
  userId, 
  onTrackerUpdate 
}) => {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [loading, setLoading] = useState(false);

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
      .from("user_courses")
      .select("id, course_id, played")
      .eq("user_id", userId);
    
    if (!error && data) {
      setUserCourses(data);
    }
  }

  async function handleCourseToggle(courseId: string, played: boolean) {
    const existingUserCourse = userCourses.find(uc => uc.course_id === courseId);
    
    if (existingUserCourse) {
      // Update existing record
      await supabase
        .from("user_courses")
        .update({ played, updated_at: new Date().toISOString() })
        .eq("id", existingUserCourse.id);
      
      setUserCourses(prev => 
        prev.map(uc => 
          uc.id === existingUserCourse.id 
            ? { ...uc, played } 
            : uc
        )
      );
    } else {
      // Create new record
      const { data } = await supabase
        .from("user_courses")
        .insert([{
          user_id: userId,
          course_id: courseId,
          played
        }])
        .select()
        .single();
      
      if (data) {
        setUserCourses(prev => [...prev, data]);
      }
    }
    
    onTrackerUpdate();
  }

  const isCoursePlayed = (courseId: string) => {
    return userCourses.find(uc => uc.course_id === courseId)?.played || false;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="w-4 h-4" />
          Edit Courses
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Top 100 Courses Played</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-8 text-center">Loading courses...</div>
        ) : (
          <div className="space-y-3 py-4">
            {courses.map(course => (
              <div key={course.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={`course-${course.id}`}
                  checked={isCoursePlayed(course.id)}
                  onCheckedChange={(checked) => 
                    handleCourseToggle(course.id, checked as boolean)
                  }
                />
                <div className="flex-1">
                  <Label 
                    htmlFor={`course-${course.id}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    #{course.global_rank} {course.name}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {course.region}, {course.country}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CourseTrackerEditDialog;
