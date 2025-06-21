
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourseExplorer from './CourseExplorer';
import MyCourses from './MyCourses';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';

const CoursesContent = () => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('explore');

  const handleMyCoursesClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setActiveTab('my-courses');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Golf Courses</h1>
        <p className="text-muted-foreground">
          Top 100 Courses. One Epic Checklist.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="explore">Explore</TabsTrigger>
          <TabsTrigger value="my-courses" onClick={handleMyCoursesClick}>My Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="mt-6">
          <CourseExplorer />
        </TabsContent>

        <TabsContent value="my-courses" className="mt-6">
          {user ? (
            <MyCourses />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Sign in to track your courses</h3>
                <p className="text-muted-foreground mb-4">
                  Create an account to track which courses you've played and manage your golf journey
                </p>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="text-white hover:opacity-90"
                  style={{ backgroundColor: '#322F30' }}
                >
                  Sign In
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoursesContent;
