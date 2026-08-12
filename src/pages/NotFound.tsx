import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#F8FAFC' }}>
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-3" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>404</h1>
        <p className="text-base mb-6" style={{ color: '#64748B' }}>This page doesn't exist.</p>
        <button
          onClick={() => navigate('/clubhouse')}
          className="px-5 py-2.5 rounded-full text-[14px] font-semibold"
          style={{ background: '#F7931E', color: '#0F172A' }}
        >
          Back to Clubhouse
        </button>
      </div>
    </div>
  );
};

export default NotFound;
