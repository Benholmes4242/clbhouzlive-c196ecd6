export async function openMediaPicker(onFiles: (files: File[]) => void, max = 10) {
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
      onFiles(files.slice(0, max));
      return;
    } catch {/* user canceled */}
  }

  // iOS & fallback path: use <input type="file">
  // CRUCIAL: Append to document.body with off-screen positioning to center the iOS picker
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';
  input.multiple = true;

  // IMPORTANT: never set or propagate 'capture' or it will open camera
  input.removeAttribute('capture');

  // Keep it out of layout so Safari anchors the sheet to viewport center
  // (not to a bottom-right button or fixed bar)
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  input.style.top = '0';
  input.style.opacity = '0';
  input.style.pointerEvents = 'none';

  document.body.appendChild(input);

  input.addEventListener('change', () => {
    const files = Array.from(input.files ?? []).slice(0, max);
    onFiles(files);
    document.body.removeChild(input);
  }, { once: true });

  // Defer click to next frame to avoid being tied to the triggering element's geometry
  requestAnimationFrame(() => input.click());
}