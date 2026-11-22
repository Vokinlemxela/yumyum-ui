import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Field, Input, Select } from './primitives.js';

afterEach(cleanup);

it('associates native inputs and selects with their labels, hints, and errors', () => {
  render(
    <>
      <Field id="request-email" label="Contact email" description="Work address" error="Email is required">
        {props => <Input type="email" required {...props} />}
      </Field>
      <Field label="Object classification" description="Applies to this camera" error="Select a supported mode">
        {props => <Select {...props}><option value="all">People and vehicles</option></Select>}
      </Field>
    </>,
  );

  const email = screen.getByRole<HTMLInputElement>('textbox', {
    name: 'Contact email', description: 'Work address Email is required',
  });
  const mode = screen.getByRole<HTMLSelectElement>('combobox', {
    name: 'Object classification', description: 'Applies to this camera Select a supported mode',
  });
  expect(email.labels?.[0]?.textContent).toBe('Contact email');
  expect(mode.labels?.[0]?.textContent).toBe('Object classification');
  expect(email.id).toBe('request-email');
  expect(mode.id).not.toBe(email.id);
  expect(email.getAttribute('aria-invalid')).toBe('true');
  expect(mode.getAttribute('aria-invalid')).toBe('true');
});

it('retains its generated control ID and removes the error association when cleared', () => {
  const form = (error?: string) => (
    <Field label="Contact email" description="Work address" error={error}>
      {props => <Input type="email" {...props} />}
    </Field>
  );
  const view = render(form('Email is required'));
  const input = screen.getByRole('textbox', { name: 'Contact email' });
  const initialId = input.id;
  view.rerender(form());
  expect(input.id).toBe(initialId);
  expect(input.getAttribute('aria-describedby')).toBe(`${initialId}-description`);
  expect(input.hasAttribute('aria-invalid')).toBe(false);
  expect(screen.queryByText('Email is required')).toBeNull();
});
