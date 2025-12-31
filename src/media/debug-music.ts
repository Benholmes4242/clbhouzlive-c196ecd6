/**
 * Music Propagation Debug Instrumentation
 * 
 * Enable via localStorage: localStorage.setItem('DEBUG_MUSIC_PROPAGATION', 'true')
 * 
 * Logs music detection at every playback surface to trace where music chain breaks.
 */

export const DEBUG_MUSIC_PROPAGATION = (): boolean => {
  try {
    return localStorage.getItem('DEBUG_MUSIC_PROPAGATION') === 'true';
  } catch {
    return false;
  }
};

export interface MusicDebugLog {
  surface: string;
  postId?: string;
  postMediaId?: string;
  hasMusic: boolean;
  musicUrl?: string | null;
  audioMode?: string | null;
  videoMuted?: boolean;
  studioEditsPresent: boolean;
  studioEditsValue?: any;
  soundtrackStripMounted?: boolean;
  timestamp: number;
}

/**
 * Log music detection at a playback surface
 */
export function logMusicDetection(log: Omit<MusicDebugLog, 'timestamp'>): void {
  if (!DEBUG_MUSIC_PROPAGATION()) return;

  const fullLog: MusicDebugLog = {
    ...log,
    timestamp: Date.now(),
  };

  const emoji = log.hasMusic ? '🎵' : '🔇';
  const status = log.hasMusic
    ? `MUSIC DETECTED (${log.musicUrl ? 'URL present' : 'NO URL!'})`
    : 'NO MUSIC';

  // Plain, easy-to-search log (useful if styled logs are hidden)
  console.log('[MusicDebug]', {
    surface: fullLog.surface,
    postId: fullLog.postId,
    postMediaId: fullLog.postMediaId,
    hasMusic: fullLog.hasMusic,
    audioMode: fullLog.audioMode,
    musicUrl: fullLog.musicUrl,
    studioEditsPresent: fullLog.studioEditsPresent,
    videoMuted: fullLog.videoMuted,
    soundtrackStripMounted: fullLog.soundtrackStripMounted,
    timestamp: fullLog.timestamp,
  });

  // Styled log for readability
  console.log(
    `%c[MusicDebug] ${emoji} ${log.surface}`,
    log.hasMusic ? 'color: #22c55e; font-weight: bold' : 'color: #ef4444',
    status,
    {
      postId: log.postId,
      postMediaId: log.postMediaId,
      audioMode: log.audioMode,
      videoMuted: log.videoMuted,
      studioEditsPresent: log.studioEditsPresent,
      studioEdits: log.studioEditsValue,
      musicUrl: log.musicUrl,
      soundtrackStripMounted: log.soundtrackStripMounted,
    }
  );
}

/**
 * Log when studioEdits is missing at a critical junction
 */
export function logMissingStudioEdits(surface: string, context: string, data?: any): void {
  if (!DEBUG_MUSIC_PROPAGATION()) return;
  
  console.warn(
    `%c[MusicDebug] ⚠️ MISSING studioEdits at ${surface}`,
    'color: #f59e0b; font-weight: bold',
    context,
    data
  );
}

/**
 * Log the query shape to verify studio_edits is being fetched
 */
export function logQueryShape(surface: string, hasStudioEdits: boolean, sampleData?: any): void {
  if (!DEBUG_MUSIC_PROPAGATION()) return;
  
  console.log(
    `%c[MusicDebug] 📊 Query Shape: ${surface}`,
    hasStudioEdits ? 'color: #22c55e' : 'color: #ef4444',
    hasStudioEdits ? 'studio_edits INCLUDED' : 'studio_edits MISSING',
    sampleData ? { sample: sampleData } : undefined
  );
}

/**
 * Log fullscreen modal props to verify studioEdits is passed
 */
export function logFullscreenModalProps(
  surface: string, 
  studioEdits: any[] | undefined,
  postId?: string
): void {
  if (!DEBUG_MUSIC_PROPAGATION()) return;
  
  const hasEdits = Array.isArray(studioEdits) && studioEdits.length > 0;
  const hasMusic = studioEdits?.some(ed => {
    const music = (ed as any)?.music;
    return !!(music?.url || music?.r2Key);
  });
  
  console.log(
    `%c[MusicDebug] 🖥️ FullscreenModal Props: ${surface}`,
    hasMusic ? 'color: #22c55e; font-weight: bold' : hasEdits ? 'color: #3b82f6' : 'color: #ef4444',
    {
      postId,
      studioEditsProvided: hasEdits,
      studioEditsCount: studioEdits?.length ?? 0,
      hasMusicInEdits: hasMusic,
      rawStudioEdits: studioEdits,
    }
  );
}

/**
 * Extract music data from studioEdits array
 */
export function extractMusicFromStudioEdits(studioEdits: any[] | undefined): {
  hasMusic: boolean;
  musicUrl: string | null;
  audioMode: string | null;
  trackId: string | null;
} {
  if (!studioEdits || !Array.isArray(studioEdits)) {
    return { hasMusic: false, musicUrl: null, audioMode: null, trackId: null };
  }
  
  for (const edit of studioEdits) {
    const music = edit?.music;
    if (music?.url || music?.r2Key) {
      return {
        hasMusic: true,
        musicUrl: music.url || music.r2Key || null,
        audioMode: edit?.audioMode || null,
        trackId: music.trackId || null,
      };
    }
  }
  
  return { hasMusic: false, musicUrl: null, audioMode: null, trackId: null };
}

/**
 * Log video route page music detection
 */
export function logVideoRouteMusic(
  videoId: string,
  studioEdits: any,
  videoMuted: boolean,
  soundtrackStripMounted: boolean
): void {
  if (!DEBUG_MUSIC_PROPAGATION()) return;
  
  const { hasMusic, musicUrl, audioMode } = extractMusicFromStudioEdits(
    Array.isArray(studioEdits) ? studioEdits : studioEdits ? [studioEdits] : []
  );
  
  console.log(
    `%c[MusicDebug] 📺 /video/:id Route`,
    hasMusic ? 'color: #22c55e; font-weight: bold' : 'color: #ef4444',
    {
      videoId,
      hasMusic,
      musicUrl,
      audioMode,
      videoMuted,
      soundtrackStripMounted,
      optionAEnforced: hasMusic ? videoMuted === true : 'N/A',
    }
  );
}
