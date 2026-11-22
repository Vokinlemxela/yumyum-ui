**English** · [Русский](./ROADMAP.ru.md)

# Development plan for @yumyums/ui

Audit date: 22 November 2026. The review covers package version `1.0.0`, the [audited revision](https://github.com/Vokinlemxela/yumyum-ui/tree/fb11a38294eeb50b75562cd2166abb7e92619c67), and three consumers: the VMS web client, the website and the Player debugger.

**Design direction.** Keep one npm package and one release cycle. Give applications separate import paths for general controls and the video interface. Retain the root exports for existing consumers. Applications that use both layers can continue to pin a single version. Start with the reproducible failures in settings forms and video source replacement.

## What can be reused today

| Components | Uses and limitations |
| --- | --- |
| `Button`, `Input`, `Select`, `TextArea` | React wrappers for native HTML controls. The request form, sign-in screen and user administration already use them. `Input` supports error styling and `aria-invalid`. Applications supply labels, error messages and their associations. |
| `Checkbox`, `Toggle` | Filters and settings. The first uses a native checkbox; the second uses a button with `role="switch"` and a controlled `checked` value. Examples include event filtering and motion settings. |
| `Badge`, `Spinner` | Status and loading indicators. Both appear on the website. The badge has a recording-specific `rec` variant. The spinner has a fixed 40 px size and the accessible name `Loading...`. |
| `Slider` | A numeric range with `min`, `max` and `step`, used for detector settings in the VMS and volume in the player. It responds to arrows and Home/End. Its props and rendered element currently provide no way to associate an accessible name. |

All nine controls work independently of a video engine. The package declares React and React DOM as peers. The controls use CSS variables with dark defaults and inject CSS into `document.head` from `useEffect`. With server rendering, these styles arrive after the client starts. [Control implementations and styles](./src/index.tsx) · [Package manifest](./package.json)

## Where the player boundary lies

- **Imports.** The root module exports both the controls and `YumYumPlayerView`. The view imports `Badge`, `Button`, `Slider` and `Spinner` back from the root, forming a module cycle. The amount of player code in a consumer's bundle depends on its bundler and tree shaking.
- **Engine contract.** The host supplies a stable `createPlayer(canvas)` factory. The view owns the canvas, polls `getTelemetry()` every 250 ms, recognizes the state `PLAYING` and uses a rendered-frame counter and playback events. Another engine needs an adapter. Source selection, transports and camera selection already belong to the host.
- **Video-specific behavior.** The quality menu receives a list of available levels but offers fixed `auto`, `main` and `sub` choices. A source that advertises `360p` and `720p` cannot expose those choices through this menu. The timeline, canvas-to-video PiP mirror, hotkeys and stored volume preferences belong with the video view. With `chrome="none"`, the controls are hidden but the lifecycle and poll continue. In jsdom with a stub capture API, the first rendered frame triggered `canvas.captureStream(30)` even with hidden chrome and PiP controls disabled. The cost on a real video wall still needs a browser measurement.
- **Confirmed recovery bug.** In a React DOM/jsdom check, the first factory rejected and a replacement factory returned a healthy handle in the same mounted view. The new source reached `onReady`, yet `Playback error` stayed visible. The same `hasError` flag also blocks play/pause. [Player contract, lifecycle and quality menu](./src/YumYumPlayerView.tsx)

## Priorities and acceptance criteria

| Order | Change | Acceptance |
| --- | --- | --- |
| **1 · P0** | Fix source recovery and accessible slider naming in two independent changes. Reset the error state when the source changes. Forward `aria-label` and `aria-labelledby` to the slider and handle drag cancellation. | A “source A fails, source B succeeds” test verifies that the error clears and Play works without remounting. Two sliders can be found by distinct names, arrow keys respect the step, and pointer movement after `pointercancel` leaves the value alone. All nine existing tests still pass. |
| **2 · P1** | Separate the import graphs. Move controls out of the root module and import them directly from the player view. Add `@yumyums/ui/primitives` and `@yumyums/ui/player` entry points. Preserve existing root exports. | Install the `npm pack` tarball in two clean React consumers. One renders a form without the Player SDK, the other a video view with a test handle. The form's bundle report excludes the video module. Existing root imports and types still compile. |
| **3 · P1** | Strengthen the controls for forms. Cover keyboard input, focus, disabled/loading states, label/error associations and theming directly. Make spinner size and accessible text configurable. Check light token values and loading CSS before hydration in a browser. | A form with a button, invalid field, switch and slider works by keyboard in light and dark themes. Russian loading text reaches the rendered element. Existing dark defaults and the current styling setup still work. |
| **4 · P1, after the import split** | Use the adapter's quality IDs and labels, and support a source without quality selection. Localize errors and control names. Prepare the PiP stream only when available and enabled. Check how slider arrow keys interact with player hotkeys. | An adapter advertising `360p` and `720p` receives the selected ID. An adapter without levels has no selector. Exercise live, VOD, source changes, `onReady(null)` and all three chrome modes. Hidden chrome or disabled PiP performs no capture; enabled PiP still opens on the first click in a supported browser. A single slider keypress triggers one action. |
| **5 · P2** | Pilot `Field` as the first new component to associate a label, hint and error. Try it in the website form and a settings form. Select further additions from recurring consumer needs. | Two distinct forms use the same API. Clicking the label focuses the field, and `aria-describedby` associates the error with it. Each application owns its text, validation and business rules. |

**Before the next release**, check React 18 and 19 against the installed tarball, update stale links after the GitHub rename, and verify the advertised module formats. The `require` condition currently points to the same ESM file as `import`. Test on the supported Node versions or clarify CommonJS support. Releasing the UI and upgrading its consumers are separate actions. [Package manifest](./package.json) · [CI](./.github/workflows/ci.yml) · [Publish workflow](./.github/workflows/publish.yml)

**Verification baseline.** Type checking, all tests and the build passed. Five tests cover seeking, three cover chrome modes and one covers `onReady`. The controls have no dedicated tests. A server-rendered markup check also confirmed that the slider drops its supplied accessible name and the spinner uses a fixed name. Browser checks for focus, themes and PiP belong to the plan. [Existing tests](./src/YumYumPlayerView.test.tsx)
