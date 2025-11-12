/**
 * Date formatting utilities
 */

export const formatShortWhen = (d?: string | Date): string => {
  if (!d) return '';
  
  try {
    return new Intl.DateTimeFormat(undefined, { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    }).format(new Date(d));
  } catch {
    return '';
  }
};

export const formatSmartWhen = (d?: string | Date): string => {
  if (!d) return '';
  
  try {
    const date = new Date(d);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    const isThisWeek = diff < 7 && date > yesterday;

    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today • ${time}`;
    if (isYesterday) return `Yesterday • ${time}`;
    if (isThisWeek) {
      return `${date.toLocaleDateString([], { weekday: 'short' })} • ${time}`;
    }
    
    return `${date.toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })} • ${time}`;
  } catch {
    return '';
  }
};
