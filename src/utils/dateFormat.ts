export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const posted = new Date(date);
  const diffInMs = now.getTime() - posted.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  // Today
  if (diffInDays === 0) {
    return 'Today';
  }
  
  // X days ago (1-6 days)
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  // Last week (7-13 days)
  if (diffInDays < 14) {
    return 'Last week';
  }
  
  // X weeks ago (2-4 weeks)
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 5) {
    return `${diffInWeeks} weeks ago`;
  }
  
  // Last month (30-59 days)
  if (diffInDays < 60) {
    return 'Last month';
  }
  
  // X months ago (2-11 months)
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} months ago`;
  }
  
  // X years ago
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
};
