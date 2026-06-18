import { BIZ } from '@/components/business/businessTokens';

export const INPUT_CLASS =
  'w-full rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F7931E]/40 transition-colors';
export const INPUT_STYLE = { background: '#ffffff', border: `1px solid ${BIZ.hair}` };
export const LOCKED_CLASS =
  'flex items-center gap-2 rounded-xl px-4 py-3 text-[15px] text-muted-foreground';
export const LOCKED_STYLE = {
  background: 'rgba(15,23,42,0.03)',
  border: `0.5px solid ${BIZ.hair}`,
};
export const LABEL_CLASS = 'text-[13px] font-medium text-muted-foreground';
export const HINT_CLASS = 'text-[12px] text-muted-foreground mt-1';
