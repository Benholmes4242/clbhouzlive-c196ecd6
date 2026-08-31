import { useEffect, useState } from 'react';
import { Search, X, MapPin, Check, ChevronLeft, Loader2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FIELD_PAINT_CLASS, FIELD_PLACEHOLDER_CLASS } from '@/lib/tokens/field';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { TITLE } from '@/lib/tokens/type';
import { RequestCourseCTA } from '@/components/courses/RequestCourseCTA';
import { useHomeClubSearch, type HomeClubHit } from './useHomeClubSearch';
import { useSetHomeClub } from './useSetHomeClub';

interface Props {
  open: boolean;
  onClose: () => void;
  /** When provided the picker hands the club back rather than writing it. */
  onSelected?: (club: { id: string; name: string }) => void;
}

/**
 * BRIEF_HOME_CLUB_PICKER §1 — search-only home club picker.
 *
 * SEARCH ONLY. There is no browse-by-country and there must never be one:
 * golf_clubs.country is a continent-level bucket, not a country. Region and
 * sub_country appear on a row for disambiguation only.
 *
 * Selecting a club is an identity statement, so a tap opens a CONFIRM step
 * before anything is written.
 */
export function HomeClubPickerSheet({ open, onClose, onSelected }: Props) {
  const [query, setQuery] = useState('');
  const [candidate, setCandidate] = useState<HomeClubHit | null>(null);
  const { data: results, loading, error } = useHomeClubSearch(query);
  const setHomeClub = useSetHomeClub();

  useEffect(() => {
    if (open) {
      setQuery('');
      setCandidate(null);
    }
  }, [open]);

  const place = (c: HomeClubHit) =>
    [c.sub_country, c.region].filter(Boolean).join(' · ');

  const confirm = async () => {
    if (!candidate) return;
    const club = { id: candidate.id, name: candidate.name };
    if (onSelected) {
      onSelected(club);
    } else {
      await setHomeClub.mutateAsync(club);
    }
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabelledBy="home-club-title" zIndexBase={10250}>
      <div className="px-5 pt-2 pb-5">
        {candidate ? (
          /* ---------- CONFIRM ---------- */
          <div>
            <button
              type="button"
              onClick={() => setCandidate(null)}
              className="flex items-center gap-1 text-[13px] font-semibold min-h-[44px]"
              style={{ color: A.MUTE }}
            >
              <ChevronLeft size={16} /> Back to search
            </button>
            <h2 id="home-club-title" style={{ ...TITLE, color: A.INK }} className="mt-1">
              Set this as your home club?
            </h2>
            <div
              className="mt-3 rounded-[14px] px-4 py-3.5"
              style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}
            >
              <div className="flex items-center gap-2.5">
                <MapPin size={16} style={{ color: A.AMBER }} />
                <span className="text-[16px] font-semibold" style={{ color: A.INK }}>
                  {candidate.name}
                </span>
              </div>
              {place(candidate) && (
                <p className="text-[13px] mt-1 pl-[26px]" style={{ color: A.MUTE }}>
                  {place(candidate)}
                </p>
              )}
            </div>
            <p className="text-[13px] mt-3" style={{ color: A.MUTE }}>
              This appears on your profile. You can change it at any time.
            </p>
            <button
              type="button"
              onClick={confirm}
              disabled={setHomeClub.isPending}
              className="w-full h-12 mt-4 rounded-[14px] text-[15px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: A.AMBER }}
            >
              {setHomeClub.isPending
                ? <><Loader2 size={18} className="animate-spin" /> Saving…</>
                : <><Check size={18} strokeWidth={2.5} /> Confirm home club</>}
            </button>
          </div>
        ) : (
          /* ---------- SEARCH ---------- */
          <div>
            <h2 id="home-club-title" style={{ ...TITLE, color: A.INK }}>Your home club</h2>
            <p className="text-[13px] mt-1" style={{ color: A.MUTE }}>
              Search for the club you call home.
            </p>

            <div className="relative mt-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: A.DIM }} />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 23,000+ clubs"
                className={`${FIELD_PAINT_CLASS} ${FIELD_PLACEHOLDER_CLASS} w-full h-12 pl-9 pr-10 text-[15px] focus:outline-none`}
                style={{ color: A.INK }}
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-0 top-0 h-full min-w-[44px] flex items-center justify-center"
                  style={{ color: A.DIM }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="mt-2 max-h-[46dvh] overflow-y-auto -mx-1 px-1">
              {query.trim().length < 2 ? null : loading ? (
                <p className="text-[13px] px-1 py-3" style={{ color: A.MUTE }}>Searching…</p>
              ) : error ? (
                <p className="text-[13px] px-1 py-3" style={{ color: A.RED }}>{error}</p>
              ) : results.length === 0 ? (
                /* §3.2 — the catalogue has real gaps; reuse the existing
                   request sheet rather than building a second flow. */
                <div className="pt-1">
                  <RequestCourseCTA
                    variant="hero"
                    tone="dark"
                    prefillName={query.trim()}
                    homeClub
                    onBeforeOpen={onClose}
                  />
                </div>
              ) : (
                results.map((club) => (
                  <button
                    key={club.id}
                    type="button"
                    onClick={() => setCandidate(club)}
                    className="w-full flex items-center gap-3 text-left py-3"
                    style={{ borderBottom: `0.5px solid ${A.HAIRLINE}` }}
                  >
                    <MapPin size={16} className="shrink-0" style={{ color: A.DIM }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium truncate" style={{ color: A.INK }}>
                        {club.name}
                      </p>
                      {place(club) && (
                        <p className="text-[12.5px] truncate" style={{ color: A.MUTE }}>
                          {place(club)}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

export default HomeClubPickerSheet;
