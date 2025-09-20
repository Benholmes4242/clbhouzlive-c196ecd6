import React, { useEffect, useState } from 'react';

export const AnnouncementRegion: React.FC = () => {
  const [announcement, setAnnouncement] = useState<string>('');

  useEffect(() => {
    const handlePostSuccess = () => {
      setAnnouncement('Moment posted. Returning to Discover.');
      // Clear announcement after it's been read
      setTimeout(() => setAnnouncement(''), 1000);
    };

    window.addEventListener('postCompleted', handlePostSuccess);
    return () => window.removeEventListener('postCompleted', handlePostSuccess);
  }, []);

  return (
    <div 
      aria-live="polite" 
      aria-atomic="true" 
      className="sr-only"
    >
      {announcement}
    </div>
  );
};