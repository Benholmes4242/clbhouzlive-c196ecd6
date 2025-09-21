import * as React from 'react';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** alternate URL to retry (e.g., different timestamp) */
  retrySrc?: string;
  /** final placeholder if both src & retry fail */
  placeholderSrc: string;
  onHardFail?: () => void; // optional breadcrumb
};

export function ImageWithFallback({
  src,
  retrySrc,
  placeholderSrc,
  onHardFail,
  ...imgProps
}: Props) {
  const [currentSrc, setCurrentSrc] = React.useState(src ?? '');
  const triedRetryRef = React.useRef(false);

  const handleError = () => {
    // try alternate poster once (e.g., different timestamp)
    if (retrySrc && !triedRetryRef.current) {
      triedRetryRef.current = true;
      setCurrentSrc(retrySrc);
      return;
    }
    setCurrentSrc(placeholderSrc);
    onHardFail?.();
  };

  React.useEffect(() => {
    // reset when src changes (e.g., different user)
    triedRetryRef.current = false;
    setCurrentSrc(src ?? '');
  }, [src]);

  return (
    <img
      {...imgProps}
      src={currentSrc}
      onError={handleError}
      loading={imgProps.loading ?? 'lazy'}
      decoding={imgProps.decoding ?? 'async'}
      alt={imgProps.alt ?? ''}
    />
  );
}