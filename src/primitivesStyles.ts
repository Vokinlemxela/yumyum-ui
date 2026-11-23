export const primitivesStyleId = 'yyp-primitives-styles';
// Dark defaults allow the components to render without a host theme.
// Hosts can override any --yyp-* token.
const MONO = `ui-monospace,'SF Mono',SFMono-Regular,Menlo,Consolas,monospace`;
const RING = `0 0 0 2px rgba(var(--yyp-accent-rgb,16,185,129),.5)`;
export const primitivesCss = `
/* ==================== BADGE / CHIP ==================== */
.yyp-badge{display:inline-flex;align-items:center;padding:2px 6px;border-radius:var(--yyp-radius-xs,2px);font-family:${MONO};font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;border:1px solid;font-variant-numeric:tabular-nums}
.yyp-badge-primary{background:rgba(var(--yyp-accent-rgb,16,185,129),.1);color:var(--yyp-accent,#10b981);border-color:rgba(var(--yyp-accent-rgb,16,185,129),.3)}
.yyp-badge-warning{background:rgba(var(--yyp-warning-rgb,245,165,36),.1);color:var(--yyp-warning,#f5a524);border-color:rgba(var(--yyp-warning-rgb,245,165,36),.3)}
.yyp-badge-danger{background:rgba(var(--yyp-danger-rgb,244,80,106),.1);color:var(--yyp-danger,#f4506a);border-color:rgba(var(--yyp-danger-rgb,244,80,106),.3)}
.yyp-badge-info{background:rgba(var(--yyp-blue-rgb,59,130,246),.1);color:var(--yyp-blue,#3b82f6);border-color:rgba(var(--yyp-blue-rgb,59,130,246),.3)}
.yyp-badge-neutral{background:var(--yyp-surface-2,#1e2228);color:var(--yyp-text-2,#a9b2bb);border-color:var(--yyp-border,#2c323a)}
.yyp-badge-rec{background:rgba(var(--yyp-danger-rgb,244,80,106),.1);color:var(--yyp-danger,#f4506a);border-color:rgba(var(--yyp-danger-rgb,244,80,106),.4);animation:yyp-pulse 1.4s infinite}

/* ==================== BUTTON ==================== */
.yyp-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:var(--yyp-control-h,32px);padding:0 12px;box-sizing:border-box;border-radius:var(--yyp-radius-sm,5px);border:1px solid;cursor:pointer;font-family:${MONO};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-variant-numeric:tabular-nums;transition:background var(--yyp-transition-fast,.12s),border-color var(--yyp-transition-fast,.12s),transform var(--yyp-transition-fast,.12s);color:var(--yyp-text,#f0f2f4)}
.yyp-btn-sm{height:var(--yyp-control-h-sm,28px);padding:0 10px}
.yyp-btn-lg{height:var(--yyp-control-h-lg,36px);padding:0 16px}
.yyp-btn:focus-visible{outline:none;box-shadow:${RING}}
.yyp-btn:active{transform:scale(.95)}
.yyp-btn:disabled,.yyp-btn[aria-disabled="true"]{opacity:.5;cursor:not-allowed}
.yyp-btn:disabled:active,.yyp-btn[aria-disabled="true"]:active{transform:none}
.yyp-btn-default{background:var(--yyp-surface-2,#1e2228);border-color:var(--yyp-border,#2c323a)}
.yyp-btn-default:hover:not(:disabled){background:var(--yyp-surface-3,#262b31);border-color:var(--yyp-border-strong,#3a424c)}
.yyp-btn-active{background:rgba(var(--yyp-accent-rgb,16,185,129),.1);border-color:var(--yyp-accent,#10b981);color:var(--yyp-accent,#10b981)}
.yyp-btn-ghost{border:1px solid transparent;background:transparent}
.yyp-btn-ghost:hover:not(:disabled){background:var(--yyp-surface-2,#1e2228)}
.yyp-btn.primary{color:var(--yyp-bg,#0b0d0f);background:var(--yyp-accent,#10b981);border-color:var(--yyp-accent,#10b981)}
.yyp-btn.primary:hover:not(:disabled){background:var(--yyp-accent-hover,#34d399);border-color:var(--yyp-accent-hover,#34d399)}
.yyp-btn.danger{color:var(--yyp-bg,#0b0d0f);background:var(--yyp-danger,#f4506a);border-color:var(--yyp-danger,#f4506a)}
.yyp-btn.danger:hover:not(:disabled){filter:brightness(1.1)}
.yyp-btn-ghost.danger{color:var(--yyp-danger,#f4506a);background:transparent;border-color:transparent}
.yyp-btn-ghost.danger:hover:not(:disabled){background:rgba(var(--yyp-danger-rgb,244,80,106),.1)}
.yyp-btn.icon{width:var(--yyp-control-h-sm,28px);height:var(--yyp-control-h-sm,28px);min-width:var(--yyp-control-h-sm,28px);padding:0}
.yyp-btn-loading{color:transparent!important}
.yyp-btn-loading .yyp-btn-spin{position:absolute;top:50%;left:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border:2px solid rgba(var(--yyp-text-rgb,240,242,244),.3);border-top-color:currentColor;border-radius:50%;color:var(--yyp-text,#f0f2f4);animation:yyp-rot .8s linear infinite}

/* ==================== INPUT / SELECT ==================== */
.yyp-input{height:var(--yyp-control-h,32px);box-sizing:border-box;background:var(--yyp-input-bg,#0e1013);border:1px solid var(--yyp-border-strong,#3a424c);border-radius:var(--yyp-radius-sm,5px);padding:0 10px;color:var(--yyp-text,#f0f2f4);font-family:${MONO};font-size:12px;font-variant-numeric:tabular-nums;outline:none;transition:border-color var(--yyp-transition-fast,.12s),box-shadow var(--yyp-transition-fast,.12s)}
textarea.yyp-input{height:auto;padding:8px 10px;line-height:1.5}
.yyp-input:focus{border-color:var(--yyp-accent,#10b981);box-shadow:0 0 0 2px rgba(var(--yyp-accent-rgb,16,185,129),.15)}
.yyp-input:disabled{opacity:.5;cursor:not-allowed}
.yyp-input::placeholder{color:var(--yyp-text-3,#6a727b)}
.yyp-input-error{border-color:var(--yyp-danger,#f4506a)}
.yyp-input-error:focus{border-color:var(--yyp-danger,#f4506a);box-shadow:0 0 0 2px rgba(var(--yyp-danger-rgb,244,80,106),.15)}

.yyp-select{height:var(--yyp-control-h,32px);box-sizing:border-box;background:var(--yyp-input-bg,#0e1013);border:1px solid var(--yyp-border-strong,#3a424c);border-radius:var(--yyp-radius-sm,5px);padding:0 32px 0 10px;color:var(--yyp-text,#f0f2f4);font-family:${MONO};font-size:12px;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a9b2bb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");background-repeat:no-repeat;background-position:right 10px center;background-size:14px;transition:border-color var(--yyp-transition-fast,.12s),box-shadow var(--yyp-transition-fast,.12s)}
.yyp-select:focus{border-color:var(--yyp-accent,#10b981);box-shadow:0 0 0 2px rgba(var(--yyp-accent-rgb,16,185,129),.15)}
.yyp-select:disabled{opacity:.5;cursor:not-allowed}

/* ==================== CHECKBOX / RADIO ==================== */
.yyp-check{width:14px;height:14px;min-width:14px;min-height:14px;margin:0;cursor:pointer;accent-color:var(--yyp-accent,#10b981)}
.yyp-check:focus-visible{outline:none;box-shadow:${RING};border-radius:var(--yyp-radius-xs,2px)}
.yyp-check:disabled{opacity:.5;cursor:not-allowed}

/* ==================== TOGGLE (SWITCH) ==================== */
.yyp-toggle{position:relative;display:inline-flex;align-items:center;width:38px;height:22px;flex:0 0 auto;border:none;padding:0;border-radius:999px;background:var(--yyp-input-bg,#0e1013);box-shadow:inset 0 0 0 1px var(--yyp-border-strong,#3a424c);cursor:pointer;transition:background var(--yyp-transition-normal,.2s)}
.yyp-toggle-knob{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--yyp-text-2,#a9b2bb);transition:transform var(--yyp-transition-normal,.2s),background var(--yyp-transition-normal,.2s)}
.yyp-toggle[aria-checked="true"]{background:var(--yyp-accent,#10b981);box-shadow:inset 0 0 0 1px var(--yyp-accent,#10b981)}
.yyp-toggle[aria-checked="true"] .yyp-toggle-knob{transform:translateX(16px);background:var(--yyp-bg,#0b0d0f)}
.yyp-toggle:focus-visible{outline:none;box-shadow:${RING}}
.yyp-toggle:disabled{opacity:.5;cursor:not-allowed}

/* ==================== SLIDER ==================== */
.yyp-slider{position:relative;height:6px;width:100%;background:var(--yyp-input-bg,#0e1013);border-radius:999px;cursor:pointer;overflow:hidden;outline:none;user-select:none}
.yyp-slider-disabled{opacity:.5;cursor:not-allowed}
.yyp-slider-disabled .yyp-slider-handle{display:none}
.yyp-slider:focus-visible{box-shadow:${RING}}
.yyp-slider-fill{position:absolute;height:100%;left:0;top:0;background:var(--yyp-accent,#10b981);transition:background-color var(--yyp-transition-fast,.15s)}
.yyp-slider-handle{position:absolute;top:50%;transform:translate(-50%,-50%);height:10px;width:10px;border-radius:50%;background:var(--yyp-text,#f0f2f4);border:1px solid var(--yyp-accent,#10b981);box-shadow:0 0 3px rgba(0,0,0,.5);opacity:0;transition:opacity var(--yyp-transition-fast,.15s)}
.yyp-slider:hover .yyp-slider-handle,.yyp-slider:focus-visible .yyp-slider-handle{opacity:1}

/* ==================== SPINNER ==================== */
.yyp-spinner{display:inline-flex;align-items:center;justify-content:center;pointer-events:none}
.yyp-spinner-svg{animation:yyp-rot 1s linear infinite;height:40px;width:40px;color:var(--yyp-accent,#10b981)}

/* ==================== FIELD ==================== */
.yyp-field{display:grid;gap:6px;min-width:0}
.yyp-field-label{color:var(--yyp-text,#f0f2f4)}
.yyp-field-description{color:var(--yyp-text-2,#a9b2bb)}
.yyp-field-error{color:var(--yyp-danger,#f4506a)}

/* ==================== DIALOG ==================== */
.yyp-dialog{box-sizing:border-box;width:min(35rem,calc(100% - 2rem));max-height:calc(100% - 2rem);padding:0;overflow:auto;border:1px solid var(--yyp-border-strong,#3a424c);border-radius:var(--yyp-radius-sm,5px);background:var(--yyp-surface-2,#1e2228);color:var(--yyp-text,#f0f2f4)}
.yyp-dialog::backdrop{background:rgba(0,0,0,.65)}
.yyp-dialog-content{padding:1rem}
.yyp-dialog-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.75rem}
.yyp-dialog-header h2{margin:0;font-size:1.125rem}
.yyp-dialog-close{min-width:var(--yyp-control-h,32px);padding:0;font-size:1.25rem}
.yyp-dialog-description{margin:0 0 .75rem;color:var(--yyp-text-2,#a9b2bb)}

/* ==================== HELP TOOLTIP ==================== */
.yyp-help{display:inline-flex;vertical-align:middle}
.yyp-help-trigger{width:24px;height:24px;min-width:24px;padding:0;border:1px solid var(--yyp-border,#2c323a);border-radius:50%;font-size:12px}
.yyp-help-tooltip{position:fixed;visibility:hidden;inset:auto;z-index:1000;box-sizing:border-box;width:max-content;max-width:min(18rem,var(--yyp-help-available-width,calc(100vw - 16px)));margin:0;padding:6px 9px;overflow:auto;overscroll-behavior:contain;white-space:normal;overflow-wrap:anywhere;border:1px solid var(--yyp-border-strong,#3a424c);border-radius:var(--yyp-radius-sm,5px);background:var(--yyp-surface-2,#1e2228);color:var(--yyp-text,#f0f2f4);font-size:.8125rem;line-height:1.4}
.yyp-help-tooltip[data-positioned]{visibility:visible}
.yyp-help-tooltip[hidden]{display:none}

@keyframes yyp-rot{to{transform:rotate(360deg)}}
@keyframes yyp-pulse{0%,100%{opacity:1}50%{opacity:.3}}
@media (prefers-reduced-motion:reduce){
  .yyp-badge-rec{animation:none}
  .yyp-spinner-svg,.yyp-btn-loading .yyp-btn-spin{animation-duration:1.5s}
  .yyp-btn:active{transform:none}
  .yyp-btn,.yyp-input,.yyp-select,.yyp-toggle,.yyp-toggle-knob,.yyp-slider-fill{transition:none}
}
`;
