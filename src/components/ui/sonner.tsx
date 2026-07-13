import { Toaster as SonnerToaster } from 'sonner';

export const Toaster = () => (
  <SonnerToaster
    visibleToasts={2}
    gap={8}
    toastOptions={{ duration: 2500 }}
  />
);

export default Toaster;
