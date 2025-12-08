import * as React from 'react';

export type HandicapRound = {
  id: string;
  date: string;          // ISO date string
  courseName: string;
  differential: number;  // e.g. -0.6 means index dropped 0.6, +0.3 increased 0.3
};

type AggregatedCourse = {
  courseName: string;
  roundsPlayed: number;
  totalDelta: number;
  bestDelta: number;
  lastPlayed: string;
};

type Props = {
  rounds: HandicapRound[];
};

export const HandicapCourseImpactCard: React.FC<Props> = ({ rounds }) => {
  const { friendlyCourses, punishingCourses } = React.useMemo(() => {
    const byCourse = new Map<string, AggregatedCourse>();

    for (const r of rounds) {
      const existing = byCourse.get(r.courseName);
      if (!existing) {
        byCourse.set(r.courseName, {
          courseName: r.courseName,
          roundsPlayed: 1,
          totalDelta: r.differential,
          bestDelta: r.differential,
          lastPlayed: r.date,
        });
      } else {
        existing.roundsPlayed += 1;
        existing.totalDelta += r.differential;
        existing.bestDelta = Math.min(existing.bestDelta, r.differential);
        if (new Date(r.date) > new Date(existing.lastPlayed)) {
          existing.lastPlayed = r.date;
        }
      }
    }

    const allCourses = Array.from(byCourse.values());

    const friendly = [...allCourses]
      .filter((c) => c.totalDelta < 0)
      .sort((a, b) => a.totalDelta - b.totalDelta)
      .slice(0, 3);

    const punishing = [...allCourses]
      .filter((c) => c.totalDelta > 0)
      .sort((a, b) => b.totalDelta - a.totalDelta)
      .slice(0, 3);

    return { friendlyCourses: friendly, punishingCourses: punishing };
  }, [rounds]);

  const hasData = friendlyCourses.length > 0 || punishingCourses.length > 0;

  if (!hasData) return null;

  return (
    <section className="rounded-sq-lg bg-muted border border-border px-5 py-5">
      {/* Header */}
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Course Impact on Your Index
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            See which courses tend to drop your index – and which ones fight back
          </p>
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Based on qualifying rounds
        </p>
      </div>

      {/* Columns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Friendly courses */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-sq-pill bg-emerald-100 text-[10px]">
              ↓
            </span>
            Courses that help your index
          </h3>

          {friendlyCourses.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No courses have reduced your index yet – time to chase some low rounds.
            </p>
          ) : (
            <ul className="space-y-3">
              {friendlyCourses.map((course) => (
                <li
                  key={course.courseName}
                  className="flex items-center justify-between gap-3 bg-background/50 rounded-sq-sm px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {course.courseName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {course.roundsPlayed} round{course.roundsPlayed > 1 ? 's' : ''} • Last{' '}
                      {new Date(course.lastPlayed).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-emerald-600">
                      {course.totalDelta.toFixed(1)} index
                    </p>
                    <p className="mt-0.5 text-[10px] text-emerald-700/80">
                      Best {course.bestDelta.toFixed(1)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tough courses */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-600">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-sq-pill bg-red-100 text-[10px]">
              ↑
            </span>
            Toughest tests for your index
          </h3>

          {punishingCourses.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No courses have pushed your index up yet – nice work.
            </p>
          ) : (
            <ul className="space-y-3">
              {punishingCourses.map((course) => (
                <li
                  key={course.courseName}
                  className="flex items-center justify-between gap-3 bg-background/50 rounded-sq-sm px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {course.courseName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {course.roundsPlayed} round{course.roundsPlayed > 1 ? 's' : ''} • Last{' '}
                      {new Date(course.lastPlayed).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-red-600">
                      +{course.totalDelta.toFixed(1)} index
                    </p>
                    <p className="mt-0.5 text-[10px] text-red-600/80">
                      Worst +{Math.abs(course.bestDelta).toFixed(1)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default HandicapCourseImpactCard;
