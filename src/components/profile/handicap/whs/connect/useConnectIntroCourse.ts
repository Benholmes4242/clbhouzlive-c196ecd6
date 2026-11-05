/** HS2 retires the intro course read; this module stays for the done-stage name helper. */
const NAME_SUFFIXES = [' golf club', ' golf links', ' golf course', ' golf centre', ' golf resort'];

/** Removes at most ONE trailing club suffix, only if at least three characters remain. */
export function stripClubSuffix(name: string): string {
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  for (const suffix of NAME_SUFFIXES) {
    if (lower.endsWith(suffix)) {
      const rest = trimmed.slice(0, trimmed.length - suffix.length).trim();
      return rest.length >= 3 ? rest : trimmed;
    }
  }
  return trimmed;
}

