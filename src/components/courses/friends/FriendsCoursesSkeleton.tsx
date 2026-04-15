import React from 'react';

const FriendsCoursesSkeleton: React.FC = () => {
  return (
    <div style={{ background: '#F8FAFC' }} className="animate-pulse">
      {/* Slate masthead skeleton */}
      <div style={{ background: '#0F172A', padding: '16px 16px 0' }}>
        <div style={{ height: '11px', width: '180px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', marginBottom: '12px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ height: '24px', width: '160px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', marginBottom: '6px' }} />
            <div style={{ height: '11px', width: '220px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <div style={{ height: '28px', width: '80px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ padding: '9px 0 11px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
              <div style={{ height: '9px', width: '36px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ height: '13px', width: '24px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Sticky header skeleton */}
      <div style={{ height: '44px', background: 'rgba(248,250,252,0.97)', borderBottom: '1px solid rgba(15,23,42,0.07)' }} />

      {/* Challenge prompt skeleton */}
      <div style={{ background: '#fff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px', padding: '12px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 34, height: 34, borderRadius: '34%', background: 'rgba(15,23,42,0.06)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: '13px', width: '80%', borderRadius: '4px', background: 'rgba(15,23,42,0.06)', marginBottom: '8px' }} />
            <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(15,23,42,0.06)' }} />
          </div>
        </div>
      </div>

      {/* Hero course skeleton */}
      <div style={{ background: '#fff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
        <div style={{ padding: '14px 20px 10px' }}>
          <div style={{ height: '11px', width: '160px', borderRadius: '4px', background: 'rgba(15,23,42,0.06)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '10px', background: 'rgba(15,23,42,0.06)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: '15px', width: '70%', borderRadius: '4px', background: 'rgba(15,23,42,0.06)', marginBottom: '6px' }} />
            <div style={{ height: '11px', width: '40%', borderRadius: '4px', background: 'rgba(15,23,42,0.04)' }} />
          </div>
        </div>
        {[1,2].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 20px', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
            <div style={{ width: 28, height: 28, borderRadius: '34%', background: 'rgba(15,23,42,0.06)', flexShrink: 0 }} />
            <div style={{ flex: 1, height: '13px', borderRadius: '4px', background: 'rgba(15,23,42,0.04)' }} />
          </div>
        ))}
      </div>

      {/* Active friends skeleton */}
      <div style={{ background: '#fff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
        <div style={{ padding: '14px 20px 10px' }}>
          <div style={{ height: '11px', width: '140px', borderRadius: '4px', background: 'rgba(15,23,42,0.06)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '5px 20px', background: 'rgba(15,23,42,0.02)', borderTop: '0.5px solid rgba(15,23,42,0.07)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
          {[36, 120, 80].map((w, i) => <div key={i} style={{ width: i === 1 ? 'auto' : w, flex: i === 1 ? 1 : 'none', height: '10px', borderRadius: '3px', background: 'rgba(15,23,42,0.05)', marginRight: i < 2 ? '8px' : 0 }} />)}
        </div>
        {[1,2,3].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
            <div style={{ width: 36, height: 16, borderRadius: '4px', background: 'rgba(15,23,42,0.04)', flexShrink: 0 }} />
            <div style={{ width: 34, height: 34, borderRadius: '34%', background: 'rgba(15,23,42,0.06)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: '14px', width: '60%', borderRadius: '4px', background: 'rgba(15,23,42,0.06)', marginBottom: '5px' }} />
              <div style={{ height: '11px', width: '80%', borderRadius: '4px', background: 'rgba(15,23,42,0.04)' }} />
            </div>
            <div style={{ width: 80, display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 4 }}>
              <div style={{ height: '15px', width: '24px', borderRadius: '4px', background: 'rgba(15,23,42,0.06)' }} />
              <div style={{ height: '3px', width: '64px', borderRadius: '2px', background: 'rgba(15,23,42,0.06)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Feed skeleton */}
      <div style={{ background: '#fff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
        <div style={{ padding: '14px 20px 10px' }}>
          <div style={{ height: '11px', width: '120px', borderRadius: '4px', background: 'rgba(15,23,42,0.06)' }} />
        </div>
        <div style={{ height: '40px', background: 'rgba(15,23,42,0.02)', borderTop: '0.5px solid rgba(15,23,42,0.07)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }} />
        {[1,2,3].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
            <div style={{ width: 34, height: 34, borderRadius: '34%', background: 'rgba(15,23,42,0.06)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: '13px', width: '55%', borderRadius: '4px', background: 'rgba(15,23,42,0.06)', marginBottom: '5px' }} />
              <div style={{ height: '14px', width: '75%', borderRadius: '4px', background: 'rgba(15,23,42,0.08)', marginBottom: '5px' }} />
              <div style={{ height: '11px', width: '50%', borderRadius: '4px', background: 'rgba(15,23,42,0.04)' }} />
            </div>
            <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'rgba(15,23,42,0.06)', flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendsCoursesSkeleton;
