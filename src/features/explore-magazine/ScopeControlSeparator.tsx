import { A } from '@/features/courses/components/holes/analytical/tokens';

/** Shared boundary between a scrolling scope rail and its pinned control. */
export function ScopeControlSeparator() {
  return (
    <div
      data-scope-control-separator
      aria-hidden="true"
      style={{
        flex: '0 0 1px',
        alignSelf: 'stretch',
        marginBlock: 5,
        background: A.BORDER,
      }}
    />
  );
}