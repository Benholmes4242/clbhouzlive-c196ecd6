/** Shared icon color theme for settings rows (Direction A: neutral slate, green for privacy, red for danger). */
export type IconTheme = 'account' | 'creator' | 'privacy' | 'notifications' | 'security' | 'support' | 'legal' | 'danger' | 'default';

// Direction A: no amber. Neutral slate tiles for normal rows; green for privacy
// status; red for danger. Icons render as ink_60 on a slate field tile.
export const iconThemeStyles: Record<IconTheme, { bg: string; text: string }> = {
  account:       { bg: 'bg-[#F8FAFC] border border-[rgba(15,23,42,0.06)]', text: 'text-[#475569]' },
  creator:       { bg: 'bg-[#F8FAFC] border border-[rgba(15,23,42,0.06)]', text: 'text-[#475569]' },
  privacy:       { bg: 'bg-[rgba(5,150,105,0.08)]',                        text: 'text-[#059669]' },
  notifications: { bg: 'bg-[#F8FAFC] border border-[rgba(15,23,42,0.06)]', text: 'text-[#475569]' },
  security:      { bg: 'bg-[rgba(220,38,38,0.08)]',                        text: 'text-[#DC2626]' },
  support:       { bg: 'bg-[#F8FAFC] border border-[rgba(15,23,42,0.06)]', text: 'text-[#475569]' },
  legal:         { bg: 'bg-[#F8FAFC] border border-[rgba(15,23,42,0.06)]', text: 'text-[#475569]' },
  danger:        { bg: 'bg-[rgba(220,38,38,0.08)]',                        text: 'text-[#DC2626]' },
  default:       { bg: 'bg-[#F8FAFC] border border-[rgba(15,23,42,0.06)]', text: 'text-[#475569]' },
};
