
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourseExplorer from './CourseExplorer';
import Top100Courses from './Top100Courses';
import CourseMapView from './CourseMapView';
import MyCourses from './MyCourses';
import CourseScraper from './CourseScraper';
import { Search, Trophy, Map, User, Download } from 'lucide-react';

const CoursesContent = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Golf Courses</h1>
        <p className="text-muted-foreground">Explore the world's greatest golf courses</p>
      </div>

      <Tabs defaultValue="explore" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto">
          <TabsTrigger value="explore" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Explore</span>
          </TabsTrigger>
          <TabsTrigger value="top100" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Top 100</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Map</span>
          </TabsTrigger>
          <TabsTrigger value="my-courses" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">My Courses</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="mt-6">
          <CourseExplorer />
        </TabsContent>
        
        <TabsContent value="top100" className="mt-6">
          <Top100Courses />
        </TabsContent>
        
        <TabsContent value="map" className="mt-6">
          <CourseMapView />
        </TabsContent>
        
        <TabsContent value="my-courses" className="mt-6">
          <MyCourses />
        </TabsContent>
        
        <TabsContent value="import" className="mt-6">
          <CourseScraper />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoursesContent;
