**English** · [Русский](./README.ru.md)

# @yumyums/ui

Fast, themeable **React UI primitives** and the YouTube-style **player shell**
for [Yum-yum Player](https://github.com/Vokinlemxela/yumyum-player). Built for
dense operator UIs (VMS, dashboards, video walls): a monospace-first,
dark-by-default design system with **native fonts only** (works offline / in
isolated LANs), instant render, and no CSS build step.

```bash
npm install @yumyums/ui
```

- **Primitives** — `Badge`, `Button`, `Slider`, `Spinner`, `Input`, `Checkbox`,
  `Toggle`, `Select`, `TextArea`. Themeable via CSS variables; styles are
  **auto-injected** (no CSS import, no bundler config).
- **`<YumYumPlayerView>`** — full player chrome (timeline scrubber, volume,
  playback speed, autoplay/loop, Picture-in-Picture, fullscreen, hotkeys),
  decoupled from the engine via a `createPlayer` factory.

`react` and `react-dom` (18 **or** 19) are peer dependencies. The player view
additionally expects `@yumyum-player/core` (or any object satisfying
`PlayerHandle`).

---

## Design language

`@yumyums/ui` implements the **yumyums** design system — industrial /
utilitarian, function-first:

- **Monospace as the UI voice**, not just for code — reads like an instrument.
  All numeric values use `tabular-nums` so they don't jitter when they change.
- **Dark only.** Neutrals sit on a readable *height ladder* (`bg → surface-2 →
  surface-3`), inputs are recessed (`input-bg`), a single emerald **accent**
  means "live / active / healthy".
- **Instant render.** Native font stacks only, no web fonts, thin borders over
  heavy shadows, `backdrop-filter` reserved for floating layers.
- **Accessible baseline.** Visible `:focus-visible` ring, `role`/`aria` on
  custom controls (`Toggle`, `Slider`), and `prefers-reduced-motion` disables
  animation.

---

## Quick start

### Primitives

```tsx
import { Button, Badge, Input, Toggle, Select, Slider } from '@yumyums/ui/primitives';

function Panel() {
  const [notify, setNotify] = useState(true);
  const [volume, setVolume] = useState(60);

  return (
    <div>
      <Badge label="LIVE" variant="rec" />

      <Input placeholder="Camera name" />
      <Select defaultValue="h264">
        <option value="h264">H.264</option>
        <option value="h265">H.265</option>
      </Select>

      <Toggle checked={notify} onChange={setNotify} aria-label="Notifications" />
      <Slider aria-label="Volume" value={volume} onChange={setVolume} />

      <Button variant="primary" onClick={save}>Save</Button>
      <Button variant="ghost">Cancel</Button>
    </div>
  );
}
```

No stylesheet import is required — each component injects the shared stylesheet
once on first mount.

### Player view

```tsx
import { YumYumPlayerView } from '@yumyums/ui/player';
import { YumYumPlayer } from '@yumyum-player/core';
import { useCallback } from 'react';

export function Player({ url }: { url: string }) {
  // ⚠️ createPlayer MUST be referentially stable — see the note below.
  const createPlayer = useCallback(async (canvas: HTMLCanvasElement) => {
    const player = new YumYumPlayer({ canvas });
    await player.load(url);
    return { player, isLive: url.startsWith('ws') };
  }, [url]);

  return <YumYumPlayerView createPlayer={createPlayer} accentColor="#10b981" />;
}
```

---

## Styling & theming

The primitives install a shared stylesheet in the browser. To style
server-rendered HTML before hydration, place the same stylesheet in the
initial document head. The browser reuses it by ID.

```tsx
import { primitivesCss, primitivesStyleId } from '@yumyums/ui/primitives/styles';

// Inside <head>
<style id={primitivesStyleId}>{primitivesCss}</style>
```

Theming is done entirely through **CSS custom properties** prefixed `--yyp-*`.
Every token has a sensible dark default (the yumyums palette), so the library
looks correct with zero configuration. Override any token on `:root` (or any
scoped ancestor) to map the library onto your own theme.

```css
/* Map your app's theme tokens onto the library. */
:root {
  --yyp-accent:      #10b981;
  --yyp-accent-rgb:  16, 185, 129;   /* channels, for rgba() compositing */
  --yyp-surface-2:   #1e2228;
  --yyp-border-strong: #3a424c;
  --yyp-control-h:   32px;
}
```

> **`*-rgb` tokens are required for alpha.** Several styles composite with
> transparency (e.g. `rgba(var(--yyp-accent-rgb), .1)`), which needs the raw
> comma-separated channels, not a hex. When you override `--yyp-accent`, also
> override `--yyp-accent-rgb` (and likewise for `warning` / `danger` / `blue` /
> `text`).

### Token contract

| Token | Default | Role |
|---|---|---|
| `--yyp-bg` | `#0b0d0f` | app background (button `primary`/`danger` text sits on it) |
| `--yyp-surface-2` | `#1e2228` | raised surface — default button, neutral badge |
| `--yyp-surface-3` | `#262b31` | hover on raised |
| `--yyp-input-bg` | `#0e1013` | recessed controls — input, select, slider track, toggle |
| `--yyp-border` | `#2c323a` | default 1px border |
| `--yyp-border-strong` | `#3a424c` | input / structural borders |
| `--yyp-text` · `--yyp-text-rgb` | `#f0f2f4` · `240,242,244` | primary text |
| `--yyp-text-2` | `#a9b2bb` | secondary text, toggle knob (off) |
| `--yyp-text-3` | `#6a727b` | placeholders / disabled |
| `--yyp-accent` · `--yyp-accent-rgb` | `#10b981` · `16,185,129` | live / active / primary / focus ring |
| `--yyp-accent-hover` | `#34d399` | primary hover |
| `--yyp-warning` · `--yyp-warning-rgb` | `#f5a524` · `245,165,36` | warning badge |
| `--yyp-danger` · `--yyp-danger-rgb` | `#f4506a` · `244,80,106` | danger button/badge, input error |
| `--yyp-blue` · `--yyp-blue-rgb` | `#3b82f6` · `59,130,246` | info badge |
| `--yyp-radius-xs` / `--yyp-radius-sm` | `2px` / `5px` | badge / control corners |
| `--yyp-control-h-sm` / `--yyp-control-h` / `--yyp-control-h-lg` | `28px` / `32px` / `36px` | control heights (sm / md / lg) |
| `--yyp-transition-fast` / `--yyp-transition-normal` | `.12s` / `.2s` | hover / state transitions |

The `<YumYumPlayerView>` chrome is themed separately via its **`accentColor`**
prop (it injects its own `yyv-*` stylesheet); the `--yyp-*` tokens style the
primitives.

---

## Components

Every primitive forwards native props (`...rest`) to its underlying element, so
`id`, `name`, `disabled`, `onClick`, `data-*`, `aria-*`, `style`, etc. all work.
Pass extra classes via `className`.

### `Badge`

Small mono chip for status.

| Prop | Type | Default | |
|---|---|---|---|
| `label` | `string` | — | required |
| `variant` | `'primary' \| 'warning' \| 'danger' \| 'info' \| 'neutral' \| 'rec'` | `'neutral'` | `rec` pulses |

```tsx
<Badge label="ONLINE" variant="primary" />
<Badge label="REC" variant="rec" />
```

### `Button`

Extends `React.ButtonHTMLAttributes<HTMLButtonElement>`.

| Prop | Type | Default | |
|---|---|---|---|
| `variant` | `'default' \| 'ghost' \| 'primary' \| 'danger'` | `'default'` | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 28 / 32 / 36px |
| `active` | `boolean` | `false` | accent "pressed" state (sets `aria-pressed`) |
| `loading` | `boolean` | `false` | shows spinner, disables, sets `aria-busy` |

```tsx
<Button variant="primary" onClick={save}>Save</Button>
<Button variant="danger" loading={deleting}>Delete</Button>
<Button variant="ghost" size="sm" className="icon" aria-label="Close">✕</Button>
```

Add `className="icon"` for a square icon button. `primary`/`danger` can also be
set via `className` for backwards compatibility.

### `Input` / `TextArea`

`Input` extends `React.InputHTMLAttributes<HTMLInputElement>`, `TextArea` extends
`React.TextareaHTMLAttributes<HTMLTextAreaElement>`.

| Prop | Type | |
|---|---|---|
| `error` | `boolean` | (Input) red border + `aria-invalid` |

```tsx
<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
<Input type="number" error={invalid} />
<TextArea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
```

> `Input` with `type="checkbox"` / `"radio"` automatically renders as a checkbox
> style (not the text field), so you don't have to reset it.

### `Checkbox`

Extends `React.InputHTMLAttributes<HTMLInputElement>` (without `type`).

```tsx
<Checkbox checked={on} onChange={(e) => setOn(e.target.checked)} />
```

### `Toggle`

Controlled switch (`role="switch"`).

| Prop | Type | Default | |
|---|---|---|---|
| `checked` | `boolean` | — | required |
| `onChange` | `(checked: boolean) => void` | — | required |
| `disabled` | `boolean` | `false` | |
| `aria-label` | `string` | — | recommended |

```tsx
<Toggle checked={recording} onChange={setRecording} aria-label="Record 24/7" />
```

### `Select`

Extends `React.SelectHTMLAttributes<HTMLSelectElement>`. Native `<select>` with a
custom chevron.

```tsx
<Select value={codec} onChange={(e) => setCodec(e.target.value)}>
  <option value="h264">H.264</option>
  <option value="h265">H.265</option>
</Select>
```

### `Slider`

Pointer + keyboard slider (`role="slider"`). Controlled.

| Prop | Type | Default | |
|---|---|---|---|
| `value` | `number` | — | required |
| `onChange` | `(value: number) => void` | — | required |
| `min` / `max` / `step` | `number` | `0` / `100` / `1` | |
| `disabled` | `boolean` | `false` | |

Keyboard: arrows (±step), Shift+arrow (±10·step), Home/End.

```tsx
<Slider aria-label="Volume" value={volume} onChange={setVolume} min={0} max={100} step={5} />
```

### `Spinner`

Loading indicator with `role="status"`. It uses `--yyp-accent` and defaults
to 40 pixels and the accessible name `Loading...`.

```tsx
{loading && <Spinner size={24} aria-label="Loading results" />}
```

### `Field`

Group a native control with its label, optional hint, and optional error.
Pass the supplied props to the control. `Field` generates a stable ID when
the host omits one. The host supplies the text and validation.

```tsx
import { Field, Input } from '@yumyums/ui/primitives';

<Field label="Work email" description="Used to reply to your request" error={emailError}>
  {(props) => <Input {...props} type="email" value={email} onChange={onEmailChange} />}
</Field>
```

---

## `<YumYumPlayerView>`

A ready-made, framework-light chrome around a player. The view **owns the
`<canvas>`** and all controls; the player itself is created by *your*
`createPlayer` callback, so the UI package stays free of any streaming/RTSP/codec
knowledge.

```tsx
<YumYumPlayerView
  createPlayer={createPlayer}
  accentColor="#10b981"
  controls={{ pip: true, settings: true }}
  badges={[{ label: 'CAM 1', variant: 'neutral' }]}
/>
```

### Props

| Prop | Type | Default | |
|---|---|---|---|
| `createPlayer` | `(canvas) => Promise<{ player: PlayerHandle; isLive: boolean }>` | — | **required, must be referentially stable** |
| `accentColor` | `string` | `'#00FF66'` | progress bar / handle / active controls |
| `playbackRate` | `number` | — | controlled speed; applied live when it changes |
| `controls` | `Partial<Record<PlayerControlKey, boolean>>` | all visible | toggle individual controls |
| `chrome` | `'full' \| 'minimal' \| 'none'` | `'full'` | control-bar layout |
| `autoHideDelay` | `number` | `3000` | ms of inactivity before controls hide while playing |
| `persistKeyPrefix` | `string` | `'yumyum'` | localStorage namespace (volume/muted/rate/autoplay/loop) |
| `lang` | `'ru' \| 'en'` | `'en'` | control labels |
| `className` | `string` | — | on the root element |
| `overlayTopLeft` / `overlayTopRight` | `ReactNode` | — | corner slots (over the video) |
| `badges` | `{ label: string; variant?: 'rec' \| 'primary' \| 'warning' \| 'neutral' }[]` | — | top-left badges |
| `onReady` | `(player: PlayerHandle \| null) => void` | — | live handle, or `null` on teardown |

`PlayerControlKey` = `'play' | 'volume' | 'timeline' | 'time' | 'speed' | 'settings' | 'pip' | 'fullscreen'`.

### ⚠️ `createPlayer` must be referentially stable

The player-lifecycle effect depends on `createPlayer`. If you pass a **new
function identity on every render** (e.g. an inline arrow), the view will tear
down the player and reload the stream on every parent re-render (flicker +
rebuffer). Wrap it in `useCallback`/`useMemo` keyed on the stream source:

```tsx
const createPlayer = useCallback(async (canvas) => { /* ... */ }, [url]);
```

### Embedding in a host with its own controls (e.g. a VMS)

Set `chrome="none"` to render **no control buttons** — the view still shows the
canvas, intrinsic overlays (loading spinner, error, "no video") and the
`overlayTopLeft` / `overlayTopRight` / `badges` slots. Get the live player via
`onReady` and drive playback yourself:

```tsx
<YumYumPlayerView
  createPlayer={createPlayer}
  chrome="none"
  onReady={(player) => { hostRef.current = player; /* player?.mute(true) */ }}
  overlayTopRight={<MyControlBar />}
/>
```

`onReady(player)` fires when the player is created and `onReady(null)` when it is
torn down/recreated. (`chrome="minimal"` exists for generic single-player embeds;
hosts with their own UI use `none`.)

### `PlayerHandle`

The structural contract the view drives. The core's `YumYumPlayer` satisfies it,
so the UI package needs no build-time dependency on the engine:

```ts
interface PlayerHandle {
  play(): Promise<void>;
  pause(): void;
  seek(t: number): void;
  setVolume(v: number): void;
  mute(m: boolean): void;
  setPlaybackRate(r: number): void;
  getPlaybackRate(): number;
  getCurrentTime(): number;
  getDuration(): number;
  getTelemetry(): { currentPTS: number; duration: number; bufferedEnd: number;
    playbackState: string; playbackRate: number; renderedFrames: number;
    activeCodec: string; queueLength: number; /* ...optional fields */ };
  getQualityLevels?(): { id: string; label: string; kind: string; /* ... */ }[];
  getActiveQuality?(): string;
  setQuality?(id: string): Promise<void>;
  on(event: string, cb: (...args: unknown[]) => void): void;
  off(event: string, cb: (...args: unknown[]) => void): void;
  unlockAudio?(): Promise<void>;
  destroy(): void;
}
```

The quality menu uses IDs and labels from `getQualityLevels()` when the handle also implements `setQuality(id)`. An adapter can expose Auto by returning an option with ID `auto` or reporting `auto` through `getActiveQuality()` or `qualitychange`. The getter is authoritative when an adaptive bitrate event reports the rendered rendition. Only full chrome with PiP enabled and browser support prepares a canvas mirror.

---

## Exports

Use `@yumyums/ui/primitives` for shared controls and `@yumyums/ui/player` for the video view and its types. The root entry point continues to export both.

The package ships ESM. In Node 18, use `import` or dynamic `import()`. A CommonJS caller can use `require()` on runtimes with synchronous ESM loading enabled.

```ts
// Components
Badge, Button, Slider, Spinner, Input, Checkbox, Toggle, Select, TextArea, Field,
YumYumPlayerView

// Types
BadgeProps, ButtonProps, SliderProps, SpinnerProps, InputProps, CheckboxProps, ToggleProps,
SelectProps, TextAreaProps, FieldProps, FieldControlProps,
YumYumPlayerViewProps, PlayerHandle, PlayerControlKey
```

## Developing and releasing the UI library

[Component audit and development roadmap](./ROADMAP.md)

This repository contains the source for `@yumyums/ui`. The shared components depend on React and React DOM. To use the player controls with a playback engine, pass a stable `createPlayer` factory to `YumYumPlayerView`. The factory returns an object implementing `PlayerHandle`.

Clone this repository and run the checks from its root. These commands also work in a checkout that has no other YumYums projects alongside it.

```sh
git clone https://github.com/Vokinlemxela/yumyum-ui.git
cd yumyum-ui
npm ci
npm run typecheck
npm test
npm run build
```

Run `npm run dev` to rebuild the library as you edit. For a local consumer test, run `npm pack` after building and install the resulting `.tgz` in a test application.

[CI](./.github/workflows/ci.yml) checks pull requests and pushes to `main`. To release a new UI version, update `package.json` and `package-lock.json`, commit the changes, then publish a GitHub Release tagged `vX.Y.Z` at the matching commit. The [npm workflow](./.github/workflows/publish.yml) builds and publishes that version of `@yumyums/ui`. Each consuming application selects its version and commits its own lockfile.

## License

MIT — see [LICENSE](./LICENSE).
