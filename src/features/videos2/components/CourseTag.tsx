import React from 'react';

type CourseTagProps = {
  course: string;
  size?: 'sm' | 'md';
};

export function CourseTag({ course, size = 'md' }: CourseTagProps) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 ${padding} ${textSize} rounded-md bg-[#6e9277]/10 text-[#6e9277] font-medium`}
    >
      <span>📍</span>
      <span>{course}</span>
    </span>
  );
}
