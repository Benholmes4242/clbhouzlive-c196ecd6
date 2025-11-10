/**
 * Hook for managing export HUD state
 */
import { useState } from 'react';
import { ExportHud } from '../components/ExportHud';
import type { ExportProgress } from '../utils/exportOrchestrator';

interface ExportTask {
  total: number;
  cancel: () => void;
}

export function useExportHud() {
  const [state, setState] = useState<{
    visible: boolean;
    current: number;
    total: number;
    bytes: number;
    cancel?: () => void;
  }>({
    visible: false,
    current: 0,
    total: 0,
    bytes: 0,
  });

  return {
    show(task: ExportTask) {
      setState({
        visible: true,
        current: 0,
        total: task.total,
        bytes: 0,
        cancel: task.cancel,
      });
    },
    
    update(progress: ExportProgress) {
      setState(prev => ({
        ...prev,
        current: progress.current,
        total: progress.total,
        bytes: progress.bytes,
      }));
    },
    
    done() {
      setState(prev => ({ ...prev, visible: false }));
    },
    
    component: state.visible ? (
      <ExportHud
        current={state.current}
        total={state.total}
        bytes={state.bytes}
        onCancel={() => state.cancel?.()}
      />
    ) : null,
  };
}
