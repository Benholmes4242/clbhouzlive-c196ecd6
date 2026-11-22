import { toBlob } from 'html-to-image';

/** Only exports use the browser's SVG foreignObject renderer: no independent canvas glyph baseline engine. */
export async function exportShareCard(el: HTMLElement): Promise<Blob> {
  await document.fonts.ready;
  await Promise.all(Array.from(el.querySelectorAll('img')).map(async (image) => {
    if (!image.complete) await image.decode();
  }));
  const copy = el.cloneNode(true) as HTMLElement;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:405px;pointer-events:none';
  host.setAttribute('aria-hidden', 'true');
  host.append(copy);
  document.body.append(host);
  try {
    // ForeignObject rasterisation rounds the large numeral baseline one CSS
    // pixel lower. This correction belongs only to the detached export copy.
    const score = copy.querySelector<HTMLElement>('[data-share-export-score]');
    if (score) score.style.transform = 'translateY(-1px)';
    const blob = await toBlob(copy, { pixelRatio: 1080 / 405, skipFonts: true, fontEmbedCSS: '' });
    if (!blob) throw new Error('capture failed');
    return blob;
  } finally {
    host.remove();
  }
}