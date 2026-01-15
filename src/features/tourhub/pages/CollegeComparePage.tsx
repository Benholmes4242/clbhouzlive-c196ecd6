import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { TourHubShell } from '../components';
import { CollegeCompareHero } from '../components/college/CollegeCompareHero';
import { useCollegeCompare } from '../hooks/useCollegeCompare';

/**
 * College Compare Page - Side-by-side comparison of two colleges.
 * Route: /tourhub/college-golf/compare?c1=<slug>&c2=<slug>
 */
export function CollegeComparePage() {
  const [searchParams] = useSearchParams();
  const c1 = searchParams.get('c1') || '';
  const c2 = searchParams.get('c2') || '';
  
  const { data, isLoading, error } = useCollegeCompare(c1, c2);
  
  const hasValidParams = c1 && c2;
  
  return (
    <TourHubShell>
      {/* Back Link */}
      <div className="pt-4">
        <Link 
          to="/tourhub/college-golf" 
          className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          College Golf
        </Link>
      </div>
      
      {/* Header */}
      <header className="py-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#f1f5f9] flex items-center justify-center">
            <GitCompare className="w-6 h-6 text-[#64748b]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">
              College Comparison
            </h1>
            <p className="text-sm text-[#64748b]">
              Head-to-head alumni performance
            </p>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="pb-8">
        {!hasValidParams ? (
          <div className="text-center py-16">
            <p className="text-base text-[#64748b] mb-4">
              Select two colleges to compare
            </p>
            <Link 
              to="/tourhub/college-golf" 
              className="text-[#1e293b] font-medium hover:underline"
            >
              Browse colleges
            </Link>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            <div className="h-32 bg-white border border-[#e2e8f0] rounded-xl animate-pulse" />
            <div className="h-48 bg-white border border-[#e2e8f0] rounded-xl animate-pulse" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-base text-[#64748b]">
              Failed to load comparison data
            </p>
          </div>
        ) : data ? (
          <CollegeCompareHero data={data} />
        ) : null}
      </div>
    </TourHubShell>
  );
}
