import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useSetMemberJobTitle } from '@/hooks/useBusinessTeam';

const INK = '#0F172A';
const INK_45 = '#64748B';
const HAIR = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const SURFACE = '#F8FAFC';

const PRESETS: string[] = [
  'Owner',
  'General Manager',
  'Director of Golf',
  'Club Professional',
  'Assistant Professional',
  'PGA Coach',
  'Secretary',
  'Membership Secretary',
  'Head Greenkeeper',
  'Greenkeeper',
  'Events Manager',
  'Food & Beverage',
];

const MAX_LEN = 40;

interface Props {
  open: boolean;
  onClose: () => void;
  businessId: string;
  memberUserId: string;
  currentTitle: string | null;
}

export default function JobTitleSheet({ open, onClose, businessId, memberUserId, currentTitle }: Props) {
  const setJobTitle = useSetMemberJobTitle(businessId);
  const isPreset = !!currentTitle && PRESETS.includes(currentTitle);
  const [customOpen, setCustomOpen] = useState<boolean>(!!currentTitle && !isPreset);
  const [customValue, setCustomValue] = useState<string>(!isPreset ? (currentTitle ?? '') : '');

  useEffect(() => {
    if (open) {
      const preset = !!currentTitle && PRESETS.includes(currentTitle);
      setCustomOpen(!!currentTitle && !preset);
      setCustomValue(!preset ? (currentTitle ?? '') : '');
    }
  }, [open, currentTitle]);

  const save = async (title: string) => {
    try {
      await setJobTitle.mutateAsync({ memberUserId, jobTitle: title });
      onClose();
    } catch {}
  };

  return (
    <BottomSheet open={open} onClose={onClose} surfaceColor={SURFACE} style={{ background: SURFACE }}>
      <div style={{ padding: '4px 20px 20px', maxHeight: '75dvh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: INK, letterSpacing: '-0.02em', margin: '4px 0 12px' }}>
          Job title
        </h2>

        <div>
          {PRESETS.map((p) => {
            const active = currentTitle === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => save(p)}
                disabled={setJobTitle.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '13px 4px', background: 'transparent', border: 0,
                  borderTop: `1px solid ${HAIR}`, textAlign: 'left', cursor: 'pointer',
                }}
              >
                <span style={{ flex: 1, fontSize: 14.5, color: INK, fontWeight: active ? 700 : 500 }}>{p}</span>
                {active && <Check size={16} color={AMBER} strokeWidth={2.5} />}
              </button>
            );
          })}

          {/* Custom */}
          <div style={{ borderTop: `1px solid ${HAIR}` }}>
            {!customOpen ? (
              <button
                type="button"
                onClick={() => setCustomOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '13px 4px', background: 'transparent', border: 0, textAlign: 'left', cursor: 'pointer',
                }}
              >
                <span style={{ flex: 1, fontSize: 14.5, color: INK, fontWeight: 500 }}>Custom title</span>
                <span style={{ fontSize: 12, color: INK_45 }}>Add your own</span>
              </button>
            ) : (
              <div style={{ padding: '12px 0' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: INK_45, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Custom title
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={customValue}
                    maxLength={MAX_LEN}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="e.g. Tournament Director"
                    style={{
                      flex: 1, padding: '10px 12px', border: `1px solid ${HAIR}`,
                      borderRadius: 10, background: '#FFFFFF', color: INK, fontSize: 14, outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const t = customValue.trim();
                      if (!t) return;
                      save(t);
                    }}
                    disabled={setJobTitle.isPending || !customValue.trim()}
                    style={{
                      padding: '0 16px', minHeight: 40, borderRadius: 10, border: 0,
                      background: INK, color: '#FFFFFF', fontSize: 13, fontWeight: 700,
                      opacity: !customValue.trim() ? 0.5 : 1, cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: INK_45, textAlign: 'right' }}>
                  {customValue.length}/{MAX_LEN}
                </div>
              </div>
            )}
          </div>
        </div>

        {!!currentTitle && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => save('')}
              disabled={setJobTitle.isPending}
              style={{
                background: 'transparent', border: 0, color: '#DC2626',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 8,
              }}
            >
              Remove title
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
