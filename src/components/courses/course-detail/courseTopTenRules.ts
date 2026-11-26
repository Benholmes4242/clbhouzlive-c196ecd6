export type CourseTenMovement = 'up' | 'down' | 'same' | 'new' | 're' | null;

export interface CourseTopTenMember {
  user_id: string;
  display_name: string;
  first_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  pronoun: 'his' | 'her' | 'their';
  position: number;
  is_pinned: boolean;
}

export interface CourseTopTenChart {
  rank: number;
  movement: CourseTenMovement;
  delta: number | null;
  weeks_at_one: number;
  weeks_on_chart: number;
  best_rank: number;
  points: number;
  week_start: string;
}

export interface CourseTopTenStanding {
  course_id: string;
  in_tens: number;
  number_ones: number;
  chart: CourseTopTenChart | null;
  members: CourseTopTenMember[];
}

/** Brief 33 copy rules only; chart order, membership and positions remain server-owned. */
export function courseTenMovementCopy(chart: CourseTopTenChart): string | null {
  switch (chart.movement) {
    case 'up': return `▲${Math.abs(chart.delta ?? 0)} this week`;
    case 'down': return `▼${Math.abs(chart.delta ?? 0)} this week`;
    case 'same': return 'No change this week';
    case 'new': return 'New this week';
    case 're': return 'Back this week';
    default: return null;
  }
}

export function courseTenRecordCopy(chart: CourseTopTenChart): string | null {
  if (chart.weeks_at_one >= 1) return `${chart.weeks_at_one} ${chart.weeks_at_one === 1 ? 'week' : 'weeks'} at #1`;
  if (chart.weeks_on_chart >= 1) return `${chart.weeks_on_chart} ${chart.weeks_on_chart === 1 ? 'week' : 'weeks'} on the chart`;
  return null;
}

function firstName(member: CourseTopTenMember): string {
  return member.first_name || member.display_name.trim().split(/\s+/)[0] || 'Member';
}

export function courseTenNumberOnesCopy(members: CourseTopTenMember[]): string | null {
  const names = members.filter(member => member.position === 1).map(firstName);
  if (names.length === 0) return null;
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  const others = names.length - 2;
  return `${names[0]}, ${names[1]} and ${others} ${others === 1 ? 'other' : 'others'}`;
}

export function courseTenMembersCopy(inTens: number): string {
  return `In ${inTens} ${inTens === 1 ? "member's ten" : "members' tens"}`;
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'] as const;

export function courseTenSheetLine(courseName: string, inTens: number, numberOnes: number): string {
  const tens = `${courseName} is in ${inTens} public top ${inTens === 1 ? 'ten' : 'tens'}`;
  const ones = numberOnes >= 1 ? `, #1 in ${numberOnes <= 10 ? NUMBER_WORDS[numberOnes] : numberOnes}` : '';
  return `${tens}${ones}.`;
}
