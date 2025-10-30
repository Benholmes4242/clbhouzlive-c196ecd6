import type { FlowState } from './overrides';

export const ALL_STATES: FlowState[] = [
  { id: 'nearby-01-open-modal',      flow: 'nearby',     name: 'Open Modal',         description: 'Full-screen glass' },
  { id: 'nearby-02-visibility-row',  flow: 'nearby',     name: 'Visibility Row',     description: 'Segmented control' },
  { id: 'nearby-03-divider',         flow: 'nearby',     name: 'Divider Line',       description: 'Separator' },
  { id: 'nearby-04-open-to-play',    flow: 'nearby',     name: 'Open to Play',       description: 'Toggle + timer' },
  { id: 'nearby-05-game-text',       flow: 'nearby',     name: 'Game Text Block',    description: 'Section header' },
  { id: 'nearby-06-tabs',            flow: 'nearby',     name: 'Golfers / Games',    description: 'Tabs' },
  { id: 'nearby-07-golfers-list',    flow: 'nearby',     name: 'Nearby Golfers',     description: 'List w/ spacing' },
  { id: 'nearby-08-games-list',      flow: 'nearby',     name: 'Games List',         description: 'Available games' },

  { id: 'creategame-01-open-modal',  flow: 'createGame', name: 'Open Modal',         description: 'Full-screen glass' },
  { id: 'creategame-02-game-type',   flow: 'createGame', name: 'Game Type',          description: 'Grid buttons' },
  { id: 'creategame-03-location',    flow: 'createGame', name: 'Location',           description: 'Course search' },
  { id: 'creategame-04-note',        flow: 'createGame', name: 'Note Field',         description: 'Textarea' },
  { id: 'creategame-05-timing',      flow: 'createGame', name: 'When',               description: 'Timing options' },
  { id: 'creategame-06-players',     flow: 'createGame', name: 'Players Needed',     description: 'Count select' },
  { id: 'creategame-07-handicaps',   flow: 'createGame', name: 'Handicap Fields',    description: 'Inputs' },
  { id: 'creategame-08-submit',      flow: 'createGame', name: 'Create Button',      description: 'Validation' },
];
