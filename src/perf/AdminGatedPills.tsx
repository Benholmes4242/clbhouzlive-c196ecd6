// Hooks-safe wrappers for the floating debug pills. All hooks are called
// unconditionally; the wrapper decides whether to render the real component.
// Double gate: role must be 'full' AND the per-device visibility toggle on.
// A stale localStorage flag on a non-admin device MUST NOT reveal the pills.
import React from 'react';
import { usePanelRole } from '@/hooks/usePanelRole';
import { useAdminPillVisibility } from '@/hooks/useAdminPillVisibility';
import { PerfToggleButton } from '@/perf/PerfToggleButton';
import { BootTimelineToggleButton } from '@/perf/BootTimelineToggleButton';
import { PerfHud } from '@/perf/PerfHud';
import { LogHud } from '@/perf/LogHud';
import { AudioLogsButton } from '@/perf/AudioLogsButton';



export function AdminGatedPerfPill() {
  const { role, loading } = usePanelRole();
  const [visible] = useAdminPillVisibility();
  if (loading || role !== 'full' || !visible) return null;
  return <PerfToggleButton />;
}

export function AdminGatedBootTimelinePill() {
  const { role, loading } = usePanelRole();
  const [visible] = useAdminPillVisibility();
  if (loading || role !== 'full' || !visible) return null;
  return <BootTimelineToggleButton />;
}

export function AdminGatedPerfHud() {
  const { role, loading } = usePanelRole();
  const [visible] = useAdminPillVisibility();
  if (loading || role !== 'full' || !visible) return null;
  return <PerfHud />;
}

export function AdminGatedLogHud() {
  const { role, loading } = usePanelRole();
  const [visible] = useAdminPillVisibility();
  if (loading || role !== 'full' || !visible) return null;
  return <LogHud />;
}

