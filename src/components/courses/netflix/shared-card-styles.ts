// Shared width classes for ALL course-card rows on the Courses tab
// Based on Recently Played's current sizing with added 2xl breakpoint for 5.5 cards in view
export const COURSE_CARD_WIDTH_CLASSES = [
  // Mobile — same as Recently Played (gives ~2.1 in view)
  'w-[calc(40%-0.5rem)]',
  'sm:w-[calc(40%-0.5rem)]',
  
  // Tablet / small laptop 
  'md:w-[calc(50%-0.75rem)]',      // ~2 in view
  'lg:w-[calc(33.333%-1rem)]',     // ~3 in view  
  'xl:w-[calc(25%-1.125rem)]',     // ~4 in view
  
  // NEW: Desktop wide — target 5.5 cards in view
  // 100 / 5.5 = 18.18%  
  '2xl:w-[calc(18.18%-1.125rem)]', // ~5.5 in view
].join(' ');