/**
 * Date formatting helpers for game cards
 */

export const fmtDateTime = (iso?: string | null) =>
  iso 
    ? new Date(iso).toLocaleString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit' 
      }) 
    : '';

export const fmtExpires = (iso?: string | null) => {
  if (!iso) return '';
  const expiresDate = new Date(iso);
  const now = new Date();
  const hoursUntilExpiry = Math.round((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  
  if (hoursUntilExpiry < 1) {
    return 'Expires soon';
  } else if (hoursUntilExpiry < 24) {
    return `Expires in ${hoursUntilExpiry}h`;
  } else {
    const days = Math.floor(hoursUntilExpiry / 24);
    return `Expires in ${days}d`;
  }
};
