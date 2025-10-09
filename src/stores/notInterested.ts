type Entry = { id: string; until: number }; // ms epoch

const KEY = 'clbhouz:notInterestedCreators';

function read(): Entry[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

function write(entries: Entry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export const NotInterested = {
  add(id: string, days = 30) {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    const list = read().filter(e => e.id !== id);
    list.push({ id, until });
    write(list);
  },
  isHidden(id: string) {
    const now = Date.now();
    const list = read().filter(e => e.until > now);
    // prune expired
    if (list.length !== read().length) write(list);
    return list.some(e => e.id === id);
  },
  clearExpired() {
    const now = Date.now();
    write(read().filter(e => e.until > now));
  }
};
