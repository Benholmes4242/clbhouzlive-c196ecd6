/**
 * Legacy fullscreen exports - re-export from new media system for compatibility
 * 
 * @deprecated Use imports from '@/media/fullscreen' directly
 */

// Re-export new viewer for any remaining legacy imports
export { FullscreenMediaViewer as UnifiedFullscreenViewer } from '@/media/fullscreen';
export type { FullscreenMediaViewerProps as UnifiedFullscreenViewerProps } from '@/media/fullscreen';
