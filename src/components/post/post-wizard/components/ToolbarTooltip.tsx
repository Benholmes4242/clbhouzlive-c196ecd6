import { useEffect, useState, useCallback } from 'react';

const COURSE_TOOLTIP_KEY = 'clbhouz_course_tag_tooltip_views';
const FRIENDS_TOOLTIP_KEY = 'clbhouz_tag_friends_tooltip_views';

function getCount(key: string): number {
  return parseInt(localStorage.getItem(key) || '0', 10);
}

function increment(key: string) {
  localStorage.setItem(key, String(getCount(key) + 1));
}

export function useToolbarTooltips() {
  const [showCourseTooltip, setShowCourseTooltip] = useState(false);
  const [showFriendsTooltip, setShowFriendsTooltip] = useState(false);

  useEffect(() => {
    const courseViews = getCount(COURSE_TOOLTIP_KEY);
    const friendsViews = getCount(FRIENDS_TOOLTIP_KEY);

    // Visits 1-2: course tooltip
    if (courseViews < 2) {
      const showTimer = setTimeout(() => setShowCourseTooltip(true), 800);
      const hideTimer = setTimeout(() => {
        setShowCourseTooltip(false);
        increment(COURSE_TOOLTIP_KEY);
      }, 4800);
      return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }

    // Visits 3-4: friends tooltip
    if (friendsViews < 2) {
      const showTimer = setTimeout(() => setShowFriendsTooltip(true), 800);
      const hideTimer = setTimeout(() => {
        setShowFriendsTooltip(false);
        increment(FRIENDS_TOOLTIP_KEY);
      }, 4800);
      return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }
  }, []);

  const dismissCourseTooltip = useCallback(() => {
    if (showCourseTooltip) {
      setShowCourseTooltip(false);
      increment(COURSE_TOOLTIP_KEY);
    }
  }, [showCourseTooltip]);

  const dismissFriendsTooltip = useCallback(() => {
    if (showFriendsTooltip) {
      setShowFriendsTooltip(false);
      increment(FRIENDS_TOOLTIP_KEY);
    }
  }, [showFriendsTooltip]);

  return { showCourseTooltip, showFriendsTooltip, dismissCourseTooltip, dismissFriendsTooltip };
}

interface ToolbarTooltipBubbleProps {
  text: string;
  visible: boolean;
}

export function ToolbarTooltipBubble({ text, visible }: ToolbarTooltipBubbleProps) {
  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <div
        className="absolute left-1/2 bottom-full mb-2 z-[100] pointer-events-none"
        style={{
          animation: 'tooltipFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <div
          className="relative whitespace-nowrap px-3 py-1.5 rounded-lg text-[13px] font-medium"
          style={{
            background: '#1A1A1A',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateX(-50%)',
            maxWidth: '160px',
          }}
        >
          {text}
          <div
            className="absolute left-1/2 top-full"
            style={{
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #1A1A1A',
            }}
          />
        </div>
      </div>
    </>
  );
}
