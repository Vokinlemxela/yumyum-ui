[English](./README.md) · **Русский**

# @yumyum-player/ui

Быстрые, темизируемые **React-примитивы** и **обвязка плеера** в стиле YouTube
для [Yum-yum Player](https://github.com/Vokinlemxela/yumyum-player). Сделано для
плотных операторских интерфейсов (VMS, дашборды, видеостены): дизайн-система
monospace-first, тёмная по умолчанию, **только нативные шрифты** (работает
офлайн / в изолированной LAN), мгновенный рендер, без шага сборки CSS.

```bash
npm install @yumyum-player/ui
```

- **Примитивы** — `Badge`, `Button`, `Slider`, `Spinner`, `Input`, `Checkbox`,
  `Toggle`, `Select`, `TextArea`, `Field`, `Dialog`. Темизируются через CSS-переменные; стили
  **вставляются сами** (не нужно импортировать CSS или настраивать сборщик).
- **`<YumYumPlayerView>`** — полный хром плеера (таймлайн-скраббер, громкость,
  скорость, автоплей/повтор, Picture-in-Picture, fullscreen, хоткеи),
  развязанный с движком через фабрику `createPlayer`.

`react` и `react-dom` (18 **или** 19) — peer-зависимости. Плееру-view
дополнительно нужен `@yumyum-player/core` (или любой объект, реализующий
`PlayerHandle`).

---

## Переезд на `@yumyum-player/ui` 2.0

Пакет переехал с `@yumyums/ui` на `@yumyum-player/ui`. Замените зависимость
и обновите пути импорта. Корневая точка входа сохраняет существующие компоненты
и типы. Исходники `@yumyums/ui@1.0.0` доступны по [тегу v1.0.0]. Под новым
именем ранее выходил [`@yumyum-player/ui@1.0.5`].

- Меню качества передаёт в `setQuality(id)` идентификаторы из
  `getQualityLevels()`. Если адаптер принимал только `main` и `sub`, добавьте
  поддержку ID уровней. Чтобы предложить автоматический режим, укажите
  `auto` в списке уровней или сообщите его через API активного качества.
- При `lang="ru"` у элементов управления русские доступные имена. Обновите
  тесты и автоматизацию, которые ищут контролы по прежним английским именам.

[тегу v1.0.0]: https://github.com/Vokinlemxela/yumyum-ui/tree/v1.0.0
[`@yumyum-player/ui@1.0.5`]: https://www.npmjs.com/package/@yumyum-player/ui/v/1.0.5

---

## Язык дизайна

`@yumyum-player/ui` реализует дизайн-систему **yumyums** — industrial/utilitarian,
функция первична:

- **Monospace как голос UI**, не только для кода — читается как «прибор».
  Все числа — с `tabular-nums`, чтобы значения не «прыгали» при изменении.
- **Только тёмная тема.** Нейтрали на читаемой *лестнице высот* (`bg → surface-2
  → surface-3`), инпуты утоплены (`input-bg`), единственный emerald-**акцент**
  означает «живое / активно / здорово».
- **Мгновенный рендер.** Только нативные шрифтовые стеки, без веб-шрифтов, тонкая
  рамка вместо тяжёлых теней, `backdrop-filter` — только у плавающих слоёв.
- **A11y-минимум.** Видимое кольцо `:focus-visible`, `role`/`aria` на кастомных
  контролах (`Toggle`, `Slider`), `prefers-reduced-motion` гасит анимацию.

---

## Быстрый старт

### Примитивы

```tsx
import { Button, Badge, Input, Toggle, Select, Slider } from '@yumyum-player/ui/primitives';

function Panel() {
  const [notify, setNotify] = useState(true);
  const [volume, setVolume] = useState(60);

  return (
    <div>
      <Badge label="LIVE" variant="rec" />

      <Input placeholder="Имя камеры" />
      <Select defaultValue="h264">
        <option value="h264">H.264</option>
        <option value="h265">H.265</option>
      </Select>

      <Toggle checked={notify} onChange={setNotify} aria-label="Уведомления" />
      <Slider aria-label="Громкость" value={volume} onChange={setVolume} />

      <Button variant="primary" onClick={save}>Сохранить</Button>
      <Button variant="ghost">Отмена</Button>
    </div>
  );
}
```

Импортировать стили не нужно — каждый компонент один раз вставляет общий
`<style>` при первом монтировании.

### Плеер-view

```tsx
import { YumYumPlayerView } from '@yumyum-player/ui/player';
import { YumYumPlayer } from '@yumyum-player/core';
import { useCallback } from 'react';

export function Player({ url }: { url: string }) {
  // ⚠️ createPlayer ДОЛЖЕН быть стабильным по ссылке — см. заметку ниже.
  const createPlayer = useCallback(async (canvas: HTMLCanvasElement) => {
    const player = new YumYumPlayer({ canvas });
    await player.load(url);
    return { player, isLive: url.startsWith('ws') };
  }, [url]);

  return <YumYumPlayerView createPlayer={createPlayer} accentColor="#10b981" />;
}
```

---

## Стили и темизация

В браузере компоненты подключают общую таблицу стилей. Чтобы стили
применялись до гидратации, добавьте ту же таблицу в `<head>` серверной
страницы. В браузере компоненты найдут её по ID.

```tsx
import { primitivesCss, primitivesStyleId } from '@yumyum-player/ui/primitives/styles';

// Inside the document head
<style id={primitivesStyleId}>{primitivesCss}</style>
```

Темизация — целиком через **CSS-переменные** с префиксом `--yyp-*`. У каждого
токена есть разумный тёмный дефолт (палитра yumyums), поэтому библиотека
выглядит корректно без настройки. Переопределите любой токен на `:root` (или на
любом родителе), чтобы натянуть библиотеку на вашу тему.

```css
/* Маппинг токенов вашего приложения на библиотеку. */
:root {
  --yyp-accent:        #10b981;
  --yyp-accent-rgb:    16, 185, 129;   /* каналы, для rgba()-композитинга */
  --yyp-surface-2:     #1e2228;
  --yyp-border-strong: #3a424c;
  --yyp-control-h:     32px;
}
```

> **`*-rgb`-токены обязательны для прозрачности.** Часть стилей композитит с
> альфой (напр. `rgba(var(--yyp-accent-rgb), .1)`), а для этого нужны сырые
> каналы через запятую, а не hex. Переопределяя `--yyp-accent`, переопределите и
> `--yyp-accent-rgb` (и так же для `warning` / `danger` / `blue` / `text`).

### Контракт токенов

| Токен | Дефолт | Роль |
|---|---|---|
| `--yyp-bg` | `#0b0d0f` | фон приложения (на нём текст `primary`/`danger`-кнопок) |
| `--yyp-surface-2` | `#1e2228` | приподнятая поверхность — default-кнопка, neutral-бейдж |
| `--yyp-surface-3` | `#262b31` | ховер на приподнятом |
| `--yyp-input-bg` | `#0e1013` | утопленные контролы — input, select, желоб слайдера, toggle |
| `--yyp-border` | `#2c323a` | рамка 1px по умолчанию |
| `--yyp-border-strong` | `#3a424c` | рамка инпутов / структурная |
| `--yyp-text` · `--yyp-text-rgb` | `#f0f2f4` · `240,242,244` | основной текст |
| `--yyp-text-2` | `#a9b2bb` | вторичный текст, ручка toggle (off) |
| `--yyp-text-3` | `#6a727b` | плейсхолдеры / выключено |
| `--yyp-accent` · `--yyp-accent-rgb` | `#10b981` · `16,185,129` | живое/активно/primary/фокус-кольцо |
| `--yyp-accent-hover` | `#34d399` | ховер primary |
| `--yyp-warning` · `--yyp-warning-rgb` | `#f5a524` · `245,165,36` | warning-бейдж |
| `--yyp-danger` · `--yyp-danger-rgb` | `#f4506a` · `244,80,106` | danger-кнопка/бейдж, ошибка инпута |
| `--yyp-blue` · `--yyp-blue-rgb` | `#3b82f6` · `59,130,246` | info-бейдж |
| `--yyp-radius-xs` / `--yyp-radius-sm` | `2px` / `5px` | углы бейджа / контролов |
| `--yyp-control-h-sm` / `--yyp-control-h` / `--yyp-control-h-lg` | `28px` / `32px` / `36px` | высоты контролов (sm / md / lg) |
| `--yyp-transition-fast` / `--yyp-transition-normal` | `.12s` / `.2s` | переходы ховера / состояний |

Хром `<YumYumPlayerView>` темизируется **отдельно** — пропом `accentColor` (он
вставляет свой `yyv-*`-стиль); токены `--yyp-*` стилизуют примитивы.

---

## Компоненты

Каждый примитив пробрасывает нативные пропы (`...rest`) в свой элемент, так что
`id`, `name`, `disabled`, `onClick`, `data-*`, `aria-*`, `style` и т.д. работают.
Доп. классы — через `className`.

### `Badge`

Маленький mono-чип статуса.

| Проп | Тип | Дефолт | |
|---|---|---|---|
| `label` | `string` | — | обязательный |
| `variant` | `'primary' \| 'warning' \| 'danger' \| 'info' \| 'neutral' \| 'rec'` | `'neutral'` | `rec` пульсирует |

```tsx
<Badge label="ONLINE" variant="primary" />
<Badge label="REC" variant="rec" />
```

### `Button`

Расширяет `React.ButtonHTMLAttributes<HTMLButtonElement>`.

| Проп | Тип | Дефолт | |
|---|---|---|---|
| `variant` | `'default' \| 'ghost' \| 'primary' \| 'danger'` | `'default'` | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 28 / 32 / 36px |
| `active` | `boolean` | `false` | accent-состояние «нажато» (ставит `aria-pressed`) |
| `loading` | `boolean` | `false` | спиннер, блокировка, `aria-busy` |

```tsx
<Button variant="primary" onClick={save}>Сохранить</Button>
<Button variant="danger" loading={deleting}>Удалить</Button>
<Button variant="ghost" size="sm" className="icon" aria-label="Закрыть">✕</Button>
```

`className="icon"` — квадратная иконочная кнопка. `primary`/`danger` можно задать
и через `className` (обратная совместимость).

### `Input` / `TextArea`

`Input` расширяет `React.InputHTMLAttributes<HTMLInputElement>`, `TextArea` —
`React.TextareaHTMLAttributes<HTMLTextAreaElement>`.

| Проп | Тип | |
|---|---|---|
| `error` | `boolean` | (Input) красная рамка + `aria-invalid` |

```tsx
<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" />
<Input type="number" error={invalid} />
<TextArea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
```

> `Input` с `type="checkbox"` / `"radio"` автоматически рендерится как чекбокс
> (а не текстовое поле) — сбрасывать стиль вручную не нужно.

### `Checkbox`

Расширяет `React.InputHTMLAttributes<HTMLInputElement>` (без `type`).

```tsx
<Checkbox checked={on} onChange={(e) => setOn(e.target.checked)} />
```

### `Toggle`

Управляемый переключатель (`role="switch"`).

| Проп | Тип | Дефолт | |
|---|---|---|---|
| `checked` | `boolean` | — | обязательный |
| `onChange` | `(checked: boolean) => void` | — | обязательный |
| `disabled` | `boolean` | `false` | |
| `aria-label` | `string` | — | рекомендуется |

```tsx
<Toggle checked={recording} onChange={setRecording} aria-label="Запись 24/7" />
```

### `Select`

Расширяет `React.SelectHTMLAttributes<HTMLSelectElement>`. Нативный `<select>` с
кастомной стрелкой.

```tsx
<Select value={codec} onChange={(e) => setCodec(e.target.value)}>
  <option value="h264">H.264</option>
  <option value="h265">H.265</option>
</Select>
```

### `Slider`

Слайдер с указателем и клавиатурой (`role="slider"`). Управляемый.

| Проп | Тип | Дефолт | |
|---|---|---|---|
| `value` | `number` | — | обязательный |
| `onChange` | `(value: number) => void` | — | обязательный |
| `min` / `max` / `step` | `number` | `0` / `100` / `1` | |
| `disabled` | `boolean` | `false` | |

Клавиатура: стрелки (±step), Shift+стрелка (±10·step), Home/End.

```tsx
<Slider aria-label="Громкость" value={volume} onChange={setVolume} min={0} max={100} step={5} />
```

### `Spinner`

Индикатор загрузки с `role="status"` и цветом `--yyp-accent`. Размер по
умолчанию 40 пикселей, доступное имя по умолчанию — `Loading...`.

```tsx
{loading && <Spinner size={24} aria-label="Загрузка результатов" />}
```

### `Field`

Объединяет нативное поле с подписью, подсказкой и ошибкой. Передайте
полю свойства, полученные от `Field`. Когда приложение не задаёт ID,
компонент создаёт его сам. Тексты и проверку значений задаёт приложение.

```tsx
import { Field, Input } from '@yumyum-player/ui/primitives';

<Field label="Рабочая почта" description="На этот адрес придёт ответ" error={emailError}>
  {(props) => <Input {...props} type="email" value={email} onChange={onEmailChange} />}
</Field>
```

### `Dialog`

Управляемый модальный диалог с видимым заголовком, необязательным описанием
и встроенной кнопкой закрытия. Приложение управляет `open`.
Вызов `onClose(reason)` сообщает причину запроса на закрытие. Это может
быть Escape, щелчок по фону или кнопка закрытия. Во время сохранения
`dismissDisabled` блокирует эти запросы и отключает встроенную кнопку.
На время сохранения отключите свои кнопки отмены. После успешного
сохранения установите `open` в `false`.

```tsx
import { Dialog } from '@yumyum-player/ui/primitives';

<Dialog
  open={open}
  title="Добавить камеру"
  description="Укажите сетевой адрес камеры."
  closeLabel="Закрыть настройки камеры"
  initialFocusRef={addressRef}
  dismissDisabled={saving}
  onClose={() => setOpen(false)}
>
  <form onSubmit={saveCamera}>
    <label>Адрес <input ref={addressRef} disabled={saving} required /></label>
    <button disabled={saving}>Сохранить камеру</button>
  </form>
</Dialog>
```

С `closeOnBackdrop={false}` щелчок по фону оставляет диалог открытым.
`initialFocusRef` задаёт начальный фокус. При закрытии фокус возвращается
на ранее активный элемент или на указанный `returnFocusRef`. Нативный
диалог блокирует взаимодействие с фоном, включая открытые диалоги под ним.
Сервер отдаёт закрытую разметку. Диалог с исходным `open={true}` открывается
после гидратации.

---

## `<YumYumPlayerView>`

Готовый, лёгкий по зависимостям хром вокруг плеера. View **владеет `<canvas>`** и
всеми контролами; сам плеер создаёт *ваш* колбэк `createPlayer`, поэтому
UI-пакет не знает ничего про стриминг/RTSP/кодеки.

```tsx
<YumYumPlayerView
  createPlayer={createPlayer}
  accentColor="#10b981"
  controls={{ pip: true, settings: true }}
  badges={[{ label: 'CAM 1', variant: 'neutral' }]}
/>
```

### Пропы

| Проп | Тип | Дефолт | |
|---|---|---|---|
| `createPlayer` | `(canvas) => Promise<{ player: PlayerHandle; isLive: boolean }>` | — | **обязательный, стабильный по ссылке** |
| `accentColor` | `string` | `'#00FF66'` | прогресс-бар / ручка / активные контролы |
| `playbackRate` | `number` | — | управляемая скорость; применяется на лету |
| `controls` | `Partial<Record<PlayerControlKey, boolean>>` | все видны | вкл/выкл отдельные контролы |
| `chrome` | `'full' \| 'minimal' \| 'none'` | `'full'` | раскладка панели управления |
| `autoHideDelay` | `number` | `3000` | мс бездействия до скрытия контролов при проигрывании |
| `persistKeyPrefix` | `string` | `'yumyum'` | неймспейс localStorage (громкость/mute/rate/autoplay/loop) |
| `lang` | `'ru' \| 'en'` | `'en'` | язык подписей |
| `className` | `string` | — | на корневом элементе |
| `overlayTopLeft` / `overlayTopRight` | `ReactNode` | — | угловые слоты (поверх видео) |
| `badges` | `{ label: string; variant?: 'rec' \| 'primary' \| 'warning' \| 'neutral' }[]` | — | бейджи в левом верхнем углу |
| `onReady` | `(player: PlayerHandle \| null) => void` | — | живой handle, либо `null` при тердауне |

`PlayerControlKey` = `'play' | 'volume' | 'timeline' | 'time' | 'speed' | 'settings' | 'pip' | 'fullscreen'`.

### ⚠️ `createPlayer` должен быть стабильным по ссылке

Эффект жизненного цикла плеера зависит от `createPlayer`. Если передавать
**новую функцию на каждый рендер** (напр. inline-стрелку), view будет сносить
плеер и перезагружать поток на каждом ре-рендере родителя (мигание + ребуфер).
Оборачивайте в `useCallback`/`useMemo` с ключом по источнику потока:

```tsx
const createPlayer = useCallback(async (canvas) => { /* ... */ }, [url]);
```

### Встраивание в хост со своими контролами (напр. VMS)

`chrome="none"` — **без кнопок управления**: view всё равно показывает canvas,
встроенные оверлеи (спиннер загрузки, ошибка, «нет видео») и слоты
`overlayTopLeft` / `overlayTopRight` / `badges`. Живой плеер — через `onReady`,
управляйте сами:

```tsx
<YumYumPlayerView
  createPlayer={createPlayer}
  chrome="none"
  onReady={(player) => { hostRef.current = player; /* player?.mute(true) */ }}
  overlayTopRight={<MyControlBar />}
/>
```

`onReady(player)` вызывается при создании плеера, `onReady(null)` — при
тердауне/пересоздании. (`chrome="minimal"` — для обычных одиночных встроек; хосты
со своим UI используют `none`.)

### `PlayerHandle`

Структурный контракт, которым управляет view. Ядровый `YumYumPlayer` ему
соответствует, поэтому UI-пакету не нужна build-time зависимость от движка:

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
    activeCodec: string; queueLength: number; /* ...опциональные поля */ };
  getQualityLevels?(): { id: string; label: string; kind: string; /* ... */ }[];
  getActiveQuality?(): string;
  setQuality?(id: string): Promise<void>;
  on(event: string, cb: (...args: unknown[]) => void): void;
  off(event: string, cb: (...args: unknown[]) => void): void;
  unlockAudio?(): Promise<void>;
  destroy(): void;
}
```

Меню качества использует ID и подписи из `getQualityLevels()`, когда handle также реализует `setQuality(id)`. Автоматический режим можно добавить в список с ID `auto` или сообщить через `getActiveQuality()` либо `qualitychange`. Если событие ABR сообщает фактический поток, выбранный режим берётся из `getActiveQuality()`. Захват canvas для PiP запускается при полной панели с включённой кнопкой и поддержкой браузера.

---

## Экспорты

Общие контролы доступны через `@yumyum-player/ui/primitives`, видеооболочка и её типы — через `@yumyum-player/ui/player`. Корневая точка входа по-прежнему экспортирует и то, и другое.

Пакет поставляется в формате ESM. В Node 18 используйте `import` или динамический `import()`. Из CommonJS можно вызывать `require()` в средах с включённой синхронной загрузкой ESM.

```ts
// Компоненты
Badge, Button, Slider, Spinner, Input, Checkbox, Toggle, Select, TextArea, Field, Dialog,
YumYumPlayerView

// Типы
BadgeProps, ButtonProps, SliderProps, SpinnerProps, InputProps, CheckboxProps, ToggleProps,
SelectProps, TextAreaProps, FieldProps, FieldControlProps, DialogProps, DialogCloseReason,
YumYumPlayerViewProps, PlayerHandle, PlayerControlKey
```

## Разработка и выпуск библиотеки

[Аудит компонентов и план развития](./ROADMAP.ru.md)

В этом репозитории находятся исходники `@yumyum-player/ui`. Общие компоненты используют React и React DOM. Чтобы подключить элементы управления к своему видеодвижку, передайте в `YumYumPlayerView` функцию `createPlayer` со стабильной ссылкой. Она возвращает объект, реализующий `PlayerHandle`.

Склонируйте репозиторий и запустите проверки из его корня. Для этих команд достаточно отдельной копии библиотеки.

```sh
git clone https://github.com/Vokinlemxela/yumyum-ui.git
cd yumyum-ui
npm ci
npm run typecheck
npm test
npm run build
```

Команда `npm run dev` пересобирает библиотеку при редактировании. Чтобы проверить изменения в тестовом приложении, после сборки выполните `npm pack` и установите полученный файл `.tgz` в приложение.

[CI](./.github/workflows/ci.yml) проверяет pull request и коммиты в `main`. Для выпуска новой версии UI обновите `package.json` и `package-lock.json`, закоммитьте изменения и опубликуйте GitHub Release с тегом `vX.Y.Z` на соответствующем коммите. [Workflow публикации](./.github/workflows/publish.yml) соберёт и опубликует эту версию `@yumyum-player/ui` в npm. Каждое приложение выбирает версию зависимости и фиксирует её в собственном lock-файле.

## Лицензия

MIT — см. [LICENSE](./LICENSE).
