import { toBlob } from 'html-to-image';

/** Only exports use the browser's SVG foreignObject renderer: no independent canvas glyph baseline engine.
 * The embedded wordmark is dynamically loaded only on export, keeping profile
 * visits small; the detached copy decodes it before capture without an asset fetch.
 */
export async function exportShareCard(el: HTMLElement): Promise<Blob> {
  await document.fonts.ready;
  await Promise.all(Array.from(el.querySelectorAll('img')).map(async (image) => {
    if (!image.hasAttribute('data-share-wordmark') && !image.complete) await image.decode();
  }));
  // Template content is inert: cloning a live <img> directly can start its
  // hosted request before the embedded source replaces it in Chromium.
  const template = document.createElement('template');
  template.innerHTML = el.outerHTML;
  const copy = template.content.firstElementChild;
  if (!(copy instanceof HTMLElement)) throw new Error('nothing to capture');
  const wordmark = copy.querySelector<HTMLImageElement>('[data-share-wordmark]');
  if (wordmark) {
    const { SHARE_WORDMARK } = await import('./shareWordmark');
    wordmark.src = SHARE_WORDMARK;
  }
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:405px;pointer-events:none';
  host.setAttribute('aria-hidden', 'true');
  host.append(copy);
  document.body.append(host);
  try {
    if (wordmark) await wordmark.decode();
    // ForeignObject rasterisation rounds the large numeral baseline one CSS
    // pixel lower. This correction belongs only to the detached export copy.
    const score = copy.querySelector<HTMLElement>('[data-share-export-score]');
    if (score) score.style.transform = 'translateY(-1px)';
    // Brief 35: foreignObject rasterises backdrop-filter as a square halo; the pill's
    // rgba background carries it in the export, the blur stays on screen only.
    copy.querySelectorAll<HTMLElement>('[data-share-pill]').forEach((pill) => { pill.style.backdropFilter = 'none'; pill.style.setProperty('-webkit-backdrop-filter', 'none'); });
    const options = { pixelRatio: 1080 / 405, skipFonts: true, fontEmbedCSS: '' };
    // WebKit can omit decoded photos on its first foreignObject rasterisation.
    // Warm that renderer once; discard its output and return the second render.
    await toBlob(copy, options);
    const blob = await toBlob(copy, options);
    if (!blob) throw new Error('capture failed');
    return blob;
  } finally {
    host.remove();
  }
}