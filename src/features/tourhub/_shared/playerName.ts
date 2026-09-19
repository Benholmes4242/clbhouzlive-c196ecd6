const SURNAME_PARTICLES = new Set([
  'de', 'del', 'della', 'der', 'den', 'di', 'da', 'das', 'dos', 'du',
  'la', 'le', 'van', 'von', 'ter', 'ten', 'af', 'av', 'bin', 'ibn',
  'al', 'mac', 'mc', 'st', 'y', 'e',
]);

/** Returns the surname, preserving compound particles and original casing. */
export function surnameOf(fullName?: string | null): string {
  const trimmed = (fullName ?? '').trim();
  if (!trimmed) return '';

  const parts = trimmed.split(/\s+/);
  let surnameStart = parts.length - 1;

  while (surnameStart > 0 && SURNAME_PARTICLES.has(parts[surnameStart - 1].toLocaleLowerCase('en'))) {
    surnameStart -= 1;
  }

  return parts.slice(surnameStart).join(' ');
}