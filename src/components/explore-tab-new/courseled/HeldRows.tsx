/** CB28 neutral placeholder: reserves `count` rows of `rowHeight`; no values,
 * no spinner, no shimmer. See useHeldFrame.ts. */
export function HeldRows({ count, rowHeight }: { count: number; rowHeight: number }) {
  return (
    <div data-held-rows aria-hidden="true" aria-busy="true">
      {Array.from({ length: count }, (_, i) => <div key={i} data-held-row style={{ height: rowHeight }} />)}
    </div>
  );
}
