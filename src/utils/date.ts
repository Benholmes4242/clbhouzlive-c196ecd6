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
