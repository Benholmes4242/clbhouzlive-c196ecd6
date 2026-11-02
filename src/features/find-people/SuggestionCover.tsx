/** Decorative rail-only cover. A failed URL retains the no-cover material;
 * changing the URL remounts the image state in the parent. */
import { useState } from 'react';
import { imageSrc } from '@/utils/imageSrc';

export function SuggestionCover({ url }: { url?: string }) {
  const [failed, setFailed] = useState(false);
  const hasImage = !!url && !failed;
  return (
    <div className="suggestion-cover" data-suggestion-cover={hasImage ? 'image' : 'plain'} aria-hidden="true">
      {hasImage && <>
        <img src={imageSrc(url, 344)} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
        <span className="suggestion-cover-scrim" />
      </>}
    </div>
  );
}