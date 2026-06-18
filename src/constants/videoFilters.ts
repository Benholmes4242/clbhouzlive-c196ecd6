export function parseTopics(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function stringifyTopics(topics: string[] | null | undefined): string {
  if (!topics || topics.length === 0) return "";
  return topics.filter(Boolean).join(",");
}
