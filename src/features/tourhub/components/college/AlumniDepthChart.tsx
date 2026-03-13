import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { CollegeAlumnus } from '../../hooks/useCollegeAlumni';

interface AlumniDepthChartProps {
  alumni: CollegeAlumnus[];
  collegeName: string;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

export function AlumniDepthChart({ alumni, collegeName }: AlumniDepthChartProps) {
  if (!alumni.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.3 }}
    >
      <h3 className="text-foreground" style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>
        {collegeName} Alumni Roster
      </h3>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden divide-y divide-border/30">
        {alumni.map((a, i) => (
          <Link
            key={a.id}
            to={`/tourhub/player/${a.pga_tour_id || a.id}`}
            className="flex items-center gap-3 px-3 py-2.5 active:bg-muted/40 transition-colors"
          >
            {/* Rank */}
            <span className="text-muted-foreground" style={{ fontSize: 12, fontWeight: 600, width: 20, textAlign: 'center' }}>
              {i + 1}
            </span>

            {/* Photo */}
            <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {a.photo_url ? (
                <img src={a.photo_url} alt={`${a.first_name} ${a.last_name}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-semibold">
                  {a.first_name.charAt(0)}{a.last_name.charAt(0)}
                </div>
              )}
            </div>

            {/* Name & meta */}
            <div className="flex-1 min-w-0">
              <p className="text-foreground truncate" style={{ fontSize: 14, fontWeight: 600 }}>
                {a.first_name} {a.last_name}
              </p>
              {a.world_ranking && (
                <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                  World #{a.world_ranking}
                </p>
              )}
            </div>

            {/* Earnings */}
            <span className="text-foreground" style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(a.earnings || 0)}
            </span>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}
