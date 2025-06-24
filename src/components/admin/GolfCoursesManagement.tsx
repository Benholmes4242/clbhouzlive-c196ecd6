
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, MapPin, Globe, Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GolfCourseEditor from './GolfCourseEditor';

interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region: string;
  continent: string;
  global_rank: number | null;
  regional_rank: number | null;
  description: string | null;
  thumbnail_image: string | null;
  website_url: string | null;
}

const GolfCoursesManagement = () => {
  const { toast } = useToast();
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data: courses, isLoading, refetch } = useQuery({
    queryKey: ['admin-golf-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('*')
        .order('global_rank', { ascending: true, nullsLast: true });

      if (error) throw error;
      return data as GolfCourse[];
    },
  });

  const regionMapping = {
    'all': 'All Regions',
    'britain-ireland': 'Britain & Ireland',
    'europe': 'Europe',
    'usa': 'USA',
    'worldwide': 'Worldwide'
  };

  const filterCoursesByRegion = (courses: GolfCourse[]) => {
    if (!courses) return [];
    
    let filtered = courses;

    // Filter by region
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(course => {
        switch (selectedRegion) {
          case 'britain-ireland':
            return course.country === 'United Kingdom' || course.country === 'Ireland';
          case 'europe':
            return course.continent === 'Europe' && course.country !== 'United Kingdom' && course.country !== 'Ireland';
          case 'usa':
            return course.country === 'United States';
          case 'worldwide':
            return course.continent !== 'Europe' && course.country !== 'United States';
          default:
            return true;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const handleEditCourse = (course: GolfCourse) => {
    setSelectedCourse(course);
    setIsCreating(false);
    setIsEditorOpen(true);
  };

  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setIsCreating(true);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedCourse(null);
    setIsCreating(false);
    refetch();
  };

  const filteredCourses = filterCoursesByRegion(courses || []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Golf Courses Management</h2>
            <p className="text-muted-foreground">Manage golf courses and their information</p>
          </div>
          <Button onClick={handleCreateCourse} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Golf Club
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search golf courses by name or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(regionMapping).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4">
          {filteredCourses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? "No courses match your search criteria."
                    : "No courses found in the selected region."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {course.thumbnail_image ? (
                          <img
                            src={course.thumbnail_image}
                            alt={course.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{course.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Flag className="h-3 w-3" />
                          <span>{course.country}</span>
                          {course.region && (
                            <>
                              <span>•</span>
                              <span>{course.region}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          {course.global_rank && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Global Rank: #{course.global_rank}
                            </span>
                          )}
                          {course.regional_rank && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Regional Rank: #{course.regional_rank}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleEditCourse(course)}
                    >
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {isEditorOpen && (
        <GolfCourseEditor
          course={selectedCourse}
          isCreating={isCreating}
          onClose={handleCloseEditor}
        />
      )}
    </>
  );
};

export default GolfCoursesManagement;
