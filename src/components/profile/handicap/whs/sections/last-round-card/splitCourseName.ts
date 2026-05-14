export function splitCourseName(name: string): { title: string; suffix: string | null } {
  const m = name.match(/^(.+)-(.+?)$/);
  if (m) return { title: m[1].trim(), suffix: m[2].trim() };
  return { title: name, suffix: null };
}
