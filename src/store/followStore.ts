import { create } from 'zustand';

interface FollowStore {
  overrides: Map<string, boolean>;
  setFollowing: (targetUserId: string, isFollowing: boolean) => void;
  getFollowing: (targetUserId: string, fallback: boolean) => boolean;
  reset: () => void;
}

export const useFollowStore = create<FollowStore>((set, get) => ({
  overrides: new Map(),

  setFollowing: (targetUserId, isFollowing) => {
    set(state => {
      const next = new Map(state.overrides);
      next.set(targetUserId, isFollowing);
      return { overrides: next };
    });
  },

  getFollowing: (targetUserId, fallback) => {
    const overrides = get().overrides;
    return overrides.has(targetUserId) ? overrides.get(targetUserId)! : fallback;
  },

  reset: () => set({ overrides: new Map() }),
}));
