import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import SheetHeader from '@/components/ui/SheetHeader';
import { PlayerInitialAvatar } from '../shared/PlayerInitialAvatar';
import { LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { useCollegeSearch } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { collegeH2HRoute } from '../../routes';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import {
  HAIRLINE_INK_8,
  INK,
  INK_ALPHA_45,
  INK_TINT_05,
  INK_TINT_06,
  SURFACE,
} from '../../_shared/tokens';

function formatCollegeName(normalizedName: string): string {
  return normalizedName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

interface Props {
  open: boolean;
  onClose: () => void;
  c1: string;
  c1DisplayName: string;
}

export function CollegeComparePickerSheet({ open, onClose, c1, c1DisplayName }: Props) {
  const navigate = useNavigate();
  const [pickerInput, setPickerInput] = useState('');
  const debouncedPickerInput = useDebouncedValue(pickerInput, 200);
  const showPickerResults = debouncedPickerInput.length >= 2;
  const { data: pickerResults, isLoading: pickerLoading } = useCollegeSearch(
    showPickerResults ? debouncedPickerInput : '',
  );
  const { data: collegeMap } = useCollegeMediaMap();

  const handlePick = (c2: string) => {
    setPickerInput('');
    onClose();
    navigate(collegeH2HRoute(c1, c2));
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="college-compare-picker-title"
    >
      <SheetHeader
        eyebrow="HEAD-TO-HEAD"
        title={
          <span id="college-compare-picker-title">Pick a college to compare</span>
        }
        sub={`Compared against ${c1DisplayName}`}
        onClose={onClose}
      />

      <div style={{ padding: '16px 20px 20px' }}>
        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(15,23,42,0.4)',
            }}
          />
          <input
            type="text"
            value={pickerInput}
            onChange={(e) => setPickerInput(e.target.value)}
            placeholder="Search colleges"
            autoFocus
            style={{
              width: '100%',
              height: 48,
              padding: '0 40px 0 44px',
              background: SURFACE,
              border: `1px solid ${HAIRLINE_INK_8}`,
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 500,
              color: INK,
              outline: 'none',
            }}
          />
          {pickerInput && (
            <button
              onClick={() => setPickerInput('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: INK_TINT_06,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Clear search"
            >
              <X size={14} color={INK} />
            </button>
          )}
        </div>

        {/* Results */}
        {!showPickerResults ? (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              fontSize: 13,
              color: INK_ALPHA_45,
              fontWeight: 500,
            }}
          >
            Start typing to find a college
          </div>
        ) : pickerLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{ height: 60, borderRadius: 12, background: INK_TINT_05 }}
              />
            ))}
          </div>
        ) : pickerResults && pickerResults.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pickerResults
              .filter((stats) => stats.normalized_name !== c1)
              .map((stats) => {
                const college = collegeMap?.get(stats.normalized_name) || null;
                const displayName =
                  college?.short_name ||
                  college?.college_name ||
                  formatCollegeName(stats.normalized_name);
                const logoUrl = getCollegeLogoUrl(
                  college?.college_name || displayName,
                );
                const earnings =
                  (stats as any).season_earnings ??
                  (stats as any).earnings_total ??
                  0;
                return (
                  <button
                    key={stats.normalized_name}
                    onClick={() => handlePick(stats.normalized_name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: 12,
                      background: SURFACE,
                      border: `1px solid ${HAIRLINE_INK_8}`,
                      borderRadius: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    className="active:scale-[0.98] transition-transform"
                  >
                    <PlayerInitialAvatar
                      name={displayName}
                      src={logoUrl}
                      size={40}
                      radius={9}
                      paletteSeed={stats.normalized_name}
                      imageScale={0.78}
                      imageBg="#FFFFFF"
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: INK,
                          letterSpacing: '-0.01em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {displayName}
                      </div>
                      {earnings > 0 && (
                        <div
                          style={{
                            fontSize: 12,
                            color: 'rgba(15,23,42,0.5)',
                            fontWeight: 500,
                            marginTop: 2,
                          }}
                        >
                          {earnings >= 1_000_000
                            ? `$${(earnings / 1_000_000).toFixed(1)}M season`
                            : `${formatCurrency(earnings)} season`}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              fontSize: 13,
              color: INK_ALPHA_45,
              fontWeight: 500,
            }}
          >
            No colleges found matching "{debouncedPickerInput}"
          </div>
        )}
      </div>
      <div
        style={{
          paddingBottom:
            'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 8px)',
        }}
      />
    </BottomSheet>
  );
}
