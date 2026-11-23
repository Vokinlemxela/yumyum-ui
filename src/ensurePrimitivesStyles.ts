import { primitivesCss, primitivesStyleId } from './primitivesStyles.js';

export function ensureStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(primitivesStyleId)) return;
  const el = document.createElement('style');
  el.id = primitivesStyleId;
  el.textContent = primitivesCss;
  document.head.appendChild(el);
}
