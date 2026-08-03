/**
 * CompareMount - owns the compare sheet's open state for the whole surface.
 *
 * Mounted ONCE by HandicapPage. It listens on the compare bus (Circle entry
 * panel, friend-view control) and reads the ?compare= query param so both the
 * legacy /rivalry/:id redirect and a shared link land with the sheet already
 * open on that player.
 *
 * The param is stripped on close so a back-navigation does not re-open it.
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import CompareSheet from './CompareSheet';
import { compareBus, type CompareSource } from './events';

interface Props {
  /** The viewing member - always the left-hand side of every figure. */
  viewerUserId: string | undefined;
}

export const CompareMount: React.FC<Props> = ({ viewerUserId }) => {
  const [params, setParams] = useSearchParams();
  const paramTarget = params.get('compare');

  const [open, setOpen] = React.useState(false);
  const [target, setTarget] = React.useState<string | null>(null);
  const [from, setFrom] = React.useState<CompareSource>('circle');

  React.useEffect(() => {
    if (!paramTarget) return;
    setTarget(paramTarget);
    setFrom('deeplink');
    setOpen(true);
  }, [paramTarget]);

  React.useEffect(
    () =>
      compareBus.subscribe(({ targetUserId, from: src }) => {
        setTarget(targetUserId ?? null);
        setFrom(src);
        setOpen(true);
      }),
    [],
  );

  const handleClose = () => {
    setOpen(false);
    setTarget(null);
    if (params.get('compare')) {
      const next = new URLSearchParams(params);
      next.delete('compare');
      setParams(next, { replace: true });
    }
  };

  if (!viewerUserId) return null;

  return (
    <CompareSheet
      open={open}
      onClose={handleClose}
      viewerUserId={viewerUserId}
      initialTargetUserId={target}
      from={from}
    />
  );
};

export default CompareMount;
