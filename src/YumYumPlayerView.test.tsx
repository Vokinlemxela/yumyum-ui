import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { YumYumPlayerView, type PlayerHandle } from './YumYumPlayerView.js';

// ====================================================================
// End-to-end scrub → player.seek() regression test for the theater
// player chrome. The scrubber (`Timeline`) is driven entirely by POINTER
// events: `onSeek` (→ player.seek) fires only on `pointerup`, and a
// `scrubbing` ref gates the time display between pointerdown/pointerup.
//
// A previous "seek freeze" was a *test* artifact: driving the track with
// mouse events (mousedown/mouseup) — which the component does not listen
// for — silently never seeks and would have left `scrubbing` stuck. These
// tests exercise the real path with correct pointer events (pointerdown →
// pointermove → pointerup carrying a pointerId) and assert seek actually
// fires, scrubbing clears, and the time display resumes from telemetry.
//
// The player is mocked at the structural `PlayerHandle` seam, so nothing
// here touches WebCodecs/AudioContext/canvas decoding — fully deterministic.
// ====================================================================

interface Telemetry {
  currentPTS: number;
  duration: number;
  bufferedEnd: number;
  playbackState: string;
  playbackRate: number;
  renderedFrames: number;
  activeCodec: string;
  queueLength: number;
}

/** A controllable mock player. Mutate `telemetry` to simulate playback. */
function makeMockPlayer(overrides: Partial<Telemetry> = {}) {
  const telemetry: Telemetry = {
    currentPTS: 50, // start mid-stream so we can scrub both forward and back
    duration: 100,
    bufferedEnd: 80,
    playbackState: 'PLAYING',
    playbackRate: 1,
    renderedFrames: 0,
    activeCodec: 'h264',
    queueLength: 5,
    ...overrides,
  };

  const player: PlayerHandle = {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    mute: vi.fn(),
    setPlaybackRate: vi.fn(),
    getPlaybackRate: vi.fn(() => telemetry.playbackRate),
    getCurrentTime: vi.fn(() => telemetry.currentPTS),
    getDuration: vi.fn(() => telemetry.duration),
    // Always report a fresh, ever-advancing renderedFrames so the view's
    // stall detector never trips the buffering spinner during the test.
    getTelemetry: vi.fn(() => ({ ...telemetry, renderedFrames: telemetry.renderedFrames++ })),
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn(),
  };

  return { player, telemetry };
}

/**
 * Render the view, wait for the player to load + the poll loop to publish
 * duration, then hand back the timeline track with a deterministic geometry.
 * jsdom does no layout, so `getBoundingClientRect` is stubbed to a 200px-wide
 * track at x=0 → clientX maps linearly to time (clientX === percent × 2).
 */
async function renderPlayer(overrides: Partial<Telemetry> = {}) {
  const { player, telemetry } = makeMockPlayer(overrides);
  const createPlayer = vi.fn().mockResolvedValue({ player, isLive: false });
  const { container } = render(<YumYumPlayerView createPlayer={createPlayer} />);

  // The poll interval (250ms) publishes telemetry.duration into state; the
  // time display reads "<current> / <duration>" once it lands.
  await waitFor(() => {
    expect(screen.getByText(`${fmt(telemetry.currentPTS)} / 1:40`)).toBeTruthy();
  });

  const track = container.querySelector('.yyv-tlwrap') as HTMLElement;
  expect(track).toBeTruthy();
  track.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 200, bottom: 20, width: 200, height: 20, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

  return { player, telemetry, track };
}

/** Mirror of the component's mm:ss formatter, for building expected strings. */
function fmt(seconds: number): string {
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  const m = Math.floor((seconds / 60) % 60);
  return `${m}:${s}`;
}

/** clientX on the 200px track → seconds (track maps 0..200px to 0..duration). */
const SEEK_TO = (seconds: number, duration = 100) => (seconds / duration) * 200;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('YumYumPlayerView scrubber → player.seek()', () => {
  it('seeks forward to the dragged position on pointerup and resumes time updates', async () => {
    const { player, telemetry, track } = await renderPlayer();

    // pointerdown engages scrubbing; the time display switches to the
    // scrub position immediately (no seek yet — seek waits for pointerup).
    fireEvent.pointerDown(track, { clientX: SEEK_TO(50), pointerId: 1 });
    expect(player.seek).not.toHaveBeenCalled();
    expect(screen.getByText('0:50 / 1:40')).toBeTruthy();

    // Drag forward to 90s; display follows the scrub head, still no seek.
    fireEvent.pointerMove(track, { clientX: SEEK_TO(90), pointerId: 1 });
    expect(screen.getByText('1:30 / 1:40')).toBeTruthy();
    expect(player.seek).not.toHaveBeenCalled();

    // pointerup commits the seek and ends the scrub.
    fireEvent.pointerUp(track, { clientX: SEEK_TO(90), pointerId: 1 });
    expect(player.seek).toHaveBeenCalledTimes(1);
    expect(player.seek).toHaveBeenCalledWith(90);
    expect(player.pause).not.toHaveBeenCalled(); // scrubbing must not pause playback

    // scrubbing is cleared → the poll loop is no longer gated, so a new
    // telemetry position flows back into the time display. If `scrubbing`
    // were stuck, this would stay frozen at the scrub head (the old bug).
    telemetry.currentPTS = 92;
    await waitFor(() => {
      expect(screen.getByText('1:32 / 1:40')).toBeTruthy();
    });
  });

  it('seeks backward on pointerup', async () => {
    const { player, track } = await renderPlayer();

    fireEvent.pointerDown(track, { clientX: SEEK_TO(50), pointerId: 1 });
    fireEvent.pointerMove(track, { clientX: SEEK_TO(10), pointerId: 1 });
    expect(screen.getByText('0:10 / 1:40')).toBeTruthy();
    fireEvent.pointerUp(track, { clientX: SEEK_TO(10), pointerId: 1 });

    expect(player.seek).toHaveBeenCalledTimes(1);
    expect(player.seek).toHaveBeenCalledWith(10);
  });

  it('seeks on a simple click (pointerdown then pointerup at the same spot)', async () => {
    const { player, track } = await renderPlayer();

    fireEvent.pointerDown(track, { clientX: SEEK_TO(25), pointerId: 1 });
    fireEvent.pointerUp(track, { clientX: SEEK_TO(25), pointerId: 1 });

    expect(player.seek).toHaveBeenCalledTimes(1);
    expect(player.seek).toHaveBeenCalledWith(25);
  });

  it('clamps a drag past the track edges to [0, duration]', async () => {
    const { player, track } = await renderPlayer();

    fireEvent.pointerDown(track, { clientX: SEEK_TO(50), pointerId: 1 });
    fireEvent.pointerUp(track, { clientX: 9999, pointerId: 1 }); // far past the right edge

    expect(player.seek).toHaveBeenCalledWith(100); // clamped to duration, not NaN/overflow
  });

  // Regression guard for the false "seek freeze": the scrubber listens only
  // for POINTER events. Mouse events must be a silent no-op — never seek and,
  // crucially, never leave `scrubbing` engaged (the time display keeps
  // tracking telemetry).
  it('ignores mouse-only events (no pointerId) — never seeks, never freezes', async () => {
    const { player, telemetry, track } = await renderPlayer();

    fireEvent.mouseDown(track, { clientX: SEEK_TO(90) });
    fireEvent.mouseUp(track, { clientX: SEEK_TO(90) });

    expect(player.seek).not.toHaveBeenCalled();

    // Time display is not frozen — telemetry still drives it.
    telemetry.currentPTS = 60;
    await waitFor(() => {
      expect(screen.getByText('1:00 / 1:40')).toBeTruthy();
    });
  });

  describe('chrome presets', () => {
    it('renders full chrome controls by default', async () => {
      const { player } = makeMockPlayer();
      const createPlayer = vi.fn().mockResolvedValue({ player, isLive: false });
      const { container } = render(<YumYumPlayerView createPlayer={createPlayer} />);
      
      await waitFor(() => {
        expect(container.querySelector('.yyv-bar')).toBeTruthy();
        expect(container.querySelector('.yyv-bar-minimal')).toBeFalsy();
      });
    });

    it('renders minimal chrome with only volume and fullscreen buttons', async () => {
      const { player } = makeMockPlayer();
      const createPlayer = vi.fn().mockResolvedValue({ player, isLive: false });
      const { container } = render(<YumYumPlayerView createPlayer={createPlayer} chrome="minimal" />);
      
      await waitFor(() => {
        expect(container.querySelector('.yyv-bar-minimal')).toBeTruthy();
        expect(container.querySelector('.yyv-tlwrap')).toBeFalsy();
        expect(container.querySelector('button[aria-label="Play"]')).toBeFalsy();
        expect(container.querySelector('button[aria-label="Settings"]')).toBeFalsy();
        expect(container.querySelector('.yyv-vol')).toBeTruthy();
        expect(container.querySelector('.yyv-btn-fullscreen')).toBeTruthy();
      });
    });

    it('renders no chrome when chrome="none"', async () => {
      const { player } = makeMockPlayer();
      const createPlayer = vi.fn().mockResolvedValue({ player, isLive: false });
      const { container } = render(<YumYumPlayerView createPlayer={createPlayer} chrome="none" />);
      
      await waitFor(() => {
        expect(container.querySelector('.yyv-bar')).toBeFalsy();
        expect(container.querySelector('.yyv-bar-minimal')).toBeFalsy();
      });
    });
  });

  describe('onReady handle', () => {
    it('recovers from a failed source and plays its replacement without remounting', async () => {
      const sourceA = vi.fn().mockRejectedValue(new Error('Source A failed'));
      const { player } = makeMockPlayer({ playbackState: 'PAUSED' });
      const sourceB = vi.fn().mockResolvedValue({ player, isLive: false });
      const onReady = vi.fn();
      const { container, rerender } = render(
        <YumYumPlayerView createPlayer={sourceA} onReady={onReady} />,
      );
      await screen.findByText('Playback error');
      const canvas = container.querySelector('canvas');

      rerender(<YumYumPlayerView createPlayer={sourceB} onReady={onReady} />);
      await waitFor(() => expect(onReady).toHaveBeenLastCalledWith(player));
      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
      expect(sourceB).toHaveBeenCalledWith(canvas);
      expect(screen.queryByText('Playback error')).toBeNull();
      expect(player.play).not.toHaveBeenCalled();

      const play = screen.getAllByRole('button', { name: 'Play' })[0];
      fireEvent.click(play);
      expect(player.play).toHaveBeenCalledTimes(1);
    });

    it('passes the player handle to onReady so the host can drive playback', async () => {
      const { player } = makeMockPlayer();
      const createPlayer = vi.fn().mockResolvedValue({ player, isLive: true });
      const onReady = vi.fn();
      const { unmount } = render(
        <YumYumPlayerView createPlayer={createPlayer} chrome="none" onReady={onReady} />,
      );

      await waitFor(() => expect(onReady).toHaveBeenCalledWith(player));

      // Host can drive the player imperatively via the handle.
      const handed = onReady.mock.calls[0][0];
      handed.mute(true);
      expect(player.mute).toHaveBeenCalledWith(true);

      // On teardown the handle is revoked (null).
      unmount();
      expect(onReady).toHaveBeenLastCalledWith(null);
    });
  });
});

describe('adapter controls', () => {
  it('keeps Auto selected during ABR and lets the user switch back to it', async () => {
    const { player } = makeMockPlayer({ playbackState: 'PAUSED' });
    let selection = 'auto';
    let onQualityChange: ((id: string) => void) | undefined;
    vi.mocked(player.on).mockImplementation((event, callback) => {
      if (event === 'qualitychange') onQualityChange = callback;
    });
    player.getQualityLevels = () => [
      { id: '360p', label: '360p', url: '/360p', kind: 'sub' },
      { id: '720p', label: 'HD 720p', url: '/720p', kind: 'main' },
    ];
    player.getActiveQuality = () => selection;
    player.setQuality = vi.fn(async (id: string) => {
      selection = id;
      onQualityChange?.(id);
    });
    const ready = vi.fn();
    render(<YumYumPlayerView createPlayer={async () => ({ player, isLive: false })} onReady={ready} />);
    await waitFor(() => expect(ready).toHaveBeenCalledWith(player));
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    const quality = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Quality' });
    expect(screen.getByRole('option', { name: 'HD 720p' })).toBeTruthy();
    expect(quality.value).toBe('auto');
    expect(onQualityChange).toBeDefined();
    act(() => onQualityChange?.('720p'));
    expect(quality.value).toBe('auto');

    fireEvent.change(quality, { target: { value: '360p' } });
    await waitFor(() => {
      expect(quality.value).toBe('360p');
      expect(quality.disabled).toBe(false);
    });
    expect(screen.getByRole('option', { name: 'Auto' })).toBeTruthy();
    fireEvent.change(quality, { target: { value: 'auto' } });
    await waitFor(() => expect(quality.value).toBe('auto'));
    expect(vi.mocked(player.setQuality).mock.calls).toEqual([['360p'], ['auto']]);
  });

  it('can select the first quality level when the adapter has no active-quality getter', async () => {
    const { player } = makeMockPlayer({ playbackState: 'PAUSED' });
    player.getQualityLevels = () => [
      { id: '360p', label: '360p', url: '/360p', kind: 'sub' },
      { id: '720p', label: 'HD 720p', url: '/720p', kind: 'main' },
    ];
    player.setQuality = vi.fn().mockResolvedValue(undefined);
    const onReady = vi.fn();
    render(<YumYumPlayerView createPlayer={async () => ({ player, isLive: false })} onReady={onReady} />);
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(player));
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    const quality = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Quality' });
    expect(quality.value).toBe('');
    fireEvent.change(quality, { target: { value: '360p' } });
    await waitFor(() => expect(quality.value).toBe('360p'));
    expect(player.setQuality).toHaveBeenCalledWith('360p');
  });

  it('hides quality when the current adapter cannot change it and localizes controls', async () => {
    const { player } = makeMockPlayer({ playbackState: 'PAUSED' });
    player.getQualityLevels = () => [{ id: '720p', label: '720p', url: '/720p', kind: 'main' }];
    const createPlayer = vi.fn().mockResolvedValue({ player, isLive: false });
    const failed = vi.fn().mockRejectedValue(new Error('Source unavailable'));
    const onReady = vi.fn();
    const { rerender } = render(<YumYumPlayerView createPlayer={createPlayer} lang="ru" onReady={onReady} />);
    await waitFor(() => expect(onReady).toHaveBeenLastCalledWith(player));
    expect(screen.getByRole('slider', { name: 'Громкость' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Настройки' }));
    expect(screen.queryByRole('combobox', { name: 'Качество' })).toBeNull();

    rerender(<YumYumPlayerView createPlayer={failed} lang="ru" onReady={onReady} />);
    expect(await screen.findByText('Ошибка воспроизведения')).toBeTruthy();
    expect(onReady.mock.calls).toEqual([[player], [null]]);
    expect(player.destroy).toHaveBeenCalledTimes(1);
  });

  it('handles one volume step and no seek when an arrow is pressed on the focused volume slider', async () => {
    const { player } = makeMockPlayer({ playbackState: 'PAUSED' });
    const onReady = vi.fn();
    const { container } = render(
      <YumYumPlayerView createPlayer={async () => ({ player, isLive: false })} onReady={onReady} />,
    );
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(player));
    const slider = screen.getByRole('slider', { name: 'Volume' });
    fireEvent.mouseMove(container.querySelector('.yyv-root')!);
    slider.focus();
    vi.mocked(player.setVolume).mockClear();
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(vi.mocked(player.setVolume).mock.calls).toEqual([[0.01]]);
    expect(player.seek).not.toHaveBeenCalled();
  });
});

describe('Picture-in-Picture', () => {
  function enablePipMock() {
    const capture = vi.fn(() => ({ getTracks: () => [{ stop }] }));
    const stop = vi.fn();
    const request = vi.fn().mockResolvedValue(undefined);
    const oldCapture = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'captureStream');
    const oldEnabled = Object.getOwnPropertyDescriptor(document, 'pictureInPictureEnabled');
    const oldRequest = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'requestPictureInPicture');
    Object.defineProperty(HTMLCanvasElement.prototype, 'captureStream', { configurable: true, value: capture });
    Object.defineProperty(document, 'pictureInPictureEnabled', { configurable: true, value: true });
    Object.defineProperty(HTMLVideoElement.prototype, 'requestPictureInPicture', { configurable: true, value: request });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const restore = () => {
      for (const [target, key, original] of [
        [HTMLCanvasElement.prototype, 'captureStream', oldCapture],
        [document, 'pictureInPictureEnabled', oldEnabled],
        [HTMLVideoElement.prototype, 'requestPictureInPicture', oldRequest],
      ] as const) {
        if (original) Object.defineProperty(target, key, original);
        else Reflect.deleteProperty(target, key);
      }
    };
    return { capture, stop, request, restore };
  }

  it('revokes and replaces handles for hidden camera tiles without capturing the canvas', async () => {
    const pip = enablePipMock();
    const { player: oldPlayer } = makeMockPlayer({ renderedFrames: 30 });
    const { player: nextPlayer } = makeMockPlayer({ renderedFrames: 30 });
    const oldFactory = vi.fn().mockResolvedValue({ player: oldPlayer, isLive: true });
    const nextFactory = vi.fn().mockResolvedValue({ player: nextPlayer, isLive: true });
    const onReady = vi.fn();
    const view = render(<YumYumPlayerView key="attempt-1" chrome="none" createPlayer={oldFactory} onReady={onReady} />);
    try {
      await waitFor(() => expect(oldPlayer.getTelemetry).toHaveBeenCalled());
      view.rerender(<YumYumPlayerView key="attempt-2" chrome="none" createPlayer={nextFactory} onReady={onReady} />);
      await waitFor(() => expect(nextPlayer.getTelemetry).toHaveBeenCalled());

      expect(onReady.mock.calls).toEqual([[oldPlayer], [null], [nextPlayer]]);
      expect(oldPlayer.destroy).toHaveBeenCalledTimes(1);
      expect(nextFactory.mock.calls[0][0]).not.toBe(oldFactory.mock.calls[0][0]);
      expect(screen.queryByRole('button', { name: 'Picture in picture' })).toBeNull();
      expect(pip.capture).not.toHaveBeenCalled();

      const replacement: PlayerHandle = onReady.mock.lastCall![0];
      vi.mocked(nextPlayer.play).mockClear();
      await replacement.play();
      replacement.mute(false);
      replacement.setVolume(0.4);
      expect(nextPlayer.play).toHaveBeenCalledTimes(1);
      expect(nextPlayer.mute).toHaveBeenLastCalledWith(false);
      expect(nextPlayer.setVolume).toHaveBeenLastCalledWith(0.4);
    } finally {
      view.unmount();
      pip.restore();
    }
  });

  it('captures only with enabled full chrome and opens PiP on its first click', async () => {
    const pip = enablePipMock();
    const { player } = makeMockPlayer({ renderedFrames: 30 });
    const createPlayer = vi.fn().mockResolvedValue({ player, isLive: false });
    const view = render(<YumYumPlayerView createPlayer={createPlayer} controls={{ pip: false }} />);
    try {
      await waitFor(() => expect(player.getTelemetry).toHaveBeenCalled());
      expect(pip.capture).not.toHaveBeenCalled();
      view.rerender(<YumYumPlayerView createPlayer={createPlayer} chrome="minimal" />);
      const polls = vi.mocked(player.getTelemetry).mock.calls.length;
      await waitFor(() => expect(vi.mocked(player.getTelemetry).mock.calls.length).toBeGreaterThan(polls));
      expect(pip.capture).not.toHaveBeenCalled();

      view.rerender(<YumYumPlayerView createPlayer={createPlayer} />);
      const button = screen.getByRole('button', { name: 'Picture in picture' });
      await waitFor(() => expect(pip.capture).toHaveBeenCalledWith(30));
      const video = view.container.querySelector('video')!;
      Object.defineProperty(video, 'readyState', { value: 1 });
      fireEvent.click(button);
      expect(pip.request).toHaveBeenCalledTimes(1);

      view.rerender(<YumYumPlayerView createPlayer={createPlayer} controls={{ pip: false }} />);
      expect(pip.stop).toHaveBeenCalledTimes(1);
      expect(video.srcObject).toBeNull();
      expect(createPlayer).toHaveBeenCalledTimes(1);
    } finally {
      view.unmount();
      pip.restore();
    }
  });
});
