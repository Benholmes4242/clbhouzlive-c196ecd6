/**
 * Shared map configuration used across all map contexts.
 * Single source of truth to prevent style/token drift.
 */

export const MAP_CONFIG = {
  /** Premium satellite-streets style used everywhere */
  STYLE_URL: 'mapbox://styles/mapbox/satellite-streets-v12',
  
  /** Token from environment */
  TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string,
  
  /** Default zoom levels */
  ZOOM: {
    PREVIEW: 13,
    EXPANDED: 14,
    MAX: 17,
    MIN: 2,
  },
  
  /** Default heights */
  HEIGHT: {
    PREVIEW: 200,
    EXPANDED_MIN: 320,
  },
  
  /** Marker accent color */
  MARKER_COLOR: '#F7931E',
} as const;
