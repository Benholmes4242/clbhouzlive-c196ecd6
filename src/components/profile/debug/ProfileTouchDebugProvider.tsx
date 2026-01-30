import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppLog } from '@/lib/logger';
import {
  ProfileTouchDebugContext,
  type ProfileTouchDebugApi,
  type ProfileTouchDebugGlobalEvent,
  type ProfileTouchDebugPoint,
  type ProfileTouchDebugState,
} from './ProfileTouchDebugContext';

function summarizeEl(el: Element | null | undefined): string {
  if (!el) return '(none)';
  const tag = el.tagName?.toLowerCase?.() ?? 'unknown';
  const id = (el as HTMLElement).id ? `#${(el as HTMLElement).id}` : '';
  const className = (el as HTMLElement).className;
  const cls = typeof className === 'string' && className.trim()
    ? `.${className.trim().split(/\s+/).slice(0, 3).join('.')}`
    : '';
  const dataDebugId = (el as HTMLElement).getAttribute?.('data-debug-id');
  const dbg = dataDebugId ? `[${dataDebugId}]` : '';
  return `${tag}${id}${cls}${dbg}`;
}

function pushLimited<T>(arr: T[], item: T, limit: number): T[] {
  const next = [item, ...arr];
  return next.length > limit ? next.slice(0, limit) : next;
}

export function ProfileTouchDebugProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<ProfileTouchDebugState>({
    points: {},
    recentPoints: [],
    recentGlobalEvents: [],
  });

  const clear = useCallback(() => {
    setState({ points: {}, recentPoints: [], recentGlobalEvents: [] });
  }, []);

  const logPoint = useCallback<ProfileTouchDebugApi['logPoint']>((name, detail) => {
    if (!enabled) return;
    const point: ProfileTouchDebugPoint = {
      name,
      ts: Date.now(),
      detail,
    };

    // Console log (info so it shows up even outside DEV when enabled)
    AppLog.info('TouchDebug', 'POINT', point.name, point.detail ?? {});

    setState((prev) => ({
      ...prev,
      points: {
        ...prev.points,
        [name]: (prev.points[name] ?? 0) + 1,
      },
      recentPoints: pushLimited(prev.recentPoints, point, 30),
    }));
  }, [enabled]);

  // Global capture listeners to see where taps are landing (or not landing).
  useEffect(() => {
    if (!enabled) return;

    const record = (evt: ProfileTouchDebugGlobalEvent) => {
      AppLog.info('TouchDebug', 'GLOBAL', evt.eventType, {
        target: evt.target,
        elementFromPoint: evt.elementFromPoint,
        x: evt.x,
        y: evt.y,
      });
      setState((prev) => ({
        ...prev,
        recentGlobalEvents: pushLimited(prev.recentGlobalEvents, evt, 30),
      }));
    };

    const onPointerDown = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      record({
        eventType: 'pointerdown',
        ts: Date.now(),
        x,
        y,
        target: summarizeEl(e.target as Element | null),
        elementFromPoint: summarizeEl(document.elementFromPoint(x, y)),
      });
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches?.[0];
      const x = t?.clientX;
      const y = t?.clientY;
      record({
        eventType: 'touchstart',
        ts: Date.now(),
        x,
        y,
        target: summarizeEl(e.target as Element | null),
        elementFromPoint: x != null && y != null ? summarizeEl(document.elementFromPoint(x, y)) : undefined,
      });
    };

    const onClick = (e: MouseEvent) => {
      record({
        eventType: 'click',
        ts: Date.now(),
        target: summarizeEl(e.target as Element | null),
      });
    };

    document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
    document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    document.addEventListener('click', onClick, { capture: true });

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('touchstart', onTouchStart, true);
      document.removeEventListener('click', onClick, true);
    };
  }, [enabled]);

  const api = useMemo<ProfileTouchDebugApi>(() => ({
    enabled,
    logPoint,
    state,
    clear,
  }), [enabled, logPoint, state, clear]);

  return (
    <ProfileTouchDebugContext.Provider value={api}>
      {children}
    </ProfileTouchDebugContext.Provider>
  );
}

export function useProfileTouchDebug() {
  return React.useContext(ProfileTouchDebugContext);
}
