/**
 * One-off backfill: fill width/height/aspect_ratio on post_media image rows.
 *
 * Reads intrinsic dimensions straight from the image files (header bytes only
 * via HTTP Range requests where the format allows it).
 *
 * - images only (media_type = 'image'); video rows are untouched
 * - idempotent: only selects rows where width or height is null
 * - batched with a small delay; failures are logged, never fatal
 *
 * Usage: node scripts/backfill-post-media-dimensions.mjs [--dry]
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in env.');
  process.exit(1);
}

const DRY = process.argv.includes('--dry');
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 250;
const HEADER_BYTES = 65536; // enough for JPEG SOF markers in practice

const rest = (path, init = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- header parsers ---------------- */

function parsePng(buf) {
  if (buf.length < 24) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function parseGif(buf) {
  if (buf.length < 10 || buf.toString('ascii', 0, 3) !== 'GIF') return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
}

function parseWebp(buf) {
  if (buf.length < 30) return null;
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const fmt = buf.toString('ascii', 12, 16);
  if (fmt === 'VP8 ') {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (fmt === 'VP8L') {
    const b = buf.readUInt32LE(21);
    return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
  }
  if (fmt === 'VP8X') {
    const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return { width: w, height: h };
  }
  return null;
}

function parseJpeg(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let off = 2;
  let orientation = 1;
  while (off + 9 < buf.length) {
    if (buf[off] !== 0xff) {
      off += 1;
      continue;
    }
    const marker = buf[off + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      off += 2;
      continue;
    }
    const len = buf.readUInt16BE(off + 2);
    // EXIF: read orientation so portrait phone shots are not reported landscape
    if (marker === 0xe1 && buf.toString('ascii', off + 4, off + 10) === 'Exif\0\0') {
      orientation = readExifOrientation(buf.subarray(off + 10, off + 2 + len)) ?? orientation;
    }
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSof) {
      const height = buf.readUInt16BE(off + 5);
      const width = buf.readUInt16BE(off + 7);
      return orientation >= 5 && orientation <= 8
        ? { width: height, height: width }
        : { width, height };
    }
    off += 2 + len;
  }
  return null;
}

function readExifOrientation(tiff) {
  try {
    if (tiff.length < 8) return null;
    const le = tiff.toString('ascii', 0, 2) === 'II';
    const u16 = (o) => (le ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o));
    const u32 = (o) => (le ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o));
    const ifd = u32(4);
    const count = u16(ifd);
    for (let i = 0; i < count; i++) {
      const entry = ifd + 2 + i * 12;
      if (entry + 12 > tiff.length) break;
      if (u16(entry) === 0x0112) return u16(entry + 8);
    }
  } catch {
    /* ignore */
  }
  return null;
}

function readDimensions(buf) {
  return parsePng(buf) || parseJpeg(buf) || parseWebp(buf) || parseGif(buf);
}

/* ---------------- fetching ---------------- */

async function fetchDimensions(url) {
  // header bytes only
  let res = await fetch(url, { headers: { Range: `bytes=0-${HEADER_BYTES - 1}` } });
  if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status}`);
  let buf = Buffer.from(await res.arrayBuffer());
  let dims = readDimensions(buf);
  if (dims) return dims;

  // progressive JPEGs occasionally carry the SOF beyond our window
  res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} (full)`);
  buf = Buffer.from(await res.arrayBuffer());
  dims = readDimensions(buf);
  if (!dims) throw new Error('unrecognised image header');
  return dims;
}

/* ---------------- run ---------------- */

async function main() {
  const videoRes = await rest(
    'post_media?select=id&media_type=eq.video&or=(width.is.null,height.is.null)',
    { headers: { Prefer: 'count=exact', Range: '0-0' } },
  );
  const videoMissing = (videoRes.headers.get('content-range') || '/0').split('/')[1];

  const res = await rest(
    'post_media?select=id,media_url&media_type=eq.image&or=(width.is.null,height.is.null)&order=id',
  );
  if (!res.ok) throw new Error(`select failed: ${res.status} ${await res.text()}`);
  const rows = await res.json();

  console.log(`image rows missing dimensions: ${rows.length}`);
  console.log(`video rows missing dimensions: ${videoMissing} (not touched in this pass)`);
  if (DRY) return;

  let filled = 0;
  const failures = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (row) => {
        try {
          const { width, height } = await fetchDimensions(row.media_url);
          if (!width || !height) throw new Error(`bad dims ${width}x${height}`);
          const patch = await rest(`post_media?id=eq.${row.id}`, {
            method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({
              width,
              height,
              aspect_ratio: Number((width / height).toFixed(4)),
            }),
          });
          if (!patch.ok) throw new Error(`patch ${patch.status} ${await patch.text()}`);
          filled += 1;
        } catch (err) {
          failures.push({ id: row.id, url: row.media_url, reason: String(err?.message || err) });
          console.error(`FAIL ${row.id} ${row.media_url} :: ${err?.message || err}`);
        }
      }),
    );
    console.log(`progress ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
    await sleep(BATCH_DELAY_MS);
  }

  console.log('---');
  console.log(`attempted: ${rows.length}`);
  console.log(`filled:    ${filled}`);
  console.log(`failed:    ${failures.length}`);
  for (const f of failures) console.log(`  ${f.id}  ${f.reason}  ${f.url}`);
  console.log(`video rows still missing dimensions: ${videoMissing}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
