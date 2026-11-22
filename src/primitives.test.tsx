import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { Button, Input, Slider, Spinner, Toggle } from './primitives.js';
import { primitivesCss, primitivesStyleId } from './primitivesStyles.js';

afterEach(() => {
  cleanup();
  document.getElementById(primitivesStyleId)?.remove();
});

it('associates an input with its native label and error', () => {
  render(
    <>
      <label htmlFor="email">Email</label>
      <Input id="email" error aria-describedby="email-error" />
      <span id="email-error">Email is required</span>
    </>,
  );

  const input = screen.getByRole('textbox', { name: 'Email', description: 'Email is required' });
  expect(input.getAttribute('aria-invalid')).toBe('true');
  input.focus();
  expect(document.activeElement).toBe(input);
});

it('blocks disabled and loading buttons while retaining their names', () => {
  const onClick = vi.fn();
  render(
    <>
      <Button loading onClick={onClick}>Save</Button>
      <Button disabled onClick={onClick}>Delete</Button>
    </>,
  );

  const save = screen.getByRole<HTMLButtonElement>('button', { name: 'Save' });
  const remove = screen.getByRole<HTMLButtonElement>('button', { name: 'Delete' });
  expect(save.getAttribute('aria-busy')).toBe('true');
  expect(save.disabled).toBe(true);
  expect(remove.disabled).toBe(true);
  fireEvent.click(save);
  fireEvent.click(remove);
  expect(onClick).not.toHaveBeenCalled();
});

it('uses native button activation for the toggle and ignores a disabled slider', () => {
  const toggle = vi.fn();
  const slide = vi.fn();
  render(
    <>
      <Toggle checked={false} onChange={toggle} aria-label="Enabled" />
      <Slider value={50} onChange={slide} disabled aria-label="Sensitivity" />
    </>,
  );

  const control = screen.getByRole('switch', { name: 'Enabled', checked: false });
  control.focus();
  expect(document.activeElement).toBe(control);
  fireEvent.click(control);
  expect(toggle).toHaveBeenCalledWith(true);

  const slider = screen.getByRole('slider', { name: 'Sensitivity' });
  expect(slider.tabIndex).toBe(-1);
  fireEvent.keyDown(slider, { key: 'ArrowRight' });
  fireEvent.pointerDown(slider);
  expect(slide).not.toHaveBeenCalled();
});

it('renders a size and localized loading name and keeps the default name', () => {
  const markup = renderToString(<Spinner size={24} aria-label="Загрузка" />);
  expect(markup).toContain('aria-label="Загрузка"');
  expect(markup).toContain('width:24px;height:24px');

  render(<Spinner />);
  expect(screen.getByRole('status', { name: 'Loading...' })).toBeTruthy();
});

it('reuses the stylesheet installed by a server-rendered page', () => {
  const style = document.createElement('style');
  style.id = primitivesStyleId;
  style.textContent = primitivesCss;
  document.head.append(style);
  render(<><Input /><Button>Save</Button></>);

  expect(document.querySelectorAll(`#${primitivesStyleId}`)).toHaveLength(1);
  expect(document.getElementById(primitivesStyleId)).toBe(style);
});

it('installs the default theme stylesheet once when it is absent', () => {
  render(<><Input /><Button>Save</Button></>);
  const styles = document.querySelectorAll(`#${primitivesStyleId}`);
  expect(styles).toHaveLength(1);
  expect(styles[0].textContent).toBe(primitivesCss);
});
