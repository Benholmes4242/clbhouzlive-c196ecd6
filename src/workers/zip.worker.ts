/* eslint-disable no-restricted-globals */
import JSZip from 'jszip';

type FileEntry = { path: string; contents: string };
type ZipTask = { format: 'json'|'md'; files: FileEntry[] };

self.onmessage = async (e: MessageEvent) => {
  try {
    const { files } = e.data.task as ZipTask;
    const zip = new JSZip();
    let bytes = 0;

    files.forEach((f, i) => {
      zip.file(f.path, f.contents);
      (self as any).postMessage({ type: 'progress', current: i + 1, total: files.length, bytes });
    });

    const blob = await zip.generateAsync(
      { type: 'blob' },
      (meta) => {
        bytes = meta.currentFile ? meta.percent : 0;
        (self as any).postMessage({ type: 'progress', current: files.length, total: files.length, bytes: Math.round((meta.percent / 100) * files.length * 50000) });
      }
    );

    (self as any).postMessage({ type: 'done', blob });
  } catch (err: any) {
    (self as any).postMessage({ type: 'error', message: err?.message || 'Zip failed' });
  }
};
