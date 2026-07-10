// PostV2Page - test route host for the new Stage composer.
// Cutover of the global portal happens in P4; this route lets us dogfood
// the whole pipeline in isolation without touching the live entry point.

import { useNavigate } from 'react-router-dom';
import StageComposer from './StageComposer';

export default function PostV2Page() {
  const navigate = useNavigate();
  return <StageComposer onClose={() => navigate(-1)} onPosted={() => navigate('/clubhouse')} />;
}
