
import React from 'react';

interface CourseMapProps {
  latitude: number;
  longitude: number;
  courseName: string;
}

const CourseMap = ({ latitude, longitude, courseName }: CourseMapProps) => {
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dOWTgHz4TJlE7o&q=${latitude},${longitude}&zoom=15&maptype=satellite`;

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border">
      <iframe
        src={mapUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Map of ${courseName}`}
      />
    </div>
  );
};

export default CourseMap;
