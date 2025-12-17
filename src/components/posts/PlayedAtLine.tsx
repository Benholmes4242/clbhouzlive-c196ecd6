import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';

interface PlayedAtLineProps {
  courseId?: string | null;
  courseName?: string | null;
  regionText?: string | null;
  className?: string;
}

/**
 * Renders the "📍 Played at [Course Name], [Region]" line
 * Course name is bold and clickable (navigates to /courses/:id)
 * Everything else is normal text
 */
const PlayedAtLine: React.FC<PlayedAtLineProps> = ({
  courseId,
  courseName,
  regionText,
  className = ''
}) => {
  const navigate = useNavigate();

  if (!courseName) return null;

  const handleCourseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (courseId) {
      navigate(`/courses/${courseId}`);
    }
  };

  const isClickable = !!courseId;

  return (
    <div className={`flex items-center gap-1.5 text-sm text-muted-foreground ${className}`}>
      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
      <span>Played at </span>
      {isClickable ? (
        <button
          type="button"
          onClick={handleCourseClick}
          className="font-medium text-foreground hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm"
        >
          {courseName}
        </button>
      ) : (
        <span className="font-medium text-foreground">{courseName}</span>
      )}
      {regionText && (
        <>
          <span>,</span>
          <span>{regionText}</span>
        </>
      )}
    </div>
  );
};

export default PlayedAtLine;
