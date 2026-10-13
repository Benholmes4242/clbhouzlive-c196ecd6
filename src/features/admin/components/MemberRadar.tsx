import React, { useEffect, useState } from "react";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { adminTheme as t } from "../theme";
import {
  PANEL,
  LIST_PANEL,
  RAISED,
  TRACK,
  RADAR_CHART_FILL,
  RADAR_EVENT_DOT,
  RADAR_NEVER_EDGE,
} from "../lib/panels";
import { Skeleton, monotonePath } from "../lib/chartPrimitives";
import {
  memberIndexText,
  indexSeriesToToday,
  mergeSessionSteps,
} from "../lib/memberRadarRules";
import {
  radarDuration,
  londonTime,
  londonDate,
  londonSessionDay,
  radarQueryUser,
} from "../lib/memberRadarDisplay";
import { labelForEvent } from "../lib/eventLabels";
import {
  useMemberOverview,
  useMemberBehaviour,
  useMemberSessions,
  useMemberSession,
  useMemberExtras,
  isPermissionDenied,
  type MemberSession,
} from "../hooks/useMembersRadar";
import { SquircleAvatar } from "@/components/ui/SquircleAvatar";
import { useStartConversation } from "@/hooks/messaging/useStartConversation";
import { useActiveActor } from "@/context/ActiveActorContext";
import "./memberRadar.css";

const paints = {
  "--mr-ink": t.ink,
  "--mr-canvas": t.canvas,
  "--mr-surface": t.surface,
  "--mr-muted": t.inkMuted,
  "--mr-faint": t.inkFaint,
  "--mr-line": t.line,
  "--mr-hairline": t.hairline,
  "--mr-track": TRACK,
  "--mr-raised": RAISED,
  "--mr-brand": t.brand,
  "--mr-neutral": t.neutralSoft,
  "--mr-ok": t.ok,
  "--mr-ok-text": t.okText,
  "--mr-ok-soft": t.okSoft,
  "--mr-danger": t.danger,
  "--mr-danger-text": t.dangerText,
  "--mr-danger-soft": t.dangerSoft,
  "--mr-never-edge": RADAR_NEVER_EDGE,
  "--mr-event-dot": RADAR_EVENT_DOT,
} as React.CSSProperties;
function RadarAvatar({
  userId,
  name,
  photo,
  loading,
}: {
  userId: string;
  name: string | null | undefined;
  photo?: string | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <span className="mr-avatar">
        <Skeleton height={56} radius={19} />
      </span>
    );
  }
  return (
    <SquircleAvatar
      size={56}
      src={photo}
      alt={name ?? ""}
      userId={userId}
      hairlineRing
    />
  );
}
function Head({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="mr-head">
      <span className="mr-title">{title}</span>
      {right && <span className="mr-caption">{right}</span>}
    </div>
  );
}
function Panel({
  title,
  right,
  list,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  list?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`mr-panel${list ? " mr-list" : ""}`}
      style={list ? LIST_PANEL : PANEL}
    >
      <Head title={title} right={right} />
      {children}
    </section>
  );
}
function Empty({
  children,
  centre = false,
}: {
  children: React.ReactNode;
  centre?: boolean;
}) {
  return (
    <div className={`mr-empty${centre ? " mr-centred" : ""}`}>{children}</div>
  );
}
function Figure({
  label,
  value,
  loading,
  cell = false,
}: {
  label: string;
  value: React.ReactNode;
  loading?: boolean;
  cell?: boolean;
}) {
  return (
    <div className={cell ? "mr-cell" : undefined}>
      <div className="mr-label">{label}</div>
      <div className="mr-figure">
        {loading ? <Skeleton height={24} radius={3} /> : value}
      </div>
    </div>
  );
}
function Failure({ error }: { error: unknown }) {
  return (
    <Empty centre>
      {isPermissionDenied(error) ? "Full admins only" : "Could not load data"}
    </Empty>
  );
}

export function RadarTimeline({ session }: { session: MemberSession }) {
  const steps = mergeSessionSteps(session.steps);
  // page_exit is passive and never in steps; the server flags it instead.
  const closeAt = session.ends_on_exit ? session.ended_at : null;
  return (
    <>
      {steps.map((s, i) => {
        const kind = s.kind;
        const label =
          s.kind === "screen"
            ? (s.label ?? "—")
            : s.kind === "push"
              ? "Opened from push"
              : s.kind === "error"
                ? `Error · ${s.detail ?? "—"}`
                : labelForEvent(s.name ?? "");
        return (
          <div className="mr-step" key={`${s.at}-${i}`}>
            <span className="mr-step-time">{londonTime(s.at)}</span>
            <span className={`mr-dot mr-dot-${kind}`} />
            <span className={`mr-step-label mr-step-${kind}`}>{label}</span>
            <span className="mr-seconds">
              {s.kind === "screen" ? radarDuration(s.seconds) : ""}
            </span>
          </div>
        );
      })}
      {closeAt && (
        <div className="mr-step">
          <span className="mr-step-time">{londonTime(closeAt)}</span>
          <span className="mr-dot mr-dot-close" />
          <span className="mr-step-label mr-step-close">Closed the app</span>
          <span className="mr-seconds" />
        </div>
      )}
    </>
  );
}
function TimelineLoading() {
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => (
        <div className="mr-step" key={i}>
          <Skeleton height={16} />
          <span className="mr-dot" />
          <Skeleton height={16} />
          <Skeleton height={16} />
        </div>
      ))}
    </>
  );
}
function SessionDetail({
  userId,
  sessionId,
}: {
  userId: string;
  sessionId: string;
}) {
  const q = useMemberSession(userId, sessionId);
  return q.error ? (
    <Failure error={q.error} />
  ) : q.isPending ? (
    <TimelineLoading />
  ) : q.data ? (
    <RadarTimeline session={q.data} />
  ) : (
    <Empty>No sessions recorded yet</Empty>
  );
}

export default function MemberRadar({
  userId,
  full,
  onClose,
  onMore,
}: {
  userId: string;
  full: boolean;
  onClose: () => void;
  onMore: () => void;
}) {
  const navigate = useNavigate(),
    location = useLocation();
  const [tab, setTab] = useState<"overview" | "behaviour" | "sessions">(
    "overview",
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const overview = useMemberOverview(userId);
  const sessions = useMemberSessions(
    radarQueryUser(userId, full, tab === "sessions"),
  );
  const extras = useMemberExtras(userId);
  const behaviour = useMemberBehaviour(
    radarQueryUser(userId, full, tab === "behaviour"),
    30,
  );
  const { start, isStarting } = useStartConversation();
  const { activeActor, availableActors, setActiveActor } = useActiveActor();
  const d = overview.data,
    loading = overview.isPending;
  const allSessions = sessions.data?.pages.flatMap((p) => p.sessions) ?? [];
  const weeks = extras.data?.sessions_8 ?? null,
    maxWeek = Math.max(...(weeks ?? []), 1);
  const connected = !!d?.connection.connected_at;
  const londonToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const series = indexSeriesToToday(
    d?.index_series ?? [],
    d?.profile.index,
    londonToday,
  );
  const first = series[0];
  const delta =
    d?.index_start != null && d.profile.index != null
      ? d.index_start - d.profile.index
      : null;
  const range = series.length
    ? Math.max(...series.map((p) => p.index)) -
      Math.min(...series.map((p) => p.index))
    : 0;
  const min = series.length ? Math.min(...series.map((p) => p.index)) : 0;
  const points = series.map((p, i) => ({
    x: (i * 330) / Math.max(series.length - 1, 1),
    y: range ? 46 - ((p.index - min) / range) * 38 : 28,
  }));
  const path = monotonePath(points),
    end = points.at(-1);
  const b = behaviour.data;
  const restricted = !full || isPermissionDenied(behaviour.error);
  const bLoading = full && behaviour.isPending;
  const maxHour = Math.max(...(b?.hourly ?? []), 1),
    maxArea = Math.max(...(b?.areas.map((a) => a.seconds) ?? []), 1);
  const never = b
    ? [
        ...b.never_opened.areas,
        ...(!b.has.reviewed ? ["Rate a course"] : []),
        ...(!b.has.posted ? ["Post"] : []),
        ...(!b.has.invited ? ["Invite"] : []),
      ]
    : [];
  const restoreActor = (
    location.state as { restoreActor?: { type: string; id: string } } | null
  )?.restoreActor;
  useEffect(() => {
    if (!restoreActor) return;
    const prior = availableActors.find(
      (a) => a.type === restoreActor.type && a.id === restoreActor.id,
    );
    if (prior) setActiveActor(prior);
    navigate(location.pathname + location.search, {
      replace: true,
      state: null,
    });
  }, [
    restoreActor,
    availableActors,
    setActiveActor,
    navigate,
    location.pathname,
    location.search,
  ]);
  const restrictedBody = <Empty centre>Full admins only</Empty>;
  const message = async () => {
    const personal = availableActors.find((a) => a.type === "personal");
    if (!personal) return;
    // The thread, composer and send path read the app-wide active actor, so a
    // business-acting admin is switched for the conversation and restored on Back.
    const previous =
      activeActor && activeActor.type !== "personal" ? activeActor : null;
    if (previous) setActiveActor(personal);
    await start({ actorType: "personal", actorId: userId }, undefined, {
      asActor: { actorType: "personal", actorId: personal.id },
      focusComposer: true,
      returnTo: location.pathname + location.search,
      returnState: previous
        ? { restoreActor: { type: previous.type, id: previous.id } }
        : undefined,
    });
  };
  return (
    <div className="member-radar" style={paints}>
      <header className="mr-header">
        <button
          type="button"
          className="mr-back"
          aria-label="Back to members"
          onClick={onClose}
        >
          <ChevronLeft size={14} strokeWidth={1.6} />
        </button>
        <span>
          <span className="mr-kicker">Members</span>
          <span className="mr-name">
            {loading ? (
              <Skeleton height={20} />
            ) : (
              (d?.profile.display_name ?? d?.profile.username ?? "Member")
            )}
          </span>
        </span>
      </header>
      <div className="mr-tabs" role="tablist" aria-label="Member details">
        {(["overview", "behaviour", "sessions"] as const).map((v) => (
          <button
            type="button"
            role="tab"
            aria-selected={tab === v}
            className="mr-tab"
            key={v}
            onClick={() => setTab(v)}
          >
            {v[0].toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
      {tab === "overview" && (
        <div className="mr-stack">
          {overview.error ? (
            <Panel title="Member">
              <Failure error={overview.error} />
            </Panel>
          ) : (
            <>
              <section className="mr-panel mr-identity">
                <div className="mr-identity-row">
                  <RadarAvatar
                    userId={userId}
                    name={d?.profile.display_name}
                    photo={d?.profile.photo_url}
                    loading={loading}
                  />
                  <span className="mr-copy">
                    <span className="mr-sub">
                      {loading ? (
                        <Skeleton height={16} />
                      ) : (
                        [
                          d?.profile.username ? `@${d.profile.username}` : "—",
                          d?.profile.home_club,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      )}
                    </span>
                    <span className="mr-pills">
                      {loading ? (
                        <Skeleton height={18} />
                      ) : (
                        <>
                          {d?.weeks_active_8 === 8 && (
                            <span className="mr-pill mr-ok">Weekly</span>
                          )}
                          {d?.connection.failing ? (
                            <span className="mr-pill mr-danger">
                              EG failing
                            </span>
                          ) : (
                            d?.connection.synced && (
                              <span className="mr-pill">EG synced</span>
                            )
                          )}
                          {d?.client && (
                            <span className="mr-pill">{d.client}</span>
                          )}
                        </>
                      )}
                    </span>
                  </span>
                  <span className="mr-index">
                    <span className="mr-index-value">
                      {loading ? (
                        <Skeleton height={30} />
                      ) : (
                        memberIndexText(d?.profile.index, connected)
                      )}
                    </span>
                    {connected && first && delta != null && delta !== 0 && (
                      <span
                        className={`mr-change${delta > 0 ? " mr-improved" : ""}`}
                      >
                        {delta > 0 ? "↓" : "↑"} {Math.abs(delta).toFixed(1)}{" "}
                        since {londonDate(first.date, { month: "short" })}
                      </span>
                    )}
                  </span>
                </div>
                <div className="mr-chart">
                  {loading ? (
                    <Skeleton height={56} />
                  ) : !connected || series.length < 2 ? (
                    <Empty centre>
                      {!connected
                        ? "No handicap connected"
                        : "Not enough rounds for a trend yet"}
                    </Empty>
                  ) : (
                    <svg
                      viewBox="0 0 330 56"
                      preserveAspectRatio="none"
                      aria-label="Handicap index trend"
                    >
                      <path
                        d={path}
                        fill="none"
                        stroke={t.ink}
                        strokeWidth={1.5}
                      />
                      <path
                        d={`${path} L330 56 L0 56 Z`}
                        fill={RADAR_CHART_FILL}
                      />
                      {end && (
                        <circle cx={328} cy={end.y} r={2.5} fill={t.ink} />
                      )}
                    </svg>
                  )}
                </div>
                <div className="mr-axis">
                  <span>
                    {first && connected
                      ? `${londonDate(first.date, { month: "short" })} · ${memberIndexText(first.index, connected)}`
                      : "—"}
                  </span>
                  <span>
                    Now · {memberIndexText(d?.profile.index, connected)}
                  </span>
                </div>
              </section>
              <Panel title="The loop">
                <div className="mr-loop">
                  {[
                    {
                      label: "Joined",
                      reached: !!d?.profile.created_at,
                      date: londonDate(d?.profile.created_at, {
                        month: "short",
                        year: "numeric",
                      }),
                    },
                    {
                      label: "Connected",
                      reached: connected,
                      date: londonDate(d?.connection.connected_at),
                    },
                    {
                      label: "Round in",
                      reached: !!d?.first_round_at,
                      date: londonDate(d?.first_round_at),
                    },
                    {
                      label: "Weekly",
                      reached: d?.weeks_active_8 === 8,
                      date: `${d?.weeks_active_8 ?? 0} of 8 wks`,
                    },
                  ].map((s) => (
                    <div key={s.label}>
                      <div
                        className={`mr-loop-bar${s.reached ? (s.label === "Weekly" ? " mr-weekly" : " mr-reached") : ""}`}
                      />
                      <div className="mr-loop-label">{s.label}</div>
                      <div className="mr-loop-date">
                        {loading ? <Skeleton height={13} /> : s.date}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel
                title="Golf"
                right={londonDate(new Date().toISOString(), {
                  year: "numeric",
                })}
              >
                <div className="mr-grid">
                  {[
                    ["Rounds", d?.golf_year.rounds ?? 0],
                    ["Sub-80", d?.golf_year.sub_80 ?? 0],
                    ["Birdies", d?.golf_year.birdies ?? 0],
                    ["Top 100", extras.data?.top100_year ?? 0],
                    ["Courses", d?.golf_year.courses ?? 0],
                  ].map(([label, value]) => (
                    <Figure
                      key={label}
                      label={String(label)}
                      value={value}
                      loading={label === "Top 100" ? extras.isPending : loading}
                      cell
                    />
                  ))}
                  <Figure
                    label="Last round"
                    loading={loading}
                    cell
                    value={
                      <>
                        {d?.last_round?.gross ?? "—"}
                        {d?.last_round && (
                          <span
                            className={`mr-par${d.last_round.to_par < 0 ? " mr-under" : ""}`}
                          >
                            {d.last_round.to_par === 0
                              ? "E"
                              : d.last_round.to_par > 0
                                ? `+${d.last_round.to_par}`
                                : d.last_round.to_par}
                          </span>
                        )}
                      </>
                    }
                  />
                </div>
              </Panel>
              <Panel title="In the app" right="sessions · 8 wks">
                {extras.error ? (
                  <div className="mr-week-empty">
                    <Failure error={extras.error} />
                  </div>
                ) : extras.isPending ? (
                  <div className="mr-week-empty">
                    <Skeleton height={44} />
                  </div>
                ) : weeks == null ? (
                  <div className="mr-week-empty">{restrictedBody}</div>
                ) : weeks.every((n) => n === 0) ? (
                  <div className="mr-week-empty">
                    <Empty centre>No app sessions in the last 8 weeks</Empty>
                  </div>
                ) : (
                  <div className="mr-week-bars">
                    {weeks.map((n, i) => (
                      <div
                        key={i}
                        style={{ height: `${(n / maxWeek) * 100}%` }}
                        title={`${n} sessions`}
                      />
                    ))}
                  </div>
                )}
                <div className="mr-counters">
                  {[
                    ["Posts", d?.app.posts ?? 0],
                    ["Reviews", d?.app.reviews ?? 0],
                    ["Invited", d?.app.invites_sent ?? 0],
                    ["Brought in", d?.app.brought_in ?? 0],
                  ].map(([label, value]) => (
                    <Figure
                      key={label}
                      label={String(label)}
                      value={value}
                      loading={loading}
                    />
                  ))}
                </div>
              </Panel>
              <div className="mr-actions">
                <button
                  type="button"
                  className="mr-action mr-message"
                  onClick={message}
                  disabled={loading || isStarting}
                >
                  Message
                </button>
                <button
                  type="button"
                  className="mr-action"
                  onClick={() =>
                    d?.profile.username &&
                    navigate(`/profile/${d.profile.username}`)
                  }
                  disabled={!d?.profile.username}
                >
                  Profile
                </button>
                <button
                  type="button"
                  className="mr-action mr-more"
                  aria-label="More actions"
                  onClick={onMore}
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {tab === "behaviour" && (
        <div className="mr-stack">
          <Panel title="Time in app" right="last 30d">
            {restricted ? (
              restrictedBody
            ) : behaviour.error ? (
              <Failure error={behaviour.error} />
            ) : !bLoading && (!b || b.sessions === 0) ? (
              <Empty>No app activity in the last 30 days</Empty>
            ) : (
              <>
                <div className="mr-time">
                  {[
                    ["Total", radarDuration(b?.total_seconds)],
                    ["Sessions", b?.sessions ?? 0],
                    ["Avg", radarDuration(b?.avg_session_seconds)],
                    [
                      "Peak",
                      b?.peak
                        ? `${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][b.peak.dow - 1]} ${String(b.peak.hour).padStart(2, "0")}:00`
                        : "—",
                    ],
                  ].map(([label, value]) => (
                    <Figure
                      key={label}
                      label={String(label)}
                      value={value}
                      loading={bLoading}
                    />
                  ))}
                </div>
                <div className="mr-hours">
                  {Array.from({ length: 24 }, (_, i) =>
                    bLoading ? (
                      <Skeleton key={i} height={36} radius={2} />
                    ) : (
                      <div
                        key={i}
                        title={`${String(i).padStart(2, "0")}:00 · ${b?.hourly[i] ?? 0}s`}
                        className={`mr-hour${b?.peak?.hour === i ? " mr-peak" : b?.peak && Math.min((i - b.peak.hour + 24) % 24, (b.peak.hour - i + 24) % 24) <= 2 ? " mr-near-peak" : ""}`}
                        style={{
                          height: `${((b?.hourly[i] ?? 0) / maxHour) * 100}%`,
                        }}
                      />
                    ),
                  )}
                </div>
                <div className="mr-axis mr-hours-axis">
                  {["00", "06", "12", "18", "23"].map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
              </>
            )}
          </Panel>
          <Panel title="Where the time goes" right="time · visits">
            {restricted ? (
              restrictedBody
            ) : behaviour.error ? (
              <Failure error={behaviour.error} />
            ) : bLoading ? (
              <div className="mr-areas">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} height={16} />
                ))}
              </div>
            ) : !b?.areas.length ? (
              <Empty>No screens viewed in the last 30 days</Empty>
            ) : (
              <div className="mr-areas">
                {b.areas.map((a, i) => (
                  <div className="mr-area" key={i}>
                    <span className="mr-area-name" title={a.area}>
                      {a.area}
                    </span>
                    <div className="mr-track">
                      <div
                        style={{ width: `${(a.seconds / maxArea) * 100}%` }}
                      />
                    </div>
                    <span className="mr-area-time">
                      {radarDuration(a.seconds)}
                    </span>
                    <span className="mr-visits">{a.visits}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="What they do" right="30d">
            {restricted ? (
              restrictedBody
            ) : behaviour.error ? (
              <Failure error={behaviour.error} />
            ) : (
              <>
                {bLoading ? (
                  <div className="mr-grid">
                    {Array.from({ length: 6 }, (_, i) => (
                      <div className="mr-cell" key={i}>
                        <Skeleton height={40} />
                      </div>
                    ))}
                  </div>
                ) : !b?.actions.length ? (
                  <Empty>No actions in the last 30 days</Empty>
                ) : (
                  <div className="mr-grid">
                    {b.actions.slice(0, 6).map((a, i) => (
                      <div className="mr-cell mr-action-cell" key={i}>
                        <div className="mr-label">{labelForEvent(a.name)}</div>
                        <div className="mr-figure">{a.count}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mr-never">
                  <div className="mr-label">Never opened</div>
                  <div className="mr-never-pills">
                    {bLoading ? (
                      <Skeleton height={28} />
                    ) : (
                      never.map((s, i) => (
                        <span className="mr-never-pill" key={i}>
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </Panel>
          <Panel
            title="Last session"
            list
            right={
              b?.last_session && !restricted
                ? `${londonSessionDay(b.last_session.started_at)} ${londonTime(b.last_session.started_at)} · ${radarDuration(b.last_session.seconds)} · ${b.last_session.client ?? "—"}`
                : undefined
            }
          >
            {restricted ? (
              restrictedBody
            ) : behaviour.error ? (
              <Failure error={behaviour.error} />
            ) : bLoading ? (
              <TimelineLoading />
            ) : b?.last_session ? (
              <RadarTimeline session={b.last_session} />
            ) : (
              <Empty>No sessions recorded yet</Empty>
            )}
            {!restricted && (
              <button
                type="button"
                className="mr-footer"
                onClick={() => setTab("sessions")}
              >
                All {bLoading ? "—" : (b?.sessions ?? 0)} sessions
              </button>
            )}
          </Panel>
        </div>
      )}
      {tab === "sessions" && (
        <Panel title="Sessions" right="last 180d" list>
          {!full ? (
            restrictedBody
          ) : sessions.error ? (
            <Failure error={sessions.error} />
          ) : sessions.isPending ? (
            <>
              {Array.from({ length: 6 }, (_, i) => (
                <div className="mr-session-row" key={i}>
                  <Skeleton height={38} />
                </div>
              ))}
            </>
          ) : !allSessions.length ? (
            <Empty>No sessions in the last 180 days</Empty>
          ) : (
            <>
              {allSessions.map((s) => (
                <React.Fragment key={s.session_id}>
                  <button
                    type="button"
                    className="mr-session-row"
                    aria-expanded={expanded === s.session_id}
                    onClick={() =>
                      setExpanded(
                        expanded === s.session_id ? null : s.session_id,
                      )
                    }
                  >
                    <span>
                      <span className="mr-session-main">
                        {londonDate(s.started_at, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        · {londonTime(s.started_at)}
                      </span>
                      <div className="mr-session-sub">
                        {s.screens} screens · {s.events} actions ·{" "}
                        {s.client ?? "—"}
                      </div>
                    </span>
                    <span className="mr-session-right">
                      {radarDuration(s.seconds)}
                      {s.errors > 0 && (
                        <div className="mr-errors">{s.errors} errors</div>
                      )}
                    </span>
                  </button>
                  {expanded === s.session_id && (
                    <SessionDetail userId={userId} sessionId={s.session_id} />
                  )}
                </React.Fragment>
              ))}
              {sessions.hasNextPage && (
                <button
                  type="button"
                  className="mr-footer"
                  disabled={sessions.isFetchingNextPage}
                  onClick={() => void sessions.fetchNextPage()}
                >
                  {sessions.isFetchingNextPage ? "Loading…" : "Load more"}
                </button>
              )}
            </>
          )}
        </Panel>
      )}
    </div>
  );
}
