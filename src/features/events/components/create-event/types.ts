export type WizardStep = 'type' | 'details' | 'course' | 'datetime' | 'settings' | 'review';

export interface WizardRound {
  courseId?: string;
  courseName: string;
  courseLocation?: string;
  roundDate: string;
  firstTeeTime: string;
  teeTimeInterval: number;
  holes: 9 | 18;
  shotgunStart: boolean;
  courseRating?: number;
  slopeRating?: number;
  par?: number;
  teeColor?: string;
}

export interface WizardData {
  eventType: 'single_round' | 'society_day' | 'multi_day' | 'tournament';
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  visibility: 'public' | 'friends' | 'club' | 'invite_only' | 'private';
  scoringFormat: 'stableford' | 'stroke_net' | 'stroke_gross' | 'none';
  handicapAllowance: number;
  maxHandicap: number;
  maxParticipants: number | null;
  rounds: WizardRound[];
}

export const DEFAULT_WIZARD_DATA: WizardData = {
  eventType: 'society_day',
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  visibility: 'invite_only',
  scoringFormat: 'stableford',
  handicapAllowance: 100,
  maxHandicap: 36,
  maxParticipants: null,
  rounds: [],
};

export const STEPS: WizardStep[] = ['type', 'details', 'course', 'datetime', 'settings', 'review'];

export const STEP_TITLES: Record<WizardStep, string> = {
  type: 'What are you planning?',
  details: 'Event Details',
  course: 'Choose Course',
  datetime: 'Date & Time',
  settings: 'Settings',
  review: 'Review',
};
