import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { WatchTop100Redirect } from '@/pages/WatchTop100Redirect';

afterEach(cleanup);
function Landing() { const l = useLocation(); return <output data-testid="landed">{`${useNavigationType()} ${l.pathname}${l.search}`}</output>; }

describe('BRIEF 42A /watch/top100 redirect', () => {
  it('replaces /watch/top100 with the video page on the For you chip', () => {
    render(<MemoryRouter initialEntries={['/watch/top100']}><Routes><Route path="/watch/top100" element={<WatchTop100Redirect />} /><Route path="/amateur" element={<Landing />} /></Routes></MemoryRouter>);
    expect(screen.getByTestId('landed').textContent).toBe('REPLACE /amateur?view=watch&watch=all');
  });
});
