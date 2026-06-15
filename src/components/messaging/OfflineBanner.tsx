 /**
  * OfflineBanner - Shows when connection is lost
  */
 
 import { useState, useEffect } from 'react';
 import { WifiOff } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 export function OfflineBanner() {
   const [isOffline, setIsOffline] = useState(!navigator.onLine);
 
   useEffect(() => {
     const handleOnline = () => setIsOffline(false);
     const handleOffline = () => setIsOffline(true);
 
     window.addEventListener('online', handleOnline);
     window.addEventListener('offline', handleOffline);
 
     return () => {
       window.removeEventListener('online', handleOnline);
       window.removeEventListener('offline', handleOffline);
     };
   }, []);
 
   if (!isOffline) return null;
 
   return (
     <div 
       className={cn(
         "fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 py-2 px-4",
         "bg-primary text-primary-foreground text-center text-sm font-medium",
         "flex items-center justify-center gap-2"
       )}
       style={{ top: 'var(--sat, 0px)' }}
     >
       <WifiOff className="w-4 h-4" />
       <span>Waiting for connection...</span>
     </div>
   );
 }