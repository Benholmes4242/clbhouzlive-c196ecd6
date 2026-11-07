import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/post-v2/lib/videoPoster', () => ({ extractPoster: async () => '/frame.jpg' }));
vi.mock('@/features/post-v2/lib/videoDetailsSearch', () => ({
  searchCreditPeople: async () => [{ id: 'added-person', name: 'Added Person', avatarUrl: null, username: null, homeClub: null }],
  searchVideoBusinesses: async () => [{ id: 'added-club', name: 'Added Club', logoUrl: null, category: null }],
}));
import { VideoTitleDescription, VideoCoverChapters } from '@/features/post-v2/components/video/VideoComposerFields';
import { VideoDetailsPage } from '@/features/post-v2/components/video/VideoDetailsPage';
import { VideoDetailsSheets } from '@/features/post-v2/components/video/VideoDetailsSheets';
import { emptyVideoDetails, type VideoDetails } from '@/features/post-v2/lib/videoDetails';
afterEach(cleanup);
describe('PF3A creator controls', () => {
  it('title enforces 80 characters and updates the counter', () => { function Demo() { const [data, set] = useState(emptyVideoDetails()); return <VideoTitleDescription details={data} description="" long duration={1080} onChange={patch => set({ ...data, ...patch })} onDetails={() => {}} />; } render(<Demo />); const title = screen.getByRole('textbox', { name: 'Video title' }); expect(title).toHaveAttribute('maxlength', '80'); fireEvent.change(title, { target: { value: 'a'.repeat(90) } }); expect(title).toHaveValue('a'.repeat(80)); });
  it('empty title locks title-on-cover off and short omits chapters', () => { const view = render(<VideoCoverChapters item={{ id: 'v', type: 'video', frame: 'original', previewUrl: '/v', duration: 40 }} details={emptyVideoDetails()} description="" long={false} onChange={() => {}} onFrame={() => {}} onCover={() => {}} />); expect(screen.getByRole('switch')).toBeDisabled(); expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false'); expect(view.container.querySelector('[data-video-chapters]')).toBeNull(); });
  it('long video exposes qualifying chapters and cover picks set timestamps', async () => { const pick = vi.fn(); const view = render(<VideoCoverChapters item={{ id: 'v', type: 'video', frame: 'original', previewUrl: '/v', duration: 1000 }} details={{ ...emptyVideoDetails(), title: 'Film' }} description={'0:00 Intro\n1:00 Middle\n2:00 End'} long onChange={() => {}} onFrame={pick} onCover={() => {}} />); expect(view.container.querySelectorAll('.vc-chapter')).toHaveLength(3); fireEvent.click(screen.getByRole('button', { name: 'Cover frame at 350.0 seconds' })); expect(pick).toHaveBeenCalledWith(350); });
  it('Details hides add rows at all four limits and removing an item restores its add row', () => { function Demo() { const [details, set] = useState<VideoDetails>({ ...emptyVideoDetails(), credits: Array.from({ length: 10 }, (_, i) => ({ id: `u${i}`, name: `Person ${i}`, avatarUrl: null, role: 'host' as const })), links: Array.from({ length: 5 }, (_, i) => ({ url: `https://example.com/${i}`, label: `Link ${i}` })), thanks: Array.from({ length: 3 }, (_, i) => ({ id: `b${i}`, name: `Club ${i}`, logoUrl: null, category: null })), gear: Array.from({ length: 10 }, (_, i) => `Gear ${i}`) }); return <VideoDetailsPage details={details} description="" long userId="me" onDescription={() => {}} onBack={() => {}} onChange={patch => set({ ...details, ...patch })} />; } render(<Demo />); expect(screen.queryByRole('button', { name: '+ Add a credit' })).toBeNull(); expect(screen.queryByRole('button', { name: '+ Add a link' })).toBeNull(); expect(screen.queryByRole('button', { name: '+ Add a club or brand' })).toBeNull(); expect(screen.queryByRole('button', { name: '+ Add gear' })).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Remove Person 0' })); expect(screen.getByRole('button', { name: '+ Add a credit' })).toBeEnabled(); });
  it('credit requires person plus role and disables already-credited people', async () => { const add = vi.fn(); render(<VideoDetailsSheets kind="credits" credits={[{ id: 'old', name: 'Existing', avatarUrl: null, role: 'host' }]} thanks={[]} onClose={() => {}} onCredit={add} onLink={() => {}} onThanks={() => {}} onGear={() => {}} peopleSearch={async () => [{ id: 'new', name: 'Sam Okafor', avatarUrl: null, username: 'sam', homeClub: null }, { id: 'old', name: 'Existing', avatarUrl: null, username: 'old', homeClub: null }]} />); expect(screen.getByRole('button', { name: 'ADD CREDIT' })).toBeDisabled(); fireEvent.change(screen.getByRole('textbox', { name: 'Search people' }), { target: { value: 'Sam' } }); const person = await screen.findByRole('button', { name: /Sam Okafor/ }); expect(screen.getByRole('button', { name: /Existing/ })).toBeDisabled(); fireEvent.click(person); expect(screen.getByRole('button', { name: 'ADD CREDIT' })).toBeDisabled(); fireEvent.click(screen.getByRole('button', { name: 'Guest' })); expect(screen.getByRole('button', { name: 'ADD CREDIT' })).toBeEnabled(); fireEvent.click(screen.getByRole('button', { name: 'ADD CREDIT' })); expect(add).toHaveBeenCalledWith(expect.objectContaining({ id: 'new', role: 'guest' })); });
});

const detailCases = [
  { kind: 'credits', chip: 'Credits', add: '+ Add a credit', limit: 10, removed: 'Added Person' },
  { kind: 'links', chip: 'Links', add: '+ Add a link', limit: 5, removed: 'Website' },
  { kind: 'thanks', chip: 'Thanks to a club or brand', add: '+ Add a club or brand', limit: 3, removed: 'Added Club' },
  { kind: 'gear', chip: 'Gear in this video', add: '+ Add gear', limit: 10, removed: 'Added Gear' },
] as const;

function MountedDetails({ initial = emptyVideoDetails() }: { initial?: VideoDetails }) {
  const [details, setDetails] = useState(initial);
  return <VideoDetailsPage details={details} description="" long userId="me" onDescription={() => {}} onBack={() => {}} onChange={patch => setDetails(current => ({ ...current, ...patch }))} />;
}

async function addDetail(kind: typeof detailCases[number]['kind'], addLabel: string) {
  fireEvent.click(screen.getByRole('button', { name: addLabel, exact: true }));
  if (kind === 'credits') {
    fireEvent.change(screen.getByRole('textbox', { name: 'Search people' }), { target: { value: 'Added' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Added Person', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Guest', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'ADD CREDIT', exact: true }));
  } else if (kind === 'thanks') {
    fireEvent.change(screen.getByRole('textbox', { name: 'Search businesses' }), { target: { value: 'Added' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Added Club', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'ADD', exact: true }));
  } else {
    fireEvent.change(screen.getByRole('textbox', { name: kind === 'links' ? 'Link address' : 'Gear', exact: true }), { target: { value: kind === 'links' ? 'https://example.com/added' : 'Added Gear' } });
    fireEvent.click(screen.getByRole('button', { name: kind === 'links' ? 'ADD LINK' : 'ADD GEAR', exact: true }));
  }
}

describe('PF3A mounted Details transitions', () => {
  it.each(detailCases)('$kind chip becomes filled with a count after adding and outlined after removing', async ({ kind, chip, add, removed }) => {
    render(<MountedDetails />);
    const chips = screen.getByRole('dialog', { name: 'Video Details', exact: true }).querySelector('.vc-chips');
    expect(chips).not.toBeNull();
    if (!chips) throw new Error('Details chips missing');
    const chipButton = within(chips as HTMLElement).getByRole('button', { name: new RegExp(`^${chip}`) });
    expect(chipButton).toHaveAttribute('data-filled', 'false');
    expect(chipButton).toHaveTextContent(kind === 'credits' || kind === 'links' ? `${chip} · 0` : chip);
    await addDetail(kind, add);
    expect(chipButton).toHaveAttribute('data-filled', 'true');
    expect(chipButton).toHaveTextContent(`${chip} · 1`);
    fireEvent.click(screen.getByRole('button', { name: `Remove ${removed}`, exact: true }));
    expect(chipButton).toHaveAttribute('data-filled', 'false');
    expect(chipButton.textContent).toBe(kind === 'credits' || kind === 'links' ? `${chip} · 0` : chip);
  });

  it.each(detailCases)('$kind add row hides at $limit and returns after removing', async ({ kind, chip, add, limit, removed }) => {
    const initial: VideoDetails = {
      ...emptyVideoDetails(),
      credits: kind === 'credits' ? Array.from({ length: 9 }, (_, i) => ({ id: `seed-${i}`, name: `Seed Person ${i}`, avatarUrl: null, role: 'host' as const })) : [],
      links: kind === 'links' ? Array.from({ length: 4 }, (_, i) => ({ url: `https://example.com/${i}`, label: `Seed Link ${i}` })) : [],
      thanks: kind === 'thanks' ? Array.from({ length: 2 }, (_, i) => ({ id: `seed-${i}`, name: `Seed Club ${i}`, logoUrl: null, category: null })) : [],
      gear: kind === 'gear' ? Array.from({ length: 9 }, (_, i) => `Seed Gear ${i}`) : [],
    };
    render(<MountedDetails initial={initial} />);
    expect(screen.getByRole('button', { name: add, exact: true })).toBeEnabled();
    await addDetail(kind, add);
    expect(screen.queryByRole('button', { name: add, exact: true })).toBeNull();
    expect(screen.getByRole('button', { name: `${chip} · ${limit}`, exact: true })).toHaveAttribute('data-filled', 'true');
    fireEvent.click(screen.getByRole('button', { name: `Remove ${removed}`, exact: true }));
    expect(screen.getByRole('button', { name: add, exact: true })).toBeEnabled();
    expect(screen.getByRole('button', { name: `${chip} · ${limit - 1}`, exact: true })).toHaveAttribute('data-filled', 'true');
  });
});