/**
 * OverviewTab - The World-Class Golf Command Center
 * Redesigned with live multi-tour data and premium UI
 */

import type { ReactNode } from 'react';
import { OverviewPageV3 } from './OverviewPageV3';

interface OverviewTabProps {
  topRightSlot?: ReactNode;
}

export function OverviewTab({ topRightSlot }: OverviewTabProps = {}) {
  return <OverviewPageV3 topRightSlot={topRightSlot} />;
}
