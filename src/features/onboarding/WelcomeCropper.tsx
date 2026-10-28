import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { getCroppedImg } from '@/components/profile/edit-v2/ImageCropperModal';

/** OB1.2 full-screen squircle cropper, first sign-in only. Pinch/drag only:
 * no slider, grid or reset. Output reuses Edit profile's getCroppedImg (same
 * 1440px cap and JPEG quality); Edit profile's own dialog is untouched. */
export function WelcomeCropper({ image, onCancel, onUse }: { image: string; onCancel: () => void; onUse: (file: File) => void }) {
  const { t } = useTranslation('auth');
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 }); const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null); const [busy, setBusy] = useState(false);
  const onComplete = useCallback((_a: Area, pixels: Area) => setArea(pixels), []);
  const use = async () => {
    if (!area || busy) return; setBusy(true);
    try { const blob = await getCroppedImg(image, area); onUse(new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' })); } finally { setBusy(false); }
  };
  return createPortal(<div className="welcome-cropper" role="dialog" aria-modal="true" aria-label={t('welcome.cropTitle', { defaultValue: 'Move and scale' })} data-welcome-cropper>
    <Cropper image={image} crop={crop} zoom={zoom} aspect={1} cropShape="rect" showGrid={false} objectFit="cover" onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onComplete} classes={{ cropAreaClassName: 'welcome-crop-area' }} />
    <div className="welcome-cropper-head"><b>{t('welcome.cropTitle', { defaultValue: 'Move and scale' })}</b><span>{t('welcome.cropSub', { defaultValue: 'Pinch to zoom, drag to position' })}</span></div>
    <div className="welcome-cropper-foot"><p>{t('welcome.cropHint', { defaultValue: 'This is how golfers will see you.' })}</p><div><button type="button" className="welcome-cropper-cancel" onClick={onCancel}>{t('welcome.cancel', { defaultValue: 'Cancel' })}</button><button type="button" className="welcome-cropper-use" disabled={!area || busy} onClick={() => void use()}>{t('welcome.usePhoto', { defaultValue: 'Use photo' })}</button></div></div>
  </div>, document.body);
}
