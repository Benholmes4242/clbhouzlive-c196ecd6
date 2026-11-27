/** Brief 42: TenRailCard's sibling for video rails. Shares clbhouz-ten.css (.clb-ten scope) so its
 * geometry, fade, rank, bottom block and stat row are the chart card's; the photo slot takes any media
 * and both text lines take any content. TenRailCard itself is unchanged (Courses chart, profile ten). */
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { TenRailFigure } from '@/components/topTen/TenRailCard';

interface Props {
  rank: number;
  media: ReactNode;
  name: ReactNode;
  place: ReactNode;
  corner?: ReactNode;
  figures: TenRailFigure[];
  story?: string | null;
  ariaLabel: string;
  onClick: () => void;
  dataId?: string;
}
export function TenMediaCard({ rank, media, name, place, corner, figures, story, ariaLabel, onClick, dataId }: Props) {
  return <Button variant="ghost" className="clb-ten-card" aria-label={ariaLabel} onClick={onClick} data-ten-rail-rank={rank} data-ten-media-card={dataId}>
    <div className="clb-ten-media">
      {media}
      <div className="clb-ten-fade" /><span className="clb-ten-rank">{rank}</span>
      {corner}
      <div className="clb-ten-bottom"><div className="clb-ten-name">{name}</div><div className="clb-ten-county">{place}</div>
        <div className="clb-ten-stats">{figures.map(figure => <div className="clb-ten-stat" key={figure.label}><b data-missing={figure.missing || undefined}>{figure.value}</b><small>{figure.label}</small></div>)}<div className="clb-ten-story">{story ?? ''}</div></div>
      </div>
    </div>
  </Button>;
}
