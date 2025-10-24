import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            className={variant === 'destructive' ? 'bg-red-600 text-white border-red-700' : ''}
          >
            <div className="grid gap-1">
              {title && <ToastTitle className={variant === 'destructive' ? 'text-white' : ''}>{title}</ToastTitle>}
              {description && (
                <ToastDescription className={variant === 'destructive' ? 'text-white opacity-100' : ''}>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
