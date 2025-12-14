import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ENTER_DIM_DELAY = 4000;
const REVERT_DIM_DELAY = 6000;

interface CinemaDimContextType {
  cinemaDim: boolean;
  bumpChrome: () => void;
  isClubhousePage: boolean;
  setIsClubhousePage: (value: boolean) => void;
}

const CinemaDimContext = createContext<CinemaDimContextType | undefined>(undefined);

export const useCinemaDimContext = () => {
  const context = useContext(CinemaDimContext);
  if (!context) {
    // Return safe defaults if not within provider
    return { cinemaDim: false, bumpChrome: () => {}, isClubhousePage: false, setIsClubhousePage: () => {} };
  }
  return context;
};

export const CinemaDimProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cinemaDim, setCinemaDim] = useState(false);
  const [isClubhousePage, setIsClubhousePage] = useState(false);
  const enterDimTimerRef = useRef<NodeJS.Timeout | null>(null);
  const revertDimTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (enterDimTimerRef.current) {
      clearTimeout(enterDimTimerRef.current);
      enterDimTimerRef.current = null;
    }
    if (revertDimTimerRef.current) {
      clearTimeout(revertDimTimerRef.current);
      revertDimTimerRef.current = null;
    }
  }, []);

  const bumpChrome = useCallback(() => {
    if (!isClubhousePage) return;
    
    setCinemaDim(false);
    clearTimers();
    
    revertDimTimerRef.current = setTimeout(() => {
      setCinemaDim(true);
    }, REVERT_DIM_DELAY);
  }, [isClubhousePage, clearTimers]);

  // When entering/leaving Clubhouse page
  useEffect(() => {
    if (isClubhousePage) {
      setCinemaDim(false);
      clearTimers();
      
      enterDimTimerRef.current = setTimeout(() => {
        setCinemaDim(true);
      }, ENTER_DIM_DELAY);
    } else {
      clearTimers();
      setCinemaDim(false);
    }

    return () => {
      clearTimers();
    };
  }, [isClubhousePage, clearTimers]);

  return (
    <CinemaDimContext.Provider value={{ cinemaDim, bumpChrome, isClubhousePage, setIsClubhousePage }}>
      {children}
    </CinemaDimContext.Provider>
  );
};
