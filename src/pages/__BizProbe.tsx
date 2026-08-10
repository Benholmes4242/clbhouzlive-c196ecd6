import BusinessEmptyState from '@/components/business/BusinessEmptyState';
export default function BizProbe() {
  return (
    <div data-probe style={{ background: '#F8FAFC', minHeight: '100vh', padding: 16 }}>
      <BusinessEmptyState onCreate={() => {}} />
    </div>
  );
}
