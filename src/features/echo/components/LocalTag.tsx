export function LocalTag() {
  return (
    <span
      className="ml-2 rounded-md px-1.5 py-0.5 text-[10px] leading-none text-white/70"
      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)' }}
      aria-label="Stored on this device"
      title="Stored on this device"
    >
      local
    </span>
  );
}
