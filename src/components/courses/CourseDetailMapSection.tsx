
import React from 'react';
import CourseMap from './CourseMap';

interface CourseDetailMapSectionProps {
  latitude?: number | null;
  longitude?: number | null;
  courseName: string;
}

const CourseDetailMapSection = ({ latitude, longitude, courseName }: CourseDetailMapSectionProps) => {
  if (!latitude || !longitude) return null;

  return (
    <div>
      <h3 className="font-semibold mb-3">Location</h3>
      <CourseMap
        latitude={latitude}
        longitude={longitude}
        courseName={courseName}
      />
    </div>
  );
};

export default CourseDetailMapSection;
