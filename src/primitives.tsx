"use client";
import React, { useEffect, useId, useRef } from 'react';

import { ensureStyles } from './ensurePrimitivesStyles.js';

export { Dialog } from './Dialog.js';
export type { DialogCloseReason, DialogProps } from './Dialog.js';

// ==================== PREMIUM BADGE ====================
export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'warning' | 'danger' | 'info' | 'neutral' | 'rec';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral' }) => {
  useEffect(() => {
    ensureStyles();
  }, []);

  return (
    <span className={`yyp-badge yyp-badge-${variant}`}>
      {label}
    </span>
  );
};

// ==================== BRUTALIST BUTTON ====================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  /** primary/danger также можно задать через className (обратная совместимость). */
  variant?: 'default' | 'ghost' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  /** Показать спиннер и заблокировать кнопку. */
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  active,
  variant = 'default',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  useEffect(() => {
    ensureStyles();
  }, []);

  let variantClass: string;
  if (variant === 'ghost') variantClass = 'yyp-btn-ghost';
  else if (variant === 'primary') variantClass = 'primary';
  else if (variant === 'danger') variantClass = 'danger';
  else variantClass = active ? 'yyp-btn-active' : 'yyp-btn-default';
  const sizeClass = size === 'sm' ? 'yyp-btn-sm' : size === 'lg' ? 'yyp-btn-lg' : '';

  return (
    <button
      className={`yyp-btn ${variantClass} ${sizeClass} ${loading ? 'yyp-btn-loading' : ''} ${className}`}
      aria-pressed={active}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="yyp-btn-spin" aria-hidden="true" />}
      {children}
    </button>
  );
};

// ==================== SLIDER (VOLUME / TIMELINE) ====================
export interface SliderProps extends Pick<React.AriaAttributes, 'aria-label' | 'aria-labelledby'> {
  value: number;
  onChange: (value: number) => void;
  /** Диапазон значения. По умолчанию 0..100 (обратная совместимость). */
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  hoverPreview?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    ensureStyles();
  }, []);

  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const snap = (v: number) => {
    const snapped = Math.round((v - min) / step) * step + min;
    // Убираем ошибки плавающей точки, ориентируясь на десятичные знаки шага.
    const decimals = (String(step).split('.')[1] || '').length;
    return Number(clamp(snapped).toFixed(decimals));
  };
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || !containerRef.current) return;
    isDragging.current = true;
    containerRef.current.setPointerCapture(e.pointerId);
    updateValue(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updateValue(e);
  };

  const finishDrag = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (containerRef.current) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const updateValue = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onChange(snap(min + frac * (max - min)));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const big = e.shiftKey ? step * 10 : step;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(snap(value + big));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(snap(value - big));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(min);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(max);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="slider"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-disabled={disabled || undefined}
      className={`yyp-slider ${disabled ? 'yyp-slider-disabled' : ''} ${className}`}
    >
      <div className="yyp-slider-fill" style={{ width: `${pct}%` }} />
      <div className="yyp-slider-handle" style={{ left: `calc(${pct}% - 5px)` }} />
    </div>
  );
};

// ==================== BUFFERING SPINNER ====================
export interface SpinnerProps extends Pick<React.AriaAttributes, 'aria-label'> {
  /** Width and height in CSS pixels. Defaults to 40 through the stylesheet. */
  size?: number;
}

export const Spinner: React.FC<SpinnerProps> = ({ size, 'aria-label': label = 'Loading...' }) => {
  useEffect(() => {
    ensureStyles();
  }, []);

  return (
    <div className="yyp-spinner" role="status" aria-label={label}>
      <svg
        className="yyp-spinner-svg"
        aria-hidden="true"
        style={size === undefined ? undefined : { width: size, height: size }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          style={{ opacity: 0.25 }}
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          style={{ opacity: 0.75 }}
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

// ==================== INPUT PRIMITIVE ====================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Подсветить рамкой ошибки. */
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({ className = '', error, type, ...props }) => {
  useEffect(() => {
    ensureStyles();
  }, []);

  // Чекбоксы/радио не должны получать «текстовый» стиль .yyp-input
  // (иначе искажаются) — это снимает костыль-сброс на стороне приложения.
  const isCheck = type === 'checkbox' || type === 'radio';
  const base = isCheck ? 'yyp-check' : `yyp-input${error ? ' yyp-input-error' : ''}`;

  return (
    <input
      type={type}
      className={`${base} ${className}`}
      aria-invalid={error || undefined}
      {...props}
    />
  );
};

// ==================== CHECKBOX PRIMITIVE ====================
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const Checkbox: React.FC<CheckboxProps> = ({ className = '', ...props }) => {
  useEffect(() => {
    ensureStyles();
  }, []);

  return <input type="checkbox" className={`yyp-check ${className}`} {...props} />;
};

// ==================== TOGGLE (SWITCH) PRIMITIVE ====================
export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  id?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled, className = '', ...rest }) => {
  useEffect(() => {
    ensureStyles();
  }, []);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`yyp-toggle ${className}`}
      onClick={() => !disabled && onChange(!checked)}
      {...rest}
    >
      <span className="yyp-toggle-knob" aria-hidden="true" />
    </button>
  );
};

// ==================== SELECT PRIMITIVE ====================
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select: React.FC<SelectProps> = ({ children, className = '', ...props }) => {
  useEffect(() => {
    ensureStyles();
  }, []);

  return (
    <select
      className={`yyp-select ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};

// ==================== TEXTAREA PRIMITIVE ====================
export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea: React.FC<TextAreaProps> = ({ className = '', ...props }) => {
  useEffect(() => {
    ensureStyles();
  }, []);

  return (
    <textarea
      className={`yyp-input resize-none ${className}`}
      {...props}
    />
  );
};

export interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
}

export interface FieldProps {
  id?: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  /** Apply the provided props to the labelable control. */
  children: (controlProps: FieldControlProps) => React.ReactNode;
}

function hasFieldMessage(message: React.ReactNode): boolean {
  return message != null && typeof message !== 'boolean' && message !== '';
}

export function Field({ id, label, description, error, className = '', children }: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const descriptionId = hasFieldMessage(description) ? `${controlId}-description` : undefined;
  const errorId = hasFieldMessage(error) ? `${controlId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');

  useEffect(() => {
    ensureStyles();
  }, []);

  return (
    <div className={`yyp-field ${className}`}>
      <label className="yyp-field-label" htmlFor={controlId}>{label}</label>
      {children({
        id: controlId,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': errorId ? true : undefined,
      })}
      {descriptionId && <div id={descriptionId} className="yyp-field-description">{description}</div>}
      {errorId && <div id={errorId} className="yyp-field-error">{error}</div>}
    </div>
  );
}
