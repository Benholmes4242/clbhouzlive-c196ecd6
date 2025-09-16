export async function openMediaPicker(onFiles: (files: File[]) => void, max = 10) {
  console.log('openMediaPicker called');
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
      console.log('showOpenFilePicker succeeded, calling callback with', files.length, 'files');
      onFiles(files.slice(0, max));
      return;
    } catch {/* user canceled */}
  }

  // iOS & fallback path: use <input type="file">
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';
  input.multiple = true;

  // IMPORTANT: never set or propagate 'capture' or it will open camera
  input.removeAttribute('capture');
  // (Ensure no code wraps this input and re-adds capture)

  input.style.display = 'none';
  document.body.appendChild(input);

  input.addEventListener('change', () => {
    const files = Array.from(input.files ?? []).slice(0, max);
    console.log('Input file picker succeeded, calling callback with', files.length, 'files');
    onFiles(files);
    document.body.removeChild(input);
  });

  input.click();
}