import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react-swc'; import path from 'path';
const mock=path.resolve('/tmp/r1-harness/src/mocks.ts');
export default defineConfig({root:'/tmp/r1-harness',plugins:[react()],resolve:{alias:{'@/hooks/useReviewerStats':mock,'@/hooks/useCourseRatingAggregates':mock,'@/components/posts/useReviewMedia':mock,'@/hooks/useReviewFallback':mock,'@':path.resolve('/dev-server/src')}},define:{__BUILD_ID__:JSON.stringify('r1'),__BUILD_STAMP__:JSON.stringify('r1')},server:{port:4175,host:'127.0.0.1'}});
