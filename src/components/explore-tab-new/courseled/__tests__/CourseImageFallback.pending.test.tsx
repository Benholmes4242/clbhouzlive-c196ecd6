import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseImageFallback } from '../CourseImageFallback';

describe('CourseImageFallback pending (BRIEF_COURSES_SKELETONS_4A)', () => {
  it('keeps the overlay name visible while the photo is pending', () => {
    const { container } = render(
      <CourseImageFallback courseId="c1" courseName="Royal Dornoch" imageUrl="https://x/y.jpg" pending>
        <div>Royal Dornoch</div>
      </CourseImageFallback>,
    );
    expect(screen.getByText('Royal Dornoch')).toBeTruthy();
    expect(container.querySelector('.clb-shimmer-dark')).not.toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });
});
