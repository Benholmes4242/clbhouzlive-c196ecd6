import { Toaster as SonnerToaster } from 'sonner';
import { Check, AlertCircle, AlertTriangle } from 'lucide-react';

/** The one Toaster. GLASS_TOASTS_ONE_CONFIRMATION: unstyled Sonner with
 * classNames into src/styles/glassToast.css (ISLAND_GLASS material), so no
 * call site styles a toast and no Sonner colours, close button or rich
 * colours remain. Code outside BrowserRouter (toast actions) navigates via
 * src/lib/appNavigate.ts. Plain toast() shows no icon unless the caller passes one. */
export const Toaster = () => (
  <SonnerToaster
    visibleToasts={2}
    gap={8}
    toastOptions={{
      duration: 2500,
      unstyled: true,
      classNames: {
        toast: 'glass-toast',
        icon: 'glass-toast-icon',
        content: 'glass-toast-text',
        title: 'glass-toast-title',
        description: 'glass-toast-desc',
        actionButton: 'glass-toast-action',
        cancelButton: 'glass-toast-cancel',
      },
    }}
    icons={{
      success: <Check size={17} strokeWidth={2.2} />,
      error: <AlertCircle size={17} strokeWidth={1.9} />,
      warning: <AlertTriangle size={17} strokeWidth={1.9} />,
      info: null,
      loading: <span className="glass-spin" aria-hidden />,
    }}
  />
);

export default Toaster;
