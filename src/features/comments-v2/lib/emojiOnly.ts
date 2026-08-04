/**
 * Emoji-only detection. A comment that is nothing but emoji is doing the job
 * of a reaction, so it renders large. The length guard stops a long emoji
 * string from becoming a wall of 30px glyphs (12 chars is ~3-4 emoji).
 *
 * Unicode property escapes (\p{...}) are supported by the esbuild/Vite target
 * used here (ES2020+, all supported Safari/Chrome versions ship them).
 */
const EMOJI_ONLY = /^(\p{Extended_Pictographic}|\p{Emoji_Component}|\s)+$/u;

export function isEmojiOnly(text?: string | null): boolean {
  if (!text) return false;
  const t = text.trim();
  return t.length > 0 && t.length <= 12 && EMOJI_ONLY.test(t);
}
