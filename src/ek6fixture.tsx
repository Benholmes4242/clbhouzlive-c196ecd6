/* TEMPORARY ek6 spacing fixture — deleted after measurement. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { EdgeSection } from './components/courses/course-detail/you/many/ManySections';
import { edgeSummary, type HoleEdge } from './lib/courseYou/youDerivations';

const EDGES: HoleEdge[] = [
  { hole_no: 1, par: 4, field: 0.42, you: 0.1, timesPlayed: 12, edge: 0.32, birdied: true },
  { hole_no: 2, par: 5, field: 0.18, you: -0.2, timesPlayed: 12, edge: 0.38, birdied: true },
  { hole_no: 3, par: 3, field: 0.3, you: 0.3, timesPlayed: 11, edge: 0.0, birdied: false },
  { hole_no: 4, par: 4, field: -0.15, you: 0.35, timesPlayed: 12, edge: -0.5, birdied: false },
  { hole_no: 5, par: 4, field: 0.55, you: 0.05, timesPlayed: 12, edge: 0.5, birdied: true },
  { hole_no: 6, par: 4, field: 0.2, you: 0.2, timesPlayed: 10, edge: 0.0, birdied: false },
  { hole_no: 7, par: 5, field: 0.9, you: 0.1, timesPlayed: 12, edge: 0.8, birdied: true },
  { hole_no: 8, par: 4, field: 0.12, you: 0.1, timesPlayed: 12, edge: 0.02, birdied: false },
  { hole_no: 9, par: 4, field: 0.48, you: 0.2, timesPlayed: 12, edge: 0.28, birdied: true },
  { hole_no: 10, par: 4, field: 0.35, you: 0.0, timesPlayed: 12, edge: 0.35, birdied: true },
  { hole_no: 11, par: 3, field: 0.25, you: 0.25, timesPlayed: 11, edge: 0.0, birdied: false },
  { hole_no: 12, par: 5, field: 0.7, you: 0.15, timesPlayed: 12, edge: 0.55, birdied: true },
  { hole_no: 13, par: 4, field: -0.05, you: 0.4, timesPlayed: 12, edge: -0.45, birdied: false },
  { hole_no: 14, par: 4, field: 0.62, you: 0.1, timesPlayed: 12, edge: 0.52, birdied: true },
  { hole_no: 15, par: 4, field: 0.15, you: 0.15, timesPlayed: 10, edge: 0.0, birdied: false },
  { hole_no: 16, par: 5, field: 0.85, you: 0.2, timesPlayed: 12, edge: 0.65, birdied: true },
  { hole_no: 17, par: 3, field: 0.4, you: 0.35, timesPlayed: 12, edge: 0.05, birdied: false },
  { hole_no: 18, par: 4, field: 0.5, you: 0.0, timesPlayed: 12, edge: 0.5, birdied: true },
];

const s = edgeSummary(EDGES);

createRoot(document.getElementById('root')!).render(
  <EdgeSection edges={EDGES} s={s} fieldRounds={1284} onAllHoles={() => {}} />,
);
