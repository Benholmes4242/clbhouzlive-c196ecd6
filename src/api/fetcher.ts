import { loadingBus } from "./loadingBus";

export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  loadingBus.begin();
  try {
    const res = await fetch(input, init);
    return res;
  } finally {
    loadingBus.end();
  }
}
