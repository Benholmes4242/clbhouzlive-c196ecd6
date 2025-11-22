export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  return res;
}
