import React from 'react';
import { ExportHud } from '../components/ExportHud';

export function useExportHud() {
  const [state, setState] = React.useState<{ visible: boolean; current: number; total: number; bytes: number; onCancel?: () => void; }>({
    visible: false,
    current: 0,
    total: 0,
    bytes: 0,
  });

  return {
    show(payload: { total: number; onCancel: () => void }) {
      setState({ visible: true, current: 0, total: payload.total, bytes: 0, onCancel: payload.onCancel });
    },
    update(p: { current: number; total: number; bytes: number }) {
      setState(s => ({ ...s, ...p }));
    },
    done() {
      setState(s => ({ ...s, visible: false }));
    },
    ui: state.visible ? (
      <ExportHud current={state.current} total={state.total} bytes={state.bytes} onCancel={state.onCancel!} />
    ) : null,
  };
}
