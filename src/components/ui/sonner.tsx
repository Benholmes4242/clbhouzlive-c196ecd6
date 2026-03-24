import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Unified dark-glass toaster for Clbhouz
 * - All types share the same dark frosted base
 * - Only the icon color changes per type (amber/red/orange/blue)
 * - 3s default duration, max 2 visible
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      duration={3000}
      visibleToasts={2}
      expand={false}
      style={{ '--offset': 'calc(var(--sat, 47px) + 12px)' } as React.CSSProperties}
      toastOptions={{
        className: 'clbhouz-toast',
        style: {
          background: 'rgba(28, 28, 30, 0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        },
        classNames: {
          description: "text-slate-400 text-[13px]",
          actionButton: "bg-amber-500 text-slate-900 font-medium",
          cancelButton: "bg-slate-700/50 text-slate-300",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
