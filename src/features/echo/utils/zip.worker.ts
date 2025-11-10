/**
 * Web Worker for ZIP generation (off main thread)
 */
import JSZip from 'jszip';

interface ZipTask {
  format: 'json' | 'md';
  files: Array<{ path: string; contents: string }>;
}

self.onmessage = async (e: MessageEvent) => {
  try {
    const { files } = e.data.task as ZipTask;
    const zip = new JSZip();
    let bytes = 0;

    // Add all files to zip
    files.forEach((f, i) => {
      zip.file(f.path, f.contents);
      // Emit progress per file
      (self as any).postMessage({ 
        type: 'progress', 
        current: i + 1, 
        total: files.length, 
        bytes 
      });
    });

    // Generate blob with progress tracking
    const blob = await zip.generateAsync({ type: 'blob' }, (meta) => {
      bytes = meta.currentFile ? meta.percent : 0;
      (self as any).postMessage({ 
        type: 'progress', 
        current: files.length, 
        total: files.length, 
        bytes: Math.round((meta.percent / 100) * files.length * 50000) // estimate
      });
    });

    (self as any).postMessage({ type: 'done', blob }, []);
  } catch (err: any) {
    (self as any).postMessage({ 
      type: 'error', 
      message: err?.message || 'ZIP generation failed' 
    });
  }
};
