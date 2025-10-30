/**
 * Design Review Mode Types
 * Defines the state machine for stepping through UI flows
 */

export interface FlowState {
  id: string;
  name: string;
  description: string;
  flow: 'nearby' | 'createGame';
  component?: string;
  tokens?: StateTokens;
}

export interface StateTokens {
  spacing?: Record<string, string>;
  typography?: Record<string, string>;
  colors?: Record<string, string>;
  layout?: Record<string, string>;
}

export interface DesignReviewContextType {
  isReviewMode: boolean;
  currentStateIndex: number;
  currentState: FlowState | null;
  allStates: FlowState[];
  nextState: () => void;
  prevState: () => void;
  jumpToState: (index: number) => void;
  captureScreenshot: (stateName?: string) => Promise<void>;
  showSpacingGuides: boolean;
  toggleSpacingGuides: () => void;
  enableReviewMode: () => void;
  disableReviewMode: () => void;
}

export const NEARBY_FLOW_STATES: FlowState[] = [
  {
    id: 'nearby-01-open-modal',
    name: 'Open Modal',
    description: 'Full-screen modal with glass background',
    flow: 'nearby',
    component: 'NearbyOverlay',
    tokens: {
      spacing: {
        headerPadding: 'px-5 pt-4',
        titleMargin: 'mb-3',
      },
      typography: {
        title: 'text-[17px] font-semibold',
      },
    },
  },
  {
    id: 'nearby-02-visibility-row',
    name: 'Visibility Row',
    description: 'Segmented control for visibility settings',
    flow: 'nearby',
    component: 'VisibilitySegmentedControl',
    tokens: {
      spacing: {
        controlMargin: 'mt-3 mb-3',
      },
    },
  },
  {
    id: 'nearby-03-divider',
    name: 'Divider Line',
    description: 'Separator between header and content',
    flow: 'nearby',
    tokens: {
      colors: {
        divider: 'rgba(255,255,255,0.08)',
      },
      spacing: {
        height: '1px',
      },
    },
  },
  {
    id: 'nearby-04-open-to-play',
    name: 'Open to Play Section',
    description: 'Toggle button with remaining time display',
    flow: 'nearby',
    component: 'OpenToPlayToggle',
    tokens: {
      spacing: {
        buttonGap: 'gap-2',
        pillPadding: 'px-3.5 py-2',
      },
      typography: {
        buttonText: 'text-[13px]',
        subtext: 'text-[13px]',
      },
    },
  },
  {
    id: 'nearby-05-game-text',
    name: 'Game Text Block',
    description: 'Section header with tightened gap to tabs',
    flow: 'nearby',
    tokens: {
      spacing: {
        topMargin: 'mt-3',
        bottomBorder: 'border-b border-white/[0.06]',
      },
    },
  },
  {
    id: 'nearby-06-tabs',
    name: 'Golfers / Games Tabs',
    description: 'Tab navigation for content sections',
    flow: 'nearby',
    tokens: {
      spacing: {
        tabPadding: 'py-3.5',
        tabGap: 'flex',
      },
      typography: {
        tabText: 'text-sm font-medium',
      },
    },
  },
  {
    id: 'nearby-07-golfers-list',
    name: 'Nearby Golfers List',
    description: 'List of active golfers with spacing',
    flow: 'nearby',
    component: 'GolferRow',
    tokens: {
      spacing: {
        listPadding: 'px-5 pt-4 pb-3',
        cardSpacing: 'space-y-2',
      },
    },
  },
  {
    id: 'nearby-08-games-list',
    name: 'Games List',
    description: 'List of available games',
    flow: 'nearby',
    component: 'GamesNearbyList',
  },
];

export const CREATE_GAME_FLOW_STATES: FlowState[] = [
  {
    id: 'creategame-01-open-modal',
    name: 'Open Modal',
    description: 'Full-screen with glass background (matches Nearby)',
    flow: 'createGame',
    component: 'CreateGameModal',
    tokens: {
      spacing: {
        headerPadding: 'px-5 pt-4 pb-4',
      },
      typography: {
        title: 'text-[17px] font-semibold',
        subtitle: 'text-[15px]',
      },
    },
  },
  {
    id: 'creategame-02-game-type',
    name: 'Game Type Selection',
    description: 'Grid of game type buttons',
    flow: 'createGame',
    tokens: {
      spacing: {
        gridGap: 'gap-2',
        buttonPadding: 'py-3 px-4',
      },
    },
  },
  {
    id: 'creategame-03-location',
    name: 'Location Input',
    description: 'Course search with dropdown',
    flow: 'createGame',
    tokens: {
      spacing: {
        inputPadding: 'py-3 px-4',
      },
    },
  },
  {
    id: 'creategame-04-note',
    name: 'Note Field',
    description: 'Textarea for game notes',
    flow: 'createGame',
    tokens: {
      spacing: {
        textareaPadding: 'py-3 px-4',
      },
    },
  },
  {
    id: 'creategame-05-timing',
    name: 'When Selection',
    description: 'Timing options grid',
    flow: 'createGame',
    tokens: {
      spacing: {
        gridCols: 'grid-cols-4',
        buttonPadding: 'py-2 px-3',
      },
    },
  },
  {
    id: 'creategame-06-players',
    name: 'Players Needed',
    description: 'Player count selection',
    flow: 'createGame',
    tokens: {
      spacing: {
        gridCols: 'grid-cols-3',
        buttonPadding: 'py-3 px-4',
      },
    },
  },
  {
    id: 'creategame-07-handicaps',
    name: 'Handicap Fields',
    description: 'Host and other handicaps input',
    flow: 'createGame',
  },
  {
    id: 'creategame-08-submit',
    name: 'Create Button',
    description: 'Submit button with validation states',
    flow: 'createGame',
    tokens: {
      spacing: {
        buttonPadding: 'py-4 px-4',
      },
    },
  },
];

export const ALL_FLOW_STATES = [...NEARBY_FLOW_STATES, ...CREATE_GAME_FLOW_STATES];
