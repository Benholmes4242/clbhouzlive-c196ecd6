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
            style={{
              background: variant === 'destructive' ? '#dc2626' : 'var(--bg-modal)',
              border: variant === 'destructive' ? '1px solid #991b1b' : '1px solid var(--border-hairline)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="grid gap-1">
              {title && <ToastTitle style={{ color: 'var(--text-primary)' }}>{title}</ToastTitle>}
              {description && (
                <ToastDescription style={{ color: variant === 'destructive' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{description}</ToastDescription>
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
