export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function defaultZipName() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `echo_export_${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}.zip`;
}
