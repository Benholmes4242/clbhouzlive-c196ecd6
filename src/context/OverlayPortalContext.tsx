import * as React from "react";

type OverlayPortalContextValue = {
  container: HTMLElement | null;
};

const OverlayPortalContext = React.createContext<OverlayPortalContextValue>({
  container: null,
});

export function OverlayPortalProvider({
  container,
  children,
}: {
  container: HTMLElement | null;
  children: React.ReactNode;
}) {
  return (
    <OverlayPortalContext.Provider value={{ container }}>
      {children}
    </OverlayPortalContext.Provider>
  );
}

export function useOverlayPortalContainer() {
  return React.useContext(OverlayPortalContext).container;
}
