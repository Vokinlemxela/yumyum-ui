import { afterEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { HelpTooltip } from './primitives.js';

const label = 'Что такое GOP?';
const text = 'Число кадров между ключевыми кадрами.';

afterEach(cleanup);

it('gives each localized trigger its own description before hydration', () => {
  const markup = renderToString(
    <>
      <HelpTooltip label={label} text={text} />
      <HelpTooltip label="Что такое битрейт?" text="Объём данных за секунду." />
    </>,
  );
  const template = document.createElement('template');
  template.innerHTML = markup;
  const buttons = template.content.querySelectorAll('button');
  const ids = Array.from(buttons, button => button.getAttribute('aria-describedby')!);
  expect(buttons[0].getAttribute('aria-label')).toBe(label);
  expect(new Set(ids).size).toBe(2);
  const tooltip = template.content.getElementById(ids[0])!;
  expect(tooltip.textContent).toBe(text);
  expect(tooltip.getAttribute('role')).toBe('tooltip');
  expect(tooltip.hidden).toBe(true);
});

it('stays visible when the pointer moves onto the tooltip and closes on mouse out', () => {
  render(<HelpTooltip label={label} text={text} />);
  const trigger = screen.getByRole('button', { name: label, description: text });
  fireEvent.pointerOver(trigger, { pointerType: 'mouse' });
  const tooltip = screen.getByRole('tooltip');
  expect(tooltip.textContent).toBe(text);

  fireEvent.pointerOut(trigger, { pointerType: 'mouse', relatedTarget: tooltip });
  expect(screen.getByRole('tooltip')).toBe(tooltip);
  fireEvent.pointerOut(tooltip, { pointerType: 'mouse', relatedTarget: document.body });
  expect(screen.queryByRole('tooltip')).toBeNull();
});

it('keeps focus on the trigger after Escape and reopens on keyboard refocus', () => {
  render(<><HelpTooltip label={label} text={text} /><button>Next field</button></>);
  const trigger = screen.getByRole('button', { name: label });
  const next = screen.getByRole('button', { name: 'Next field' });
  act(() => trigger.focus());
  expect(screen.getByRole('tooltip')).toBeTruthy();

  const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  fireEvent(trigger, escape);
  expect(escape.defaultPrevented).toBe(true);
  expect(screen.queryByRole('tooltip')).toBeNull();
  expect(document.activeElement).toBe(trigger);
  act(() => next.focus());
  act(() => trigger.focus());
  expect(screen.getByRole('tooltip')).toBeTruthy();
  act(() => next.focus());
  expect(screen.queryByRole('tooltip')).toBeNull();
});

it('closes a pointer-only tooltip with Escape and stays closed until reentry', () => {
  render(<HelpTooltip label={label} text={text} />);
  const trigger = screen.getByRole('button', { name: label });
  fireEvent.pointerOver(trigger, { pointerType: 'mouse' });
  expect(screen.getByRole('tooltip')).toBeTruthy();

  fireEvent.keyDown(document.body, { key: 'Escape' });
  fireEvent.pointerMove(trigger, { pointerType: 'mouse' });
  expect(screen.queryByRole('tooltip')).toBeNull();
  fireEvent.pointerOut(trigger, { pointerType: 'mouse', relatedTarget: document.body });
  fireEvent.pointerOver(trigger, { pointerType: 'mouse' });
  expect(screen.getByRole('tooltip')).toBeTruthy();
});

it('toggles on tap or click and closes on an outside press without submitting a form', () => {
  const { container } = render(
    <form>
      <HelpTooltip label={label} text={text} />
      <input aria-label="Camera address" />
    </form>,
  );
  const trigger = screen.getByRole<HTMLButtonElement>('button', { name: label });
  fireEvent.pointerOver(trigger, { pointerType: 'touch' });
  expect(screen.queryByRole('tooltip')).toBeNull();
  expect(trigger.type).toBe('button');

  fireEvent.click(trigger);
  expect(screen.getByRole('tooltip')).toBeTruthy();
  fireEvent.click(trigger);
  expect(screen.queryByRole('tooltip')).toBeNull();
  fireEvent.click(trigger);
  fireEvent.pointerDown(container.querySelector('input')!, { pointerType: 'touch' });
  expect(screen.queryByRole('tooltip')).toBeNull();
});
