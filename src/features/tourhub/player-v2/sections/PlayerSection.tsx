import type { ReactNode } from 'react';
export function PlayerSection({ id, title, right, children, divided = true }: { id: string; title: string; right?: ReactNode; children: ReactNode; divided?: boolean }) {
  return <>{divided && <div className="pv-divider" />}<section className="pv-sec" data-player-section={id}><header className="pv-head"><h2>{title}</h2>{right != null && <span>{right}</span>}</header>{children}</section></>;
}
export function PlayerLine({ line, className = 'pv-lead' }: { line: { bold: string; rest: string } | null; className?: string }) {
  if (!line) return null;
  return <p className={className}>{line.bold && <b>{line.bold}</b>}{line.bold && !line.rest.startsWith(':') && !line.rest.startsWith(',') ? ' ' : ''}{line.rest}</p>;
}