# Техническое задание: Per-drawing API в `useDrawingTools` (react-klinecharts-ui)

**Библиотека:** `react-klinecharts-ui` (https://github.com/NemeZZiZZ/react-klinecharts-ui)
**Текущая версия:** 1.1.0
**Кому:** сторонний исполнитель (агент)
**Тип задачи:** feature → минорный релиз (1.2.0)

---

## 1. Постановка проблемы

Хук `useDrawingTools` — единственный крупный хук библиотеки, который **не даёт управления отдельными рисунками (overlays)**. Сегодня доступны только операции «над всеми сразу»:

- `toggleLock()` — заблокировать/разблокировать **все** рисунки
- `toggleVisibility()` — показать/скрыть **все** рисунки
- `removeAllDrawings()` — удалить **все** рисунки

При этом родственные хуки дают точечный контроль:
- `useOrderLines`: `createOrderLine` / `updateOrderLine(id)` / `removeOrderLine(id)`
- `useAnnotations`: `addAnnotation` / `updateAnnotation(id)` / `removeAnnotation(id)`
- `useIndicators`: операции per-name (`removeMainIndicator(name)`, `setIndicatorVisible(name, …)`)

`useDrawingTools` выпадает из этого паттерна. Из-за этого в consuming-приложении **невозможно** построить TradingView-style Object Tree (список рисунков с per-row видимостью/блокировкой/удалением) без грязных обходных путей: ручного опроса `chart.getOverlays()` или дублирования учёта рисунков в UI-слое.

**Цель:** добавить в `useDrawingTools` реактивный список рисунков и per-drawing операции (удалить, скрыть/показать, заблокировать), параллельные существующим batch-операциям.

---

## 2. Контекст, который нужно знать исполнителю

### 2.1 Все низкоуровневые методы уже есть в klinecharts v10

Ничего патчить в klinecharts **не нужно**. Публичный API `Chart` (peer dep `klinecharts@>=10.0.0-beta3`) уже содержит:

```ts
// node_modules/klinecharts/dist/index.d.ts
getOverlays: (filter?: OverlayFilter) => Overlay[];
overrideOverlay: (override: Partial<OverlayCreate>) => boolean;
removeOverlay: (filter?: OverlayFilter) => boolean;
createOverlay: (value: string | OverlayCreate | Array<string | OverlayCreate>) => Nullable<string> | Array<Nullable<string>>;
```

Тип `Overlay` (`klinecharts/dist/index.d.ts:737`) уже содержит нужные поля: `id: string`, `name: string`, `paneId: string`, `groupId: string`, `lock: boolean`, `visible: boolean`, `points`, `extendData`, `styles`, `mode`.

`OverlayFilter = Partial<Pick<Overlay, "id" | "groupId" | "name" | "paneId">>` — то есть фильтр по `groupId` поддерживается напрямую.

`Partial<OverlayCreate>` для `overrideOverlay` принимает `{ id, lock?, visible?, mode?, … }` — именно так библиотека **уже** меняет свойства у существующих рисунков (см. п. 2.3).

### 2.2 Рисунки уже сгруппированы

Хук `useDrawingTools` создаёт все рисунки с `groupId: "drawing_tools"` (константа `DRAWING_GROUP_ID` в `src/hooks/useDrawingTools.ts`). Это значит список «рисунков пользователя» = `chart.getOverlays({ groupId: "drawing_tools" })`. Сторонние overlays (orderLine, alertLine и т.п.) имеют свои groupId и в этот список не попадут.

### 2.3 Как библиотека сейчас меняет свойства (паттерн для копирования)

В существующем `useDrawingTools.ts` функции `toggleLock` / `toggleVisibility` / `setMagnetMode` уже итерируют по группе и вызывают `chart.overrideOverlay({ id, lock|visible|mode })`. Пример из текущего кода (`toggleLock`):

```ts
const overlays = state.chart?.getOverlays({ groupId: DRAWING_GROUP_ID });
overlays?.forEach((overlay) => {
  state.chart?.overrideOverlay({ id: overlay.id, lock: newLocked });
});
```

Новый per-drawing API должен использовать тот же вызов `overrideOverlay({ id, … })` — но для одного рисунка, а не в цикле.

### 2.4 Проблема реактивности

`useIndicators` реактивен, потому что список активных индикаторов хранится в **редьюсер-сторе провайдера** (`state.mainIndicators`, `state.subIndicators`). Рисунки же хранятся только во внутреннем сторе klinecharts (`chart.getOverlays()`) — в стейт React они не выкачены, поэтому `useDrawingTools` не возвращает массив рисунков.

**В klinecharts v10 нет overlay-событий** в `ActionType` (`"onZoom" | "onScroll" | "onVisibleRangeChange" | "onCandleTooltipFeatureClick" | "onIndicatorTooltipFeatureClick" | "onCrosshairFeatureClick" | "onCrosshairChange" | "onCandleBarClick" | "onPaneDrag"`). То есть подписаться на «рисунок добавлен/удалён» через `subscribeAction` **нельзя**. Это ключевое ограничение — см. п. 5 (решение через `onDrawEnd` + polling fallback).

---

## 3. Требуемый публичный API

Расширить `UseDrawingToolsReturn` (`src/hooks/useDrawingTools.ts`). **Все существующие поля сохранить без изменений** (обратная совместимость). Добавить:

```ts
export interface DrawingOverlayInfo {
  /** Stable id из klinecharts (chart.getOverlays()[].id). */
  id: string;
  /** Имя overlay'я, напр. "segment", "fibonacciLine", "arrow". */
  name: string;
  /** Pane id, где нарисован. */
  paneId: string;
  /** Текущее состояние блокировки. */
  locked: boolean;
  /** Текущая видимость. */
  visible: boolean;
}

interface UseDrawingToolsReturn {
  // …существующие поля без изменений (categories, activeTool, magnetMode,
  //   isLocked, isVisible, autoRetrigger, selectTool, clearActiveTool,
  //   setMagnetMode, toggleLock, toggleVisibility, removeAllDrawings,
  //   setAutoRetrigger)…

  /** Реактивный список рисунков группы drawing_tools. Обновляется при
   *  добавлении/удалении/изменении свойств (см. п. 5 — стратегия обновления). */
  overlays: DrawingOverlayInfo[];

  /** Удалить один рисунок по id. No-op если id нет в группе. */
  removeDrawing: (id: string) => void;

  /** Скрыть/показать один рисунок. */
  setDrawingVisible: (id: string, visible: boolean) => void;

  /** Заблокировать/разблокировать один рисунок. */
  setDrawingLocked: (id: string, locked: boolean) => void;
}
```

### Контракт операций

- `removeDrawing(id)` → вызывает `chart.removeOverlay({ id, groupId: DRAWING_GROUP_ID })`; после успеха обновляет `overlays` (см. п. 5). Если id не принадлежит группе — no-op (не трогать чужие overlays).
- `setDrawingVisible(id, visible)` → `chart.overrideOverlay({ id, visible })`; обновить локальный snapshot.
- `setDrawingLocked(id, locked)` → `chart.overrideOverlay({ id, lock: locked })`; обновить локальный snapshot.
- Все три должны быть идемпотентны и безопасны при `state.chart === null` (no-op, не throw).

### Локализация имени (опционально, но желательно)

Добавить helper `drawingLabel(name): string`, который возвращает `localeKey` для имени инструмента по таблице `DRAWING_CATEGORIES` (категория → tool → `localeKey` уже есть в типе `DrawingToolItem`). Это позволяет consuming-приложению показать человекочитаемое имя («Segment» вместо «segment») без дублирования таблицы. Если это усложняет — вынести в отдельную минорную задачу, но минимум — экспортировать `DrawingOverlayInfo`.

---

## 4. Файлы, которые нужно изменить

(Пути относительно корня репозитория `react-klinecharts-ui`.)

| Файл | Действие |
|---|---|
| `src/hooks/useDrawingTools.ts` | Основная правка: добавить `overlays` state + 3 операции + стратегию обновления (п. 5) |
| `src/types.ts` (или там, где объявлен `UseDrawingToolsReturn`) | Добавить `DrawingOverlayInfo` + новые поля интерфейса |
| `src/index.ts` | Экспортировать тип `DrawingOverlayInfo` |
| `README.md` | Обновить таблицу `useDrawingTools` (раздел ~`### useDrawingTools`, строки 741–789): добавить строки для `overlays`, `removeDrawing`, `setDrawingVisible`, `setDrawingLocked`; добавить описание реактивности |
| Тесты (см. п. 6) | Покрыть новый API |

**Не трогать:** `src/extensions/*`, klinecharts, другие хуки.

---

## 5. Стратегия реактивности `overlays` (архитектурное решение)

Поскольку overlay-событий в klinecharts нет, нужен гибридный подход. Рекомендуемая стратегия (подтвердить или предложить альтернативу в PR-описании):

1. **Локальный snapshot в `useState<DrawingOverlayInfo[]>`.** При mount и при смене `state.chart` делать начальный снимок из `chart.getOverlays({ groupId: DRAWING_GROUP_ID })`.

2. **Точный апдейт при известных операциях.** В существующем обработчике `onDrawEnd` (он уже есть в `createOverlayForTool` и уже дергает `undoRedoListenerRef`) — после добавления добавить refresh snapshot (новый overlay уже в `chart`, можно прочитать его по `event.overlay.id` и дополнить массив, либо полный реcет `getOverlays`). Аналогично — после `removeDrawing` / `setDrawingVisible` / `setDrawingLocked` обновить snapshot из результата операции (override/remove возвращают `boolean`, поэтому надежнее перечитать `getOverlays` после успеха).

3. **Polling-fallback как страховка.** Раз в ~1000 мс (или привязавшись к существующему интервалу провайдера, если есть) перечитывать `getOverlays({ groupId: DRAWING_GROUP_ID })` и сравнивать по `id`-множеству + хэшу `{locked,visible}`; при расхождении — обновлять state. Это ловит изменения, сделанные вне хука (пользователь удалил рисунок клавишей Delete через klinecharts, undo/redo, и т.п.). Polling должен быть активен только пока есть подписчики (см. п. 5.1).

4. **undo/redo-интеграция.** Существующий `undoRedoListenerRef` уже получает `overlay_added`. Убедиться, что undo (восстановление рисунка) и redo тоже триггерят refresh snapshot — либо через подписку на `useUndoRedo`, либо через polling-fallback (п. 3 покроет).

### 5.1 Производительность / garbage collection

- Snapshot должен вычисляться через `useMemo`/`useSyncExternalStore`, не создавая новый массив каждый рендер, если множество не изменилось (сравнение по `id` + `locked` + `visible`).
- Polling-интервал обязан чиститься в `useEffect` cleanup при unmount или смене chart.
- Если возможно, предпочтительнее `useSyncExternalStore(subscribe, getSnapshot)` вместо ручного `useState`+`setInterval` — это уберёт tearing и лишние ререндеры. `subscribe` регистрирует колбэк обновления, который дергается из п. 2/3.

---

## 6. Тесты (обязательно)

Библиотека использует vitest (см. `package.json scripts.test`). Добавить тест-файл `src/hooks/useDrawingTools.test.ts` (или рядом, по конвенции репозитория) с покрытием:

1. **`overlays` пуст после mount** (нет рисунков) → `overlays === []`.
2. **После создания рисунка** (вызов `selectTool` + симуляция `onDrawEnd`) → `overlays` содержит один элемент с правильными `id`/`name`.
3. **`removeDrawing(id)`** удаляет элемент из `overlays` и вызывает `chart.removeOverlay`.
4. **`setDrawingVisible(id, false)`** → соответствующий элемент `overlays[i].visible === false`, вызван `chart.overrideOverlay({ id, visible: false })`.
5. **`setDrawingLocked(id, true)`** → `overlays[i].locked === true`, вызван `chart.overrideOverlay({ id, lock: true })`.
6. **Изоляция группы:** overlay с другим `groupId` не появляется в `overlays` и не удаляется `removeDrawing`.
7. **No-op при `chart === null`:** все 3 операции не throw.

Для тестов использовать mock `Chart` (частичный mock с `getOverlays`/`overrideOverlay`/`removeOverlay`/`createOverlay`/`subscribeAction`), как уже принято в существующих тестах хуков (изучить соседние `*.test.ts` и повторить паттерн). Рендерить хук внутри тестового `KlinechartsUIProvider` через `@testing-library/react` `renderHook`, как в существующих тестах.

---

## 7. Документация (README)

В разделе `### useDrawingTools` обновить:

- Список деструктуризации (строки ~746–760) — добавить `overlays`, `removeDrawing`, `setDrawingVisible`, `setDrawingLocked`.
- Таблицу полей — добавить 4 строки.
- Новый подраздел **«Per-drawing management»** (~5 строк): объяснить, что `overlays` реактивен, перечислить 3 операции, упомянуть polling-fallback для внешних изменений (Delete-клавиша, undo/redo).
- Добавить интерфейс `DrawingOverlayInfo` в блок типов (рядом с `DrawingToolItem`).

---

## 8. Совместимость и релиз

- **Semver:** minor (1.2.0). Добавляются только новые поля/методы, существующие не меняются.
- **peerDeps не меняются** (`klinecharts@>=10.0.0-beta3`, `react-klinecharts@>=0.3.0`) — все нужные методы уже в beta3.
- `pnpm build` (tsup) должен пройти без ошибок типов.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` — зелёные.
- `DrawingOverlayInfo` должен войти в package exports (проверить `dist/index.d.ts` после сборки).

---

## 9. Критерии приёмки (готово, когда)

1. ✅ Новый API (`overlays`, `removeDrawing`, `setDrawingVisible`, `setDrawingLocked`) доступен и типизирован в `dist/index.d.ts`.
2. ✅ `DrawingOverlayInfo` экспортируется из `react-klinecharts-ui`.
3. ✅ Все тесты из п. 6 проходят.
4. ✅ `overlays` корректно обновляется при: создании рисунка (через `selectTool`), удалении (включая клавишей Delete вне хука — покрывается polling), смене видимости/блока, undo/redo.
5. ✅ Существующие consuming-приложения (без изменений в их коде) продолжают работать — обратная совместимость подтверждена.
6. ✅ README обновлён.
7. ✅ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` зелёные.

---

## 10. Что НЕ входит в задачу (out of scope)

- Перенос рисунка между panes (`setDrawingPane(id, paneId)`) — klinecharts не даёт такого API; не делать.
- Редактирование `points`/`styles` отдельного рисунка через хук — если нужно, отдельной задачей (API: `updateDrawing(id, partial)`).
- Группировка рисунков в иерархию (TradingView «objects tree» с папками) — это задача UI-слоя приложения, не библиотеки.
- Любые изменения в klinecharts.
- Изменения других хуков библиотеки.

---

## 11. Контекст для consuming-приложения (почему это нужно)

Приложение TradeDash (live-demo терминал) строит Object Tree панель. С этим API реализация становится тривиальной и надёжной:

```tsx
const { overlays, removeDrawing, setDrawingVisible, setDrawingLocked } = useDrawingTools();
// overlays.map(o => <Row label={o.name} visible={o.visible} locked={o.locked}
//   onToggleVis={() => setDrawingVisible(o.id, !o.visible)}
//   onDel={() => removeDrawing(o.id)} />)
```

Без этого API приложению пришлось бы вручную опрашивать `chart.getOverlays()` и дублировать учёт — что нарушает инкапсуляцию, которую хук призван обеспечивать.
