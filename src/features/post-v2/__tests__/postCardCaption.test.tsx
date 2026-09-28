import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PostCard } from '../components/PostSuccessV2';

describe('PostSuccessV2 PostCard caption', () => {
  it('renders a tagged member as their name, not the storage markup', () => {
    const { container } = render(
      <MemoryRouter>
        <PostCard
          completedFiles={0}
          resolved
          result={{ caption: 'Great round with @[Ben Smith](u:3f2b1c9e-8a7d-4e6f-9b1a-2c3d4e5f6a7b)' } as never}
        />
      </MemoryRouter>,
    );
    expect(container.textContent).toBe('Great round with Ben Smith');
  });
});
