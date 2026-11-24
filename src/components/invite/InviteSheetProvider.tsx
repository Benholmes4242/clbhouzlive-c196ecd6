import React, {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { InviteFriendsSheet } from './InviteFriendsSheet';

interface InviteSheetContextValue {
  openInviteSheet: (source: string, presentation?: { exploreHeadingInk?: boolean }) => void;
  closeInviteSheet: () => void;
}

export const InviteSheetContext = createContext<InviteSheetContextValue | null>(null);

export function InviteSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<string>('invite_sheet');
  const [exploreHeadingInk, setExploreHeadingInk] = useState(false);

  const openInviteSheet = useCallback((src: string, presentation?: { exploreHeadingInk?: boolean }) => {
    setSource(src || 'invite_sheet');
    setExploreHeadingInk(presentation?.exploreHeadingInk ?? false);
    setOpen(true);
  }, []);
  const closeInviteSheet = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ openInviteSheet, closeInviteSheet }),
    [openInviteSheet, closeInviteSheet],
  );

  return (
    <InviteSheetContext.Provider value={value}>
      {children}
      <InviteFriendsSheet open={open} source={source} exploreHeadingInk={exploreHeadingInk} onClose={closeInviteSheet} />
    </InviteSheetContext.Provider>
  );
}
