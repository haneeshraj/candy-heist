import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import SearchToggle from './SearchToggle';

const copy = {
  open: 'Search the services',
  label: 'Search',
  placeholder: 'Mixing, beats…',
  submit: 'Search',
  clear: 'Clear the search'
};

function Harness({ onSearch }: { onSearch: (query: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <SearchToggle
      copy={copy}
      value={value}
      onSearch={(query) => {
        setValue(query);
        onSearch(query);
      }}
    />
  );
}

describe('SearchToggle', () => {
  it('is a lens until clicked, then a box with the cursor in it', async () => {
    const user = userEvent.setup();
    render(<Harness onSearch={vi.fn()} />);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: copy.open }));
    expect(screen.getByRole('searchbox', { name: copy.label })).toHaveFocus();
  });

  it('searches on the button or Enter, never while typing', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<Harness onSearch={onSearch} />);
    await user.click(screen.getByRole('button', { name: copy.open }));

    await user.type(screen.getByRole('searchbox'), '  beat ');
    expect(onSearch).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: copy.submit }));
    expect(onSearch).toHaveBeenLastCalledWith('beat');

    await user.type(screen.getByRole('searchbox'), ' lessons{Enter}');
    expect(onSearch).toHaveBeenLastCalledWith('beat lessons');
  });

  it('clears the search and folds away on ×, focus back on the lens', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<Harness onSearch={onSearch} />);
    await user.click(screen.getByRole('button', { name: copy.open }));
    await user.type(screen.getByRole('searchbox'), 'mix{Enter}');

    await user.click(screen.getByRole('button', { name: copy.clear }));
    expect(onSearch).toHaveBeenLastCalledWith('');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.open })).toHaveFocus();
  });

  it('opens already showing a search that is on', () => {
    render(<SearchToggle copy={copy} value="mix" onSearch={vi.fn()} />);
    expect(screen.getByRole('searchbox')).toHaveValue('mix');
  });
});
