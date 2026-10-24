/**
 * BRIEF_TOP_TEN_SHARE_CARD_V2 §5 — the "Share your ten" sheet, exact to
 * top10_share_sheet.html on the app's existing BottomSheet: title + Done,
 * Story 9:16 / Post 4:5 segmented control (Story default), a live 0.6-scale
 * preview (story 243x432), "Show my handicap" / "Photo of my number one"
 * toggles (both default on), outline Save image and white primary Share.
 *
 * §4 PHOTOS: positions 1-3 thumbnails are fetched as blobs with CORS and
 * handed to the card as object URLs, so the canvas is never tainted; object
 * URLs are revoked when the sheet closes. A failed fetch leaves a null slot
 * and the card draws its #16161A panel instead of a broken image.
 *
 * Capture is of the off-screen FULL-SIZE card (never the scaled preview) at
 * scale 1080/405: story 1080x1920, post 1080x1349, backgroundColor #0A0A0C,
 * useCORS true. Share keeps the existing navigator.share path
 * (title "My top 10", file my-top-10.png, download fallback); Save image is
 * the download alone. The existing error toast is kept.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { toast } from '@/lib/toast';
import {
  TopTenShareCard,
  type TopTenShareCourse,
  type TopTenShareCardIdentity,
} from './TopTenShareCard';

interface Props {
  open: boolean;
  onClose: () => void;
  courses: TopTenShareCourse[];
  identity: TopTenShareCardIdentity;
}

const PREVIEW_SCALE = 0.6; // mock: the 405px card previews at 243px wide
const INK_62 = 'rgba(248,250,252,0.62)';
const SHEET_RULE = 'rgba(255,255,255,0.07)';

export const TopTenShareSheet: React.FC<Props> = ({ open, onClose, courses, identity }) => {
  const { t } = useTranslation('profile');
  const [format, setFormat] = React.useState<'story' | 'post'>('story');
  const [showHandicap, setShowHandicap] = React.useState(true);
  const [showHeroPhoto, setShowHeroPhoto] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [photos, setPhotos] = React.useState<(string | null)[]>([null, null, null]);
  const captureRef = React.useRef<HTMLDivElement>(null);

  const photoKey = courses.slice(0, 3).map((c) => c?.thumbnail_image ?? '').join('|');

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const made: string[] = [];
    (async () => {
      const next: (string | null)[] = [null, null, null];
      await Promise.all(
        courses.slice(0, 3).map(async (c, i) => {
          const src = c?.thumbnail_image;
          if (!src) return;
          try {
            const res = await fetch(src, { mode: 'cors' });
            if (!res.ok) throw new Error(String(res.status));
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            made.push(url);
            next[i] = url;
          } catch {
            /* null slot -> the card renders its #16161A panel */
          }
        }),
      );
      if (cancelled) made.forEach((u) => URL.revokeObjectURL(u));
      else setPhotos(next);
    })();
    return () => {
      cancelled = true;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, photoKey]);

  const cardProps = { format, courses, identity, showHandicap, showHeroPhoto, photos };
  const story = format === 'story';

  const capture = async (): Promise<Blob> => {
    const el = captureRef.current;
    if (!el) throw new Error('nothing to capture');
    const canvas = await html2canvas(el, {
      backgroundColor: '#0A0A0C',
      scale: 1080 / 405,
      useCORS: true,
      logging: false,
    });
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) throw new Error('capture failed');
    return blob;
  };

  const download = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-top-10.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await capture();
      const file = new File([blob], 'my-top-10.png', { type: 'image/png' });
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: t('topTen.share.cardTitle', 'My top 10') });
          return;
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
        }
      }
      download(blob);
    } catch {
      toast.error("Couldn't create your card");
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      download(await capture());
    } catch {
      toast.error("Couldn't create your card");
    } finally {
      setBusy(false);
    }
  };

  const segBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    minHeight: 36,
    border: 'none',
    borderRadius: 9,
    background: active ? '#F8FAFC' : 'transparent',
    color: active ? '#0A0A0C' : INK_62,
    fontSize: 13,
    fontWeight: active ? 800 : 700,
    cursor: 'pointer',
  });

  return (
    <BottomSheet open={open} onClose={onClose} topRadius={22} scrollBody ariaLabelledBy="top-ten-share-title">
      <div style={{ padding: '4px 20px 0' }}>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h1 id="top-ten-share-title" style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>
            {t('topTen.share.title', 'Share your ten')}
          </h1>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', padding: 0, minHeight: 44, fontSize: 13, fontWeight: 700, color: INK_62, cursor: 'pointer' }}
          >
            {t('topTen.share.done', 'Done')}
          </button>
        </div>

        <div style={{ marginTop: 4, display: 'flex', gap: 6, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.06)' }}>
          <button type="button" onClick={() => setFormat('story')} style={segBtn(story)}>
            {t('topTen.share.formatStory', 'Story 9:16')}
          </button>
          <button type="button" onClick={() => setFormat('post')} style={segBtn(!story)}>
            {t('topTen.share.formatPost', 'Post 4:5')}
          </button>
        </div>

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: 243,
              height: story ? 432 : 303.6,
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
            }}
          >
            <div style={{ width: 405, height: story ? 720 : 506, transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }}>
              <TopTenShareCard {...cardProps} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, borderTop: `1px solid ${SHEET_RULE}`, fontSize: 14, fontWeight: 600 }}>
            <span>{t('topTen.share.showHandicap', 'Show my handicap')}</span>
            <input
              type="checkbox"
              checked={showHandicap}
              onChange={(e) => setShowHandicap(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: '#2FA35A' }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, borderTop: `1px solid ${SHEET_RULE}`, borderBottom: `1px solid ${SHEET_RULE}`, fontSize: 14, fontWeight: 600 }}>
            <span>{t('topTen.share.showHeroPhoto', 'Photo of my number one')}</span>
            <input
              type="checkbox"
              checked={showHeroPhoto}
              onChange={(e) => setShowHeroPhoto(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: '#2FA35A' }}
            />
          </label>
        </div>

        <div
          style={{
            marginTop: 16,
            display: 'flex',
            gap: 10,
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
          }}
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            style={{ flex: 1, minHeight: 50, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, background: 'transparent', color: '#F8FAFC', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            {t('topTen.share.saveImage', 'Save image')}
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={busy}
            style={{ flex: 1.4, minHeight: 50, border: 'none', borderRadius: 14, background: '#F8FAFC', color: '#0A0A0C', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
          >
            {t('topTen.share.shareNow', 'Share')}
          </button>
        </div>
      </div>

      {/* Off-screen full-size card; capture never uses the scaled preview. */}
      <div aria-hidden style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }}>
        <div ref={captureRef}>
          <TopTenShareCard {...cardProps} />
        </div>
      </div>
    </BottomSheet>
  );
};

export default TopTenShareSheet;
