"use client";

import { useEffect, useId, useRef, useState } from 'react';
import { ensureStyles } from './ensurePrimitivesStyles.js';

export interface HelpTooltipProps {
  /** Localized accessible name of the question-mark button. */
  label: string;
  text: string;
  className?: string;
}

const VIEWPORT_MARGIN = 8;

function positionTooltip(trigger: HTMLElement, tooltip: HTMLElement, view: Window) {
  const viewport = view.visualViewport;
  const left = (viewport?.offsetLeft ?? 0) + VIEWPORT_MARGIN;
  const top = (viewport?.offsetTop ?? 0) + VIEWPORT_MARGIN;
  const width = (viewport?.width ?? view.document.documentElement.clientWidth) - 2 * VIEWPORT_MARGIN;
  const height = (viewport?.height ?? view.document.documentElement.clientHeight) - 2 * VIEWPORT_MARGIN;
  const anchor = trigger.getBoundingClientRect();

  tooltip.style.setProperty('--yyp-help-available-width', `${Math.max(0, width)}px`);
  const below = top + height - anchor.bottom;
  const above = anchor.top - top;
  const placeAbove = tooltip.scrollHeight > below && above > below;
  tooltip.style.maxHeight = `${Math.max(0, placeAbove ? above : below)}px`;

  const bubble = tooltip.getBoundingClientRect();
  const centered = anchor.left + (anchor.width - bubble.width) / 2;
  tooltip.style.left = `${Math.max(left, Math.min(centered, left + width - bubble.width))}px`;
  const adjacent = placeAbove ? anchor.top - bubble.height : anchor.bottom;
  tooltip.style.top = `${Math.max(top, Math.min(adjacent, top + height - bubble.height))}px`;
}

export function HelpTooltip({ label, text, className = '' }: HelpTooltipProps) {
  const id = useId();
  const containerRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const open = !dismissed && (hovered || focused || pinned);

  useEffect(ensureStyles, []);

  useEffect(() => {
    const container = containerRef.current;
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    const view = tooltip?.ownerDocument.defaultView;
    if (!open || !container || !trigger || !tooltip || !view) return;

    const document = tooltip.ownerDocument;
    // The top layer avoids clipping by scrollable and transformed ancestors.
    if (typeof tooltip.showPopover === 'function') {
      tooltip.setAttribute('popover', 'manual');
      tooltip.showPopover();
    }

    const updatePosition = () => positionTooltip(trigger, tooltip, view);
    updatePosition();
    tooltip.dataset.positioned = '';

    const dismiss = () => {
      setPinned(false);
      setDismissed(true);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      dismiss();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!event.composedPath().includes(container)) dismiss();
    };

    const viewport = view.visualViewport;
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(updatePosition) : undefined;
    observer?.observe(trigger);
    observer?.observe(tooltip);
    view.addEventListener('resize', updatePosition);
    view.addEventListener('scroll', updatePosition, true);
    viewport?.addEventListener('resize', updatePosition);
    viewport?.addEventListener('scroll', updatePosition);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      observer?.disconnect();
      view.removeEventListener('resize', updatePosition);
      view.removeEventListener('scroll', updatePosition, true);
      viewport?.removeEventListener('resize', updatePosition);
      viewport?.removeEventListener('scroll', updatePosition);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
      delete tooltip.dataset.positioned;
      if (tooltip.isConnected) tooltip.hidePopover?.();
    };
  }, [open]);

  return (
    <span
      ref={containerRef}
      className={`yyp-help ${className}`}
      onPointerEnter={event => {
        if (event.pointerType === 'touch') return;
        setHovered(true);
        setDismissed(false);
      }}
      onPointerLeave={event => {
        if (event.pointerType !== 'touch') setHovered(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="yyp-btn yyp-btn-ghost yyp-help-trigger"
        aria-label={label}
        aria-describedby={id}
        onFocus={() => {
          setFocused(true);
          setDismissed(false);
        }}
        onBlur={() => {
          setFocused(false);
          setPinned(false);
        }}
        onClick={() => {
          setPinned(!pinned);
          setDismissed(pinned);
        }}
      >
        <span aria-hidden="true">?</span>
      </button>
      <span
        ref={tooltipRef}
        id={id}
        role="tooltip"
        hidden={!open}
        tabIndex={-1}
        className="yyp-help-tooltip"
        onMouseDown={event => event.preventDefault()}
      >
        {text}
      </span>
    </span>
  );
}
