import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Slider } from './index.js';

afterEach(cleanup);

describe('Slider', () => {
  it('supports both ARIA naming attributes', () => {
    render(
      <>
        <Slider aria-label="Volume" value={40} onChange={vi.fn()} />
        <span id="sensitivity-label">Sensitivity</span>
        <Slider aria-labelledby="sensitivity-label" value={50} onChange={vi.fn()} />
      </>,
    );

    expect(screen.getByRole('slider', { name: 'Volume' }))
      .not.toBe(screen.getByRole('slider', { name: 'Sensitivity' }));
  });

  it('uses the configured step for the arrow keys', () => {
    const onChange = vi.fn();
    render(<Slider min={1} max={3} step={0.2} value={1.4} onChange={onChange} />);
    const slider = screen.getByRole('slider');

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.keyDown(slider, { key: 'ArrowDown' });

    expect(onChange.mock.calls).toEqual([[1.6], [1.2]]);
  });

  it('ignores pointer movement after pointercancel', () => {
    const onChange = vi.fn();
    render(<Slider value={20} onChange={onChange} />);
    const slider = screen.getByRole('slider');
    slider.getBoundingClientRect = () => new DOMRect(0, 0, 100, 20);

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 20 });
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 40 });
    expect(onChange.mock.calls).toEqual([[20], [40]]);
    fireEvent.pointerCancel(slider, { pointerId: 1 });
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 80 });

    expect(onChange.mock.calls).toEqual([[20], [40]]);
  });
});
