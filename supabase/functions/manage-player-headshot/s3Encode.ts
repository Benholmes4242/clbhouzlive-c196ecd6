// Shared S3/R2 key encoding for manage-player-headshot.
// Pure module (no Deno or remote imports) so Vitest can import it directly.

// AWS SigV4 (which R2 follows) requires every byte outside A-Z a-z 0-9 - _ . ~
// to be percent-encoded in the canonical URI. encodeURIComponent leaves
// ! ' ( ) * literal, so those must be encoded by hand.
export const s3Encode = (s: string): string =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

// Champions Tour R2 files use underscores for spaces; all other tours use
// spaces (matches playerHeadshot.ts buildUrl).
export const objectName = (folder: string, playerName: string): string =>
  folder === 'PGA Champions' ? playerName.replace(/ /g, '_') : playerName;

// Single builder for the signed/request path: /bucket/folder/name.webp
export const objectPath = (bucket: string, folder: string, playerName: string): string =>
  `/${bucket}/${s3Encode(folder)}/${s3Encode(objectName(folder, playerName))}.webp`;
