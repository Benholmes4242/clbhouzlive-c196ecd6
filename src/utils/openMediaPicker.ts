/**
 * Open the native media picker with loading state callbacks
 * 
 * @param onFiles - Callback when files are selected
 * @param max - Maximum number of files to allow
 * @param onPickerStateChange - Optional callback for loading state (true = picker open, false = closed)
 */
export async function openMediaPicker(
  onFiles: (files: File[]) => void, 
  max = 6,
  onPickerStateChange?: (isOpen: boolean) => void
) {
  // Notify picker is opening
  onPickerStateChange?.(true);

  // Prefer showOpenFilePicker when available (desktop), but fallback to input for iOS
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const canUseOPF = 'showOpenFilePicker' in window && !isIOS;

  if (canUseOPF) {
    try {
      // @ts-ignore
      const handles = await window.showOpenFilePicker({
        multiple: true,
        excludeAcceptAllOption: false,
        types: [
          {
            description: 'Media',
            accept: {
              'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'],
              'video/*': ['.mp4', '.mov', '.webm'],
            },
          },
        ],
      });
      const files = await Promise.all(handles.map((h: any) => h.getFile()));
      onPickerStateChange?.(false);
      onFiles(files.slice(0, max));
      return;
    } catch {
      // User canceled
      onPickerStateChange?.(false);
      return;
    }
  }

  // iOS & fallback path: use <input type="file">
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';
  input.multiple = true;

  // IMPORTANT: never set or propagate 'capture' or it will open camera
  input.removeAttribute('capture');

  input.style.display = 'none';
  document.body.appendChild(input);

  // Track if we've handled the result
  let handled = false;

  const cleanup = () => {
    if (document.body.contains(input)) {
      document.body.removeChild(input);
    }
  };

  input.addEventListener('change', () => {
    if (handled) return;
    handled = true;
    
    const files = Array.from(input.files ?? []).slice(0, max);
    onPickerStateChange?.(false);
    onFiles(files);
    cleanup();
  });

  // Handle cancel via oncancel (modern browsers)
  input.addEventListener('cancel', () => {
    if (handled) return;
    handled = true;
    onPickerStateChange?.(false);
    cleanup();
  });

  // Fallback: detect cancel via window focus (older browsers/iOS)
  const handleWindowFocus = () => {
    // Give the change event a chance to fire first
    setTimeout(() => {
      if (!handled && (!input.files || input.files.length === 0)) {
        handled = true;
        onPickerStateChange?.(false);
        cleanup();
      }
      window.removeEventListener('focus', handleWindowFocus);
    }, 500);
  };
  window.addEventListener('focus', handleWindowFocus);

  input.click();
}