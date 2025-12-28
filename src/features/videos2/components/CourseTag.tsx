import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

type CourseTagProps = {
  course: string;
  courseSlug?: string;
  courseId?: string;
  size?: 'sm' | 'md';
};

export function CourseTag({ course, courseSlug, courseId, size = 'md' }: CourseTagProps) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  
  const courseIdentifier = courseSlug || courseId;
  const isClickable = !!courseIdentifier;
  
  const tagClasses = cn(
    `inline-flex items-center gap-1 ${padding} ${textSize} rounded-md font-medium transition-colors`,
    'bg-primary/10 text-primary',
    isClickable && 'hover:bg-primary/20 cursor-pointer'
  );
  
  const content = (
    <>
      <MapPin className={iconSize} />
      <span>{course}</span>
    </>
  );

  if (isClickable) {
    return (
      <Link
        to={`/courses/${courseIdentifier}`}
        className={tagClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </Link>
    );
  }

  return (
    <span className={tagClasses}>
      {content}
    </span>
  );
}
