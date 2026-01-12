import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Polished dark theme toaster with proper auto-dismiss timing
 * - Success toasts: 4 seconds
 * - Error toasts: 6 seconds (give user time to read)
 * - Info toasts: 4 seconds
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      visibleToasts={3}
      expand={false}
      position="top-center"
      toastOptions={{
        duration: 4000, // Default 4 seconds
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-slate-800/95 group-[.toaster]:text-white group-[.toaster]:border-slate-700 group-[.toaster]:shadow-2xl group-[.toaster]:backdrop-blur-sm group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-slate-400",
          actionButton:
            "group-[.toast]:bg-amber-500 group-[.toast]:text-slate-900 group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-slate-700/50 group-[.toast]:text-slate-300",
          success: 
            "group-[.toaster]:bg-emerald-900/90 group-[.toaster]:border-emerald-700 group-[.toaster]:text-white",
          error:
            "group-[.toaster]:bg-red-900/90 group-[.toaster]:border-red-700 group-[.toaster]:text-white",
          info:
            "group-[.toaster]:bg-slate-800/95 group-[.toaster]:border-slate-600 group-[.toaster]:text-white",
          warning:
            "group-[.toaster]:bg-amber-900/90 group-[.toaster]:border-amber-600 group-[.toaster]:text-white",
        },
      }}
      {...props}
    />
  )
}

// Helper functions for consistent toast styling
const styledToast = {
  success: (message: string, options?: Parameters<typeof toast.success>[1]) => 
    toast.success(message, { duration: 4000, ...options }),
  
  error: (message: string, options?: Parameters<typeof toast.error>[1]) => 
    toast.error(message, { duration: 6000, ...options }),
  
  info: (message: string, options?: Parameters<typeof toast>[1]) => 
    toast(message, { duration: 4000, ...options }),
  
  scheduled: (date: Date, options?: Parameters<typeof toast>[1]) => 
    toast(`Post scheduled for ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, {
      duration: 4000,
      icon: '📅',
      className: 'bg-amber-900/90 border-amber-600',
      ...options,
    }),
  
  posted: (options?: Parameters<typeof toast.success>[1]) => 
    toast.success('Posted ✓', {
      description: 'Now live on clbhouz',
      duration: 4000,
      ...options,
    }),
}

export { Toaster, toast, styledToast }