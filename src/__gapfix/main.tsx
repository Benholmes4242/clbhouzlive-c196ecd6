import '@/index.css';
import '@/i18n';
import '@/features/tourhub/tournament-v2/tournamentPage.css';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { UpcomingFacts, UpcomingLastYear, UpcomingCourse } from '@/features/tourhub/components/overview-v3/UpcomingOverviewSections';
import { CourseV3Section } from '@/features/tourhub/tournament-v2/sections/TournamentV3Sections';
const holes = Array.from({ length: 18 }, (_, i) => ({ hole_no: i + 1, par: [4,4,3,5][i%4], yards: 300 + i * 20 })) as any;
const last = [{ rank: '1', name: 'Scottie Scheffler', score: '-20', year: 2025 }, { rank: '2', name: 'Rory McIlroy', score: '-18', year: 2025 }, { rank: 'T3', name: 'Xander Schauffele', score: '-16', year: 2025 }, { rank: 'T3', name: 'Jon Rahm', score: '-16', year: 2025 }] as any;
createRoot(document.getElementById('root')!).render(<MemoryRouter>
  <div id="ov" className="tournament-v3"><UpcomingFacts first={null} zone={null} field={144} purse={9000000} par={72} yards={7200} /><UpcomingLastYear rows={last} /><UpcomingCourse holes={holes} tournamentId="t" /></div>
  <div id="tp" className="tournament-v3"><UpcomingFacts first={null} zone={null} field={144} purse={9000000} par={72} yards={7200} /><UpcomingLastYear rows={last} /><CourseV3Section id="t" phase="upcoming" holes={holes} analysis={null} rows={[]} currentRound={1} /></div>
</MemoryRouter>);
