import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ENTER_DIM_DELAY = 4000;
const REVERT_DIM_DELAY = 6000;

// Pages that should have the auto-dim header behavior (light theme version)
// 'permanent' is a special value for pages that should always be dimmed immediately
type DimmablePage = 'clubhouse' | 'course-detail' | 'profile' | 'permanent' | null;

interface CinemaDimContextType {
  cinemaDim: boolean;
  bumpChrome: () => void;
  isClubhousePage: boolean;
  setIsClubhousePage: (value: boolean) => void;
  // New: Support for light-themed pages with auto-dim
  dimmablePage: DimmablePage;
  setDimmablePage: (page: DimmablePage) => void;
  isLightDimmed: boolean; // True when light-themed page is in dimmed state
}

const CinemaDimContext = createContext<CinemaDimContextType | undefined>(undefined);

export const useCinemaDimContext = () => {
  const context = useContext(CinemaDimContext);
  if (!context) {
    // Return safe defaults if not within provider
    return { 
      cinemaDim: false, 
      bumpChrome: () => {}, 
      isClubhousePage: false, 
      setIsClubhousePage: () => {},
      dimmablePage: null as DimmablePage,
      setDimmablePage: () => {},
      isLightDimmed: false,
    };
  }
  return context;
};

export const CinemaDimProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cinemaDim, setCinemaDim] = useState(false);
  const [isClubhousePage, setIsClubhousePage] = useState(false);
  const [dimmablePage, setDimmablePage] = useState<DimmablePage>(null);
  const [isLightDimmed, setIsLightDimmed] = useState(false);
  
  const enterDimTimerRef = useRef<NodeJS.Timeout | null>(null);
  const revertDimTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lightDimTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lightRevertTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (enterDimTimerRef.current) {
      clearTimeout(enterDimTimerRef.current);
      enterDimTimerRef.current = null;
    }
    if (revertDimTimerRef.current) {
      clearTimeout(revertDimTimerRef.current);
      revertDimTimerRef.current = null;
    }
    if (lightDimTimerRef.current) {
      clearTimeout(lightDimTimerRef.current);
      lightDimTimerRef.current = null;
    }
    if (lightRevertTimerRef.current) {
      clearTimeout(lightRevertTimerRef.current);
      lightRevertTimerRef.current = null;
    }
  }, []);

  const bumpChrome = useCallback(() => {
    // Handle dark theme (Clubhouse)
    if (isClubhousePage) {
      setCinemaDim(false);
      clearTimers();
      
      revertDimTimerRef.current = setTimeout(() => {
        setCinemaDim(true);
      }, REVERT_DIM_DELAY);
      return;
    }
    
    // Handle light theme (Course Detail, Profile) - but not 'permanent' pages
    if (dimmablePage === 'course-detail' || dimmablePage === 'profile') {
      setIsLightDimmed(false);
      
      if (lightRevertTimerRef.current) {
        clearTimeout(lightRevertTimerRef.current);
      }
      
      lightRevertTimerRef.current = setTimeout(() => {
        setIsLightDimmed(true);
      }, REVERT_DIM_DELAY);
    }
    // 'permanent' pages stay dimmed - no bumpChrome effect
  }, [isClubhousePage, dimmablePage, clearTimers]);

  // When entering/leaving Clubhouse page (dark theme)
  useEffect(() => {
    if (isClubhousePage) {
      setCinemaDim(false);
      clearTimers();
      
      enterDimTimerRef.current = setTimeout(() => {
        setCinemaDim(true);
      }, ENTER_DIM_DELAY);
    } else {
      if (enterDimTimerRef.current) clearTimeout(enterDimTimerRef.current);
      if (revertDimTimerRef.current) clearTimeout(revertDimTimerRef.current);
      setCinemaDim(false);
    }

    return () => {
      if (enterDimTimerRef.current) clearTimeout(enterDimTimerRef.current);
      if (revertDimTimerRef.current) clearTimeout(revertDimTimerRef.current);
    };
  }, [isClubhousePage]);

  // When entering/leaving light-themed dimmable pages
  useEffect(() => {
    // 'permanent' pages are immediately dimmed with no delay
    if (dimmablePage === 'permanent') {
      setIsLightDimmed(true);
      if (lightDimTimerRef.current) clearTimeout(lightDimTimerRef.current);
      if (lightRevertTimerRef.current) clearTimeout(lightRevertTimerRef.current);
    } else if (dimmablePage === 'course-detail' || dimmablePage === 'profile') {
      setIsLightDimmed(false);
      
      if (lightDimTimerRef.current) clearTimeout(lightDimTimerRef.current);
      
      lightDimTimerRef.current = setTimeout(() => {
        setIsLightDimmed(true);
      }, ENTER_DIM_DELAY);
    } else {
      if (lightDimTimerRef.current) clearTimeout(lightDimTimerRef.current);
      if (lightRevertTimerRef.current) clearTimeout(lightRevertTimerRef.current);
      setIsLightDimmed(false);
    }

    return () => {
      if (lightDimTimerRef.current) clearTimeout(lightDimTimerRef.current);
      if (lightRevertTimerRef.current) clearTimeout(lightRevertTimerRef.current);
    };
  }, [dimmablePage]);

  return (
    <CinemaDimContext.Provider value={{ 
      cinemaDim, 
      bumpChrome, 
      isClubhousePage, 
      setIsClubhousePage,
      dimmablePage,
      setDimmablePage,
      isLightDimmed,
    }}>
      {children}
    </CinemaDimContext.Provider>
  );
};
