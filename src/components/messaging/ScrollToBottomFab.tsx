 /**
  * ScrollToBottomFab - Floating action button to scroll to bottom of chat
  */
 
 import { ChevronDown } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface ScrollToBottomFabProps {
   onClick: () => void;
   unreadCount?: number;
   className?: string;
 }
 
 export function ScrollToBottomFab({ onClick, unreadCount = 0, className }: ScrollToBottomFabProps) {
   return (
     <button
       onClick={onClick}
      className={cn(
        "w-10 h-10 bg-background rounded-full shadow-lg flex items-center justify-center z-20",
        "active:scale-95 transition-transform hover:bg-muted",
        className
      )}
    >
      <ChevronDown className="w-5 h-5 text-foreground" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center">
           {unreadCount > 99 ? '99+' : unreadCount}
         </span>
       )}
     </button>
   );
 }