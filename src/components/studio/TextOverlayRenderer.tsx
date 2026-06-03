/**
 * TextOverlayRenderer - Legacy stub
 *
 * Studio-v2 bakes text overlays into the image pixels at publish time, so
 * there is nothing to render at display time. Kept as a no-op shim so legacy
 * consumers (feed/posts/explore/video modals) keep compiling without surgery.
 */

import React from 'react';

type AnyProps = Record<string, unknown>;

const TextOverlayRenderer: React.FC<AnyProps> = () => null;

export default TextOverlayRenderer;
export { TextOverlayRenderer };
