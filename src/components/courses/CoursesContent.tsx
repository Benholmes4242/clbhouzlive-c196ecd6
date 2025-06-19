
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourseExplorer from './CourseExplorer';
import MyCourses from './MyCourses';
import CourseScraper from './CourseScraper';
import BulkCourseImporter from './BulkCourseImporter';
import ExcelCourseImporter from './ExcelCourseImporter';

const CoursesContent = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Golf Courses</h1>
        <p className="text-muted-foreground">
          Discover and track the world's greatest golf courses
        </p>
      </div>

      <Tabs defaultValue="explore" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="explore">Explore</TabsTrigger>
          <TabsTrigger value="my-courses">My Courses</TabsTrigger>
          <TabsTrigger value="scraper">Web Scraper</TabsTrigger>
          <TabsTrigger value="bulk-import">Bulk Import</TabsTrigger>
          <TabsTrigger value="excel-import">Excel Import</TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="mt-6">
          <CourseExplorer />
        </TabsContent>

        <TabsContent value="my-courses" className="mt-6">
          <MyCourses />
        </TabsContent>

        <TabsContent value="scraper" className="mt-6">
          <CourseScraper />
        </TabsContent>

        <TabsContent value="bulk-import" className="mt-6">
          <BulkCourseImporter />
        </TabsContent>

        <TabsContent value="excel-import" className="mt-6">
          <ExcelCourseImporter />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoursesContent;
