import { toast } from "sonner";

/**
 * Single-toast helper that dismisses any existing toast before showing a new one.
 * Ensures only one toast is ever visible at a time.
 */
export function toastSingle(message: string, opts?: Parameters<typeof toast>[1]) {
  toast.dismiss();
  return toast(message, opts);
}

toastSingle.success = (message: string, opts?: Parameters<typeof toast.success>[1]) => {
  toast.dismiss();
  return toast.success(message, opts);
};

toastSingle.error = (message: string, opts?: Parameters<typeof toast.error>[1]) => {
  toast.dismiss();
  return toast.error(message, opts);
};

toastSingle.info = (message: string, opts?: Parameters<typeof toast.info>[1]) => {
  toast.dismiss();
  return toast.info(message, opts);
};

toastSingle.warning = (message: string, opts?: Parameters<typeof toast.warning>[1]) => {
  toast.dismiss();
  return toast.warning(message, opts);
};
