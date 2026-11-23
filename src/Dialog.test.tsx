import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { Dialog } from './primitives.js';

const dialogPrototype = HTMLDialogElement.prototype;
const originalShowModal = Object.getOwnPropertyDescriptor(dialogPrototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(dialogPrototype, 'close');

beforeAll(() => {
  // jsdom lacks the modal top layer. Browser checks exercise native focus and Escape.
  Object.defineProperty(dialogPrototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = true;
      this.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    },
  });
  Object.defineProperty(dialogPrototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) { this.open = false; },
  });
});

afterEach(cleanup);
afterAll(() => {
  if (originalShowModal) Object.defineProperty(dialogPrototype, 'showModal', originalShowModal);
  else Reflect.deleteProperty(dialogPrototype, 'showModal');
  if (originalClose) Object.defineProperty(dialogPrototype, 'close', originalClose);
  else Reflect.deleteProperty(dialogPrototype, 'close');
});

it('renders stable label and description markup before opening after hydration', () => {
  const html = renderToString(
    <Dialog open title="Add camera" description="Enter the camera address" onClose={() => {}}>
      <label>Address <input /></label>
    </Dialog>,
  );
  const template = document.createElement('template');
  template.innerHTML = html;
  const dialog = template.content.querySelector('dialog')!;
  expect(dialog.open).toBe(false);
  expect(template.content.getElementById(dialog.getAttribute('aria-labelledby')!)?.textContent).toBe('Add camera');
  expect(template.content.getElementById(dialog.getAttribute('aria-describedby')!)?.textContent)
    .toBe('Enter the camera address');
});

it('opens a semantically named dialog and returns focus to the opener', () => {
  const onClose = vi.fn();
  const initialFocusRef = { current: null as HTMLInputElement | null };
  const view = (open: boolean) => (
    <>
      <button>Open camera setup</button>
      <Dialog open={open} title="Add camera" description="Enter the camera address"
        initialFocusRef={initialFocusRef} onClose={onClose}>
        <label>Address <input ref={initialFocusRef} /></label>
      </Dialog>
    </>
  );
  const { rerender } = render(view(false));
  const opener = screen.getByRole('button', { name: 'Open camera setup' });
  opener.focus();
  rerender(view(true));

  const dialog = screen.getByRole<HTMLDialogElement>('dialog', {
    name: 'Add camera', description: 'Enter the camera address',
  });
  expect(document.activeElement).toBe(within(dialog).getByRole('textbox', { name: 'Address' }));
  const cancel = new Event('cancel', { cancelable: true });
  fireEvent(dialog, cancel);
  expect(cancel.defaultPrevented).toBe(true);
  expect(onClose.mock.calls).toEqual([['escape']]);
  expect(dialog.open).toBe(true);

  rerender(view(false));
  expect(dialog.open).toBe(false);
  expect(document.activeElement).toBe(opener);
});

it('ignores built-in dismiss actions while locked but lets the host close after saving', () => {
  const onClose = vi.fn();
  const view = (open: boolean, dismissDisabled: boolean) => (
    <Dialog open={open} title="Device discovery" closeLabel="Close discovery"
      dismissDisabled={dismissDisabled} onClose={onClose}>
      <button type="button">Scan</button>
    </Dialog>
  );
  const { rerender } = render(view(true, true));
  const dialog = screen.getByRole<HTMLDialogElement>('dialog', { name: 'Device discovery' });
  const close = within(dialog).getByRole<HTMLButtonElement>('button', { name: 'Close discovery' });
  expect(close.disabled).toBe(true);
  fireEvent.click(close);
  fireEvent(dialog, new Event('cancel', { cancelable: true }));
  fireEvent.pointerDown(dialog, { button: 0 });
  fireEvent.click(dialog);
  expect(onClose).not.toHaveBeenCalled();
  expect(dialog.open).toBe(true);

  rerender(view(false, true));
  expect(dialog.open).toBe(false);
  expect(onClose).not.toHaveBeenCalled();
});

it('requests backdrop and close-button dismissal without treating an inside drag as a backdrop click', () => {
  const onClose = vi.fn();
  const view = (closeOnBackdrop: boolean) => (
    <Dialog open title="Add camera" closeOnBackdrop={closeOnBackdrop} onClose={onClose}>
      <input aria-label="Address" />
    </Dialog>
  );
  const { rerender } = render(view(true));
  const dialog = screen.getByRole('dialog', { name: 'Add camera' });
  fireEvent.pointerDown(within(dialog).getByRole('textbox'), { button: 0 });
  fireEvent.click(dialog);
  expect(onClose).not.toHaveBeenCalled();

  fireEvent.pointerDown(dialog, { button: 0 });
  fireEvent.pointerCancel(dialog);
  fireEvent.click(dialog);
  expect(onClose).not.toHaveBeenCalled();

  fireEvent.pointerDown(dialog, { button: 0 });
  fireEvent.click(dialog);
  expect(onClose.mock.calls).toEqual([['backdrop']]);

  rerender(view(false));
  fireEvent.pointerDown(dialog, { button: 0 });
  fireEvent.click(dialog);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
  expect(onClose.mock.calls).toEqual([['backdrop'], ['close-button']]);
});

it('wraps Tab around enabled controls and holds focus on the title when there are none', () => {
  const rects = vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue(
    Object.assign([new DOMRect(0, 0, 10, 10)], { item: () => new DOMRect(0, 0, 10, 10) }),
  );
  const view = (locked: boolean) => (
    <Dialog open title="Add camera" dismissDisabled={locked} onClose={() => {}}>
      <input disabled={locked} aria-label="Address" />
      <button disabled>Disabled action</button>
    </Dialog>
  );
  try {
    const { rerender } = render(view(false));
    const dialog = screen.getByRole('dialog', { name: 'Add camera' });
    const close = within(dialog).getByRole('button', { name: 'Close' });
    const address = within(dialog).getByRole('textbox', { name: 'Address' });
    close.focus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(address);
    fireEvent.keyDown(address, { key: 'Tab' });
    expect(document.activeElement).toBe(close);

    rerender(view(true));
    const title = within(dialog).getByRole('heading', { name: 'Add camera' });
    title.focus();
    fireEvent.keyDown(title, { key: 'Tab' });
    expect(document.activeElement).toBe(title);
  } finally {
    rects.mockRestore();
  }
});
