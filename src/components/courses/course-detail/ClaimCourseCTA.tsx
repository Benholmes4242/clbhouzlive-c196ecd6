import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';

interface ClaimCourseCTAProps {
  clubId: string;
  clubName: string;
}

const ClaimCourseCTA: React.FC<ClaimCourseCTAProps> = ({ clubId, clubName }) => {
  const navigate = useNavigate();

  const handleClaim = () => {
    const params = new URLSearchParams({
      category: 'golf_club',
      clubId,
      clubName,
    });
    navigate(`/business/create?${params.toString()}`);
  };

  return (
    <section className="px-4 py-5">
      <div className="p-6 text-center">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Own or manage this course?
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Claim this course to respond to reviews, update information, and access insights.
        </p>
        <button
          onClick={handleClaim}
          className="active:scale-[0.97] transition-all"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '10px 24px', borderRadius: 999,
            background: 'rgba(247,147,30,0.10)',
            border: '1px solid rgba(247,147,30,0.25)',
            color: '#F7931E', fontSize: 14, fontWeight: 600,
          }}
        >
          Claim this course →
        </button>
      </div>
    </section>
  );
};

export default ClaimCourseCTA;
