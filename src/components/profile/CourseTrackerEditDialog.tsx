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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Search } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");

  const courseCategories = [
    { key: 'gbi', label: 'GB & Ireland', regions: ['England', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland'] },
    { key: 'europe', label: 'Europe', regions: ['Europe'] },
    { key: 'usa', label: 'USA', regions: ['USA'] },
    { key: 'global', label: 'Global', regions: [] } // Global includes all
  ];

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

  const getCoursesForCategory = (categoryKey: string) => {
    if (categoryKey === 'global') {
      return courses; // Global shows all courses
    }
    
    const category = courseCategories.find(cat => cat.key === categoryKey);
    if (!category) return [];
    
    return courses.filter(course => {
      if (categoryKey === 'gbi') {
        return category.regions.some(region => 
          course.country.toLowerCase().includes(region.toLowerCase()) ||
          course.region?.toLowerCase().includes(region.toLowerCase())
        );
      }
      if (categoryKey === 'europe') {
        // Exclude GB&I countries from Europe
        const gbiRegions = ['England', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland'];
        const isGBI = gbiRegions.some(region => 
          course.country.toLowerCase().includes(region.toLowerCase()) ||
          course.region?.toLowerCase().includes(region.toLowerCase())
        );
        return !isGBI && (
          course.region?.toLowerCase().includes('europe') ||
          course.country.toLowerCase().includes('europe')
        );
      }
      if (categoryKey === 'usa') {
        return course.country.toLowerCase().includes('usa') ||
               course.country.toLowerCase().includes('united states');
      }
      return false;
    });
  };

  const getFilteredCourses = (categoryKey: string) => {
    const categoryCourses = getCoursesForCategory(categoryKey);
    
    if (!searchQuery.trim()) {
      return categoryCourses;
    }
    
    return categoryCourses.filter(course =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="w-4 h-4" />
          Edit Courses
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Top 100 Courses Played</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-8 text-center">Loading courses...</div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Tabs defaultValue="gbi" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {courseCategories.map(category => (
                  <TabsTrigger key={category.key} value={category.key} className="text-xs">
                    {category.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {courseCategories.map(category => (
                <TabsContent key={category.key} value={category.key} className="mt-4">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getFilteredCourses(category.key).map(course => (
                      <div 
                        key={course.id} 
                        className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleCourseToggle(course.id, !isCoursePlayed(course.id))}
                      >
                        <Checkbox
                          id={`course-${course.id}`}
                          checked={isCoursePlayed(course.id)}
                          onCheckedChange={(checked) => 
                            handleCourseToggle(course.id, checked as boolean)
                          }
                          onClick={(e) => e.stopPropagation()}
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
                    {getFilteredCourses(category.key).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery.trim() ? `No courses found matching "${searchQuery}"` : `No courses found for ${category.label}`}
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CourseTrackerEditDialog;
