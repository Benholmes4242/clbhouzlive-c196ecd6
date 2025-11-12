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

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  return d.toLocaleString('en-US', options);
};

export const formatLikes = (n: number): string => {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};

export const formatMessageTime = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();

  const sameDay = d.toDateString() === now.toDateString();
  const y = d.getFullYear();
  const optsTime: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

  if (sameDay) return `Today · ${d.toLocaleTimeString([], optsTime)}`;

  const optsDate: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
  const base = d.toLocaleDateString([], optsDate);
  if (y !== now.getFullYear()) return `${base} ${y} · ${d.toLocaleTimeString([], optsTime)}`;
  return `${base} · ${d.toLocaleTimeString([], optsTime)}`;
};
