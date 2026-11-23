"use client";

import React, { useEffect, useId, useRef } from 'react';
import { tabbable } from 'tabbable';
import { ensureStyles } from './ensurePrimitivesStyles.js';

export type DialogCloseReason = 'escape' | 'backdrop' | 'close-button';

export interface DialogProps {
  open: boolean;
  onClose: (reason: DialogCloseReason) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  closeLabel?: string;
  closeOnBackdrop?: boolean;
  /** Blocks dismissal initiated by the built-in controls. The host can still set open to false. */
  dismissDisabled?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className = '',
  closeLabel = 'Close',
  closeOnBackdrop = true,
  dismissDisabled = false,
  initialFocusRef,
  returnFocusRef,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = description ? `${titleId}-description` : undefined;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const pointerStartedOnBackdrop = useRef(false);

  useEffect(ensureStyles, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    const document = dialog.ownerDocument;
    const opener = document.activeElement as HTMLElement | null;
    dialog.showModal();

    const initial = initialFocusRef?.current;
    if (initial && dialog.contains(initial)) initial.focus();
    if (document.activeElement === dialog || !dialog.contains(document.activeElement)) {
      titleRef.current?.focus();
    }

    return () => {
      pointerStartedOnBackdrop.current = false;
      const wasFocused = dialog.contains(document.activeElement);
      dialog.close();

      // A different open dialog may own focus when this one closes.
      if (wasFocused || document.activeElement === document.body) {
        const target = returnFocusRef?.current ?? opener;
        if (target?.isConnected) target.focus();
      }
    };
  }, [open, initialFocusRef, returnFocusRef]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dismissDisabled && dialog && dialog.ownerDocument.activeElement === dialog.ownerDocument.body) {
      titleRef.current?.focus();
    }
  }, [open, dismissDisabled]);

  const keepTabInside = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab' || event.defaultPrevented) return;
    const dialog = event.currentTarget;
    const active = dialog.ownerDocument.activeElement;
    if (active?.closest('dialog') !== dialog) return;

    const stops = tabbable(dialog);
    const first = stops[0];
    const last = stops.at(-1);
    const edge = event.shiftKey ? first : last;
    if (active === edge || !stops.some(stop => stop === active)) {
      event.preventDefault();
      const wrapTarget = event.shiftKey ? last : first;
      (wrapTarget ?? titleRef.current)?.focus();
    }
  };

  const requestClose = (reason: DialogCloseReason) => {
    if (open && !dismissDisabled) onClose(reason);
  };

  return (
    <dialog
      ref={dialogRef}
      className={`yyp-dialog ${className}`}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onKeyDown={keepTabInside}
      onCancel={event => {
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        requestClose('escape');
      }}
      onPointerDown={event => {
        pointerStartedOnBackdrop.current = event.target === event.currentTarget && event.button === 0;
        if (pointerStartedOnBackdrop.current) event.preventDefault();
      }}
      onPointerCancel={() => { pointerStartedOnBackdrop.current = false; }}
      onClick={event => {
        const fromBackdrop = pointerStartedOnBackdrop.current && event.target === event.currentTarget;
        pointerStartedOnBackdrop.current = false;
        if (fromBackdrop && closeOnBackdrop) requestClose('backdrop');
      }}
    >
      <div className="yyp-dialog-content">
        <header className="yyp-dialog-header">
          <h2 ref={titleRef} id={titleId} tabIndex={-1}>{title}</h2>
          <button
            type="button"
            className="yyp-btn yyp-btn-ghost yyp-dialog-close"
            aria-label={closeLabel}
            disabled={dismissDisabled}
            onClick={() => requestClose('close-button')}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        {descriptionId && <p id={descriptionId} className="yyp-dialog-description">{description}</p>}
        {children}
      </div>
    </dialog>
  );
}
