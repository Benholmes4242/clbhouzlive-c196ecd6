/* TEMPORARY verification specimen — deleted after measurement. */
import { DiscoverHero } from '@/components/explore-tab-new/courseled/DiscoverHero';
import { selectMoment } from '@/components/explore-tab-new/courseled/roundMoment';
import { A } from '@/components/explore-tab-new/courseled/tokens';

const holes = Array.from({ length: 18 }, (_, i) => ({
  hole_number: i + 1,
  par: 4,
  strokes: i < 4 ? 3 : 4,
}));

export default function HeroSpecimen() {
  const moment = selectMoment(holes as never);
  return (
    <div style={{ background: A.CANVAS, minHeight: '100vh' }}>
      <DiscoverHero
        subject={{
          row: {
            round_id: 'r1',
            score_id: 's1',
            user_id: 'u1',
            display_name: 'Wilfrid Kerrigan',
            profile_photo_url: null,
            course_id: 'c1',
            course_name: 'Sundridge Park Golf Club',
            play_date: '2026-08-20',
            gross: 68,
            course_par: 72,
            is_self: false,
          } as never,
          moment,
          courseName: 'Sundridge Park Golf Club',
          region: 'Kent',
          imageUrl: null,
        }}
        onPress={() => {}}
      />
      <div style={{ height: 400 }} />
    </div>
  );
}
