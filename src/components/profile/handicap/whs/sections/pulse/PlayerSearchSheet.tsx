import React, { useEffect, useRef, useState } from 'react';
import { Search, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GamSheet from '@/components/profile/handicap/gam/_shared/GamSheet';
import { Skeleton, EmptyStub, RetryStub } from '@/components/profile/handicap/gam/_shared/GamAtoms';
import SectionHeader from '@/components/ui/SectionHeader';
import { usePlayerSearch, type PlayerSearchResult } from '@/hooks/gam/usePlayerSearch';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  open: boolean;
  onClose: () => void;
}

function colorFromUserId(id: string): string {
  const palette = ['#475569', '#7C2D12', '#1E3A8A', '#831843', '#064E3B', '#92400E', '#581C87', '#0F766E'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length];
}

const PlayerRow: React.FC<{ p: PlayerSearchResult; onTap: () => void }> = ({ p, onTap }) => {
  const initial = (p.display_name || '?').charAt(0).toUpperCase();
  const hcpLabel = p.handicap_index != null ? `HCP ${p.handicap_index.toFixed(1)}` : 'HCP —';
  return (
    <div
      onClick={onTap}
      style={{
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        borderRadius: 12,
        padding: 14,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: FONT,
      }}
    >
      {p.profile_photo_url ? (
        <img
          src={p.profile_photo_url}
          alt=""
          style={{ width: 40, height: 40, borderRadius: '34%', objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '34%',
            background: colorFromUserId(p.id),
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--hcp-t-100)',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {p.display_name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--hcp-t-60)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
          {hcpLabel}
        </div>
      </div>
      <ChevronRight size={18} color="var(--hcp-t-60)" style={{ flexShrink: 0 }} />
    </div>
  );
};

export const PlayerSearchSheet: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [debounced, setDebounced] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setValue('');
      setDebounced('');
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), 250);
    return () => clearTimeout(t);
  }, [value]);

  const { data: results = [], isLoading, isError, refetch } = usePlayerSearch(debounced);
  const q = debounced.trim();

  const handleSelect = (id: string) => {
    onClose();
    navigate(`/handicap/${id}`);
  };

  return (
    <GamSheet open={open} onClose={onClose}>
      {/* Drag handle */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, flexShrink: 0 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--hcp-line-2)' }} />
      </div>

      {/* Sticky header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px 10px',
          borderBottom: '0.5px solid var(--hcp-line)',
          fontFamily: FONT,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--hcp-t-100)' }}>Find a player</div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--hcp-t-60)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 24 }}>
        <div style={{ padding: '20px 16px 0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--hcp-bg-1)',
              border: '1px solid var(--hcp-line)',
              borderRadius: 12,
              padding: '10px 14px',
            }}
          >
            <Search size={16} color="var(--hcp-t-60)" />
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Search players by name"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: FONT,
                fontSize: 14,
                color: 'var(--hcp-t-100)',
              }}
            />
          </div>
        </div>

        {q.length >= 2 && (
          <>
            <div style={{ marginTop: 24 }}><SectionHeader tier="standard" kicker="SEARCH RESULTS" paddingX={16} /></div>
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isLoading && <Skeleton height={68} radius={12} />}
              {isError && <RetryStub message="Couldn't search players" onRetry={() => refetch()} />}
              {!isLoading && !isError && results.length === 0 && (
                <EmptyStub title="No matches" body={`Nothing found for "${q}".`} />
              )}
              {!isLoading &&
                !isError &&
                results.map((p) => <PlayerRow key={p.id} p={p} onTap={() => handleSelect(p.id)} />)}
            </div>
          </>
        )}
      </div>
    </GamSheet>
  );
};

export default PlayerSearchSheet;
