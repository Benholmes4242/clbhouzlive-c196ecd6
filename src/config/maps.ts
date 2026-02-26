/**
 * Shared map configuration used across all map contexts.
 * Single source of truth to prevent style/token drift.
 */

import mapboxgl from 'mapbox-gl';

export const MAP_CONFIG = {
  /** Clean minimal base — roads/POIs stripped at runtime */
  STYLE_URL: 'mapbox://styles/mapbox/light-v11',
  
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

/**
 * Strips the Mapbox light-v11 base down to a clean minimal cartographic base.
 * Removes roads, transit, POIs, and most labels. Keeps country/region boundaries,
 * water, landmass, and major place labels only.
 *
 * Call inside map.on('style.load', () => applyClbhouzMapStyle(map, options))
 */
export function applyClbhouzMapStyle(
  map: mapboxgl.Map,
  options?: {
    /** Show country/state labels. Default true */
    showPlaceLabels?: boolean;
    /** Show water body labels (ocean, sea names). Default true */
    showWaterLabels?: boolean;
    /** Land fill color. Default '#F2F0EB' (warm parchment) */
    landColor?: string;
    /** Water fill color. Default '#D4E4F1' (soft blue) */
    waterColor?: string;
    /** Dark mode — inverts palette. Default false */
    darkMode?: boolean;
    /** Show continent-level labels only (used for mini-globe). Default false */
    showContinentLabels?: boolean;
  },
) {
  const {
    showPlaceLabels = true,
    showWaterLabels = true,
    landColor = '#F2F0EB',
    waterColor = '#D4E4F1',
    darkMode = false,
    showContinentLabels = false,
  } = options ?? {};

  const layers = map.getStyle().layers;
  if (!layers) return;

  // --- 1. REMOVE LAYERS WE DON'T WANT ---
  for (const layer of layers) {
    const id = layer.id;

    // Roads, bridges, tunnels
    if (id.startsWith('road') || id.startsWith('bridge') || id.startsWith('tunnel')) {
      map.removeLayer(id);
      continue;
    }

    // Transit (rail, ferry, aeroway)
    if (
      id.startsWith('transit') ||
      id.startsWith('rail') ||
      id.startsWith('ferry') ||
      id.startsWith('aeroway') ||
      id.includes('aeroway')
    ) {
      map.removeLayer(id);
      continue;
    }

    // POI labels and icons
    if (id.startsWith('poi')) {
      map.removeLayer(id);
      continue;
    }

    // Building footprints
    if (id.startsWith('building')) {
      map.removeLayer(id);
      continue;
    }

    // Land-use fills (parks, commercial, residential shading)
    if (id.startsWith('landuse') || id.startsWith('land-structure')) {
      map.removeLayer(id);
      continue;
    }

    // Minor labels
    if (id.includes('housenum') || id.includes('path') || id.includes('pedestrian')) {
      map.removeLayer(id);
      continue;
    }

    // Water labels if disabled
    if (!showWaterLabels && id.startsWith('water') && id.includes('label')) {
      map.removeLayer(id);
      continue;
    }

    // --- CONTINENT-ONLY LABEL MODE ---
    if (!showPlaceLabels && id.includes('label')) {
      if (showContinentLabels && id === 'continent-label') {
        try { map.setPaintProperty(id, 'text-color', darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)'); } catch {}
        try { map.setPaintProperty(id, 'text-halo-color', darkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)'); } catch {}
        try { map.setPaintProperty(id, 'text-halo-width', 1.5); } catch {}
        try { map.setLayoutProperty(id, 'text-size', 11); } catch {}
        try { map.setLayoutProperty(id, 'text-letter-spacing', 0.15); } catch {}
        try { map.setLayoutProperty(id, 'text-transform', 'uppercase'); } catch {}
        continue;
      }
      if (!id.startsWith('water')) {
        map.removeLayer(id);
        continue;
      }
    }
  }

  // --- 2. RESTYLE WHAT REMAINS ---
  const resolvedLandColor = darkMode ? '#1A1D23' : landColor;
  const resolvedWaterColor = darkMode ? '#0F1218' : waterColor;
  const borderColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const coastlineColor = darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const labelColor = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';
  const labelHaloColor = darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)';

  // Background
  try { map.setPaintProperty('background', 'background-color', resolvedLandColor); } catch {}

  const remainingLayers = map.getStyle().layers ?? [];
  for (const layer of remainingLayers) {
    const id = layer.id;

    // Land fills
    if (id === 'land' || id === 'landcover') {
      try { map.setPaintProperty(id, 'fill-color', resolvedLandColor); } catch {}
      try { map.setPaintProperty(id, 'fill-opacity', 1); } catch {}
    }

    // Water fills
    if (id === 'water' || id === 'water-shadow') {
      try { map.setPaintProperty(id, 'fill-color', resolvedWaterColor); } catch {}
    }

    // Country/state boundaries — soften
    if (id.startsWith('admin')) {
      try { map.setPaintProperty(id, 'line-color', borderColor); } catch {}
      try { map.setPaintProperty(id, 'line-width', id.includes('0') ? 1 : 0.5); } catch {}
    }

    // Waterway / coastline lines
    if (id.includes('waterway') || id.includes('coastline')) {
      try { map.setPaintProperty(id, 'line-color', coastlineColor); } catch {}
    }

    // Place labels — soften so pins dominate
    if (id.includes('label') && showPlaceLabels) {
      try { map.setPaintProperty(id, 'text-color', labelColor); } catch {}
      try { map.setPaintProperty(id, 'text-halo-color', labelHaloColor); } catch {}
      try { map.setPaintProperty(id, 'text-halo-width', 1.5); } catch {}
    }
  }
}
