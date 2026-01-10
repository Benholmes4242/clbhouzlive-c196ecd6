/**
 * Posting As Copy Strings
 * Centralized i18n/config file for all posting-as related UI copy
 */

export const postingAsCopy = {
  headerPill: {
    label: 'Posting as',
  },
  dropdown: {
    title: 'Posting as',
    helper: 'Choose who this post will appear as.',
    sectionTitle: 'Switch profile',
  },
  actorLabels: {
    personal: 'Personal profile',
    creator: 'Creator page',
    business: 'Business',
  },
  sectionLabels: {
    personal: 'Personal',
    creators: 'Creator Pages',
    businesses: 'Business Profiles',
  },
  roleChips: {
    owner: 'Owner',
    admin: 'Admin',
    editor: 'Editor',
  },
  emptyState: {
    title: 'No business profiles yet',
    body: 'Create one to post and manage your club, coaching, or brand presence.',
    cta: 'Create business profile',
  },
  creatorEmptyState: {
    title: 'No creator pages yet',
    body: 'Create one to share content and build your audience.',
    cta: 'Create creator page',
  },
  managementLinks: {
    creators: 'Manage creator pages',
    businesses: 'Manage business profiles',
  },
  toasts: {
    switchedToBusiness: (name: string) => `Now posting as ${name}`,
    switchedToCreator: (name: string) => `Now posting as ${name}`,
    switchedToPersonal: (name: string) => `Now posting as ${name}`,
  },
  createPostModal: {
    label: 'Posting as',
    changeAction: 'Change',
  },
  permissionError: {
    title: "You can't post as this business",
    body: 'Ask an owner or admin to add you to the business profile.',
    button: 'OK',
  },
} as const;

export type PostingAsCopy = typeof postingAsCopy;
