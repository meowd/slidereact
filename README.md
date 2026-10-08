# React Slider "the-slidereact"

A small, CSS-free React 19+ slider written in TypeScript. ESM + CommonJS builds, TypeScript declarations, no runtime dependencies other than peer React/React DOM.

[Interactive demo (GitHub Pages)](https://meowd.github.io/slidereact/) · [Source](https://github.com/meowd/slidereact) · [npm](https://www.npmjs.com/package/the-slidereact)

## Installation

```bash
npm install the-slidereact
```

React 19+ and React DOM 19+ are peer dependencies. The component supports JavaScript and TypeScript projects, SSR, and client hydration.

## JavaScript usage

```jsx
import Slider from "the-slidereact";

export function Gallery() {
  return (
    <Slider arrows infinite slidesToShow={1} slidesToScroll={1}
      breakpoints={[{ minWidth: 768, slidesToShow: 3, slidesToScroll: 3 }]}
      afterChange={(index) => console.log("First visible:", index)}>
      {[1, 2, 3, 4, 5].map(n => <div key={n}>Slide {n}</div>)}
    </Slider>
  );
}
```

## TypeScript and imperative methods

```tsx
import { useRef } from "react";
import Slider, { type SliderRef, type SliderBreakpoint } from "the-slidereact";

const breakpoints: SliderBreakpoint[] = [
  { minWidth: 768, slidesToShow: 3, slidesToScroll: 3 },
];

export function Gallery() {
  const slider = useRef<SliderRef>(null);
  return (
    <>
      <button onClick={() => slider.current?.goToPrev()}>Previous</button>
      <button onClick={() => slider.current?.goTo(4)}>Slide 4</button>
      <button onClick={() => slider.current?.goToNext()}>Next</button>
      <Slider ref={slider} arrows initialSlide={1} breakpoints={breakpoints}>
        {Array.from({ length: 8 }, (_, n) => <div key={n}>Slide {n}</div>)}
      </Slider>
    </>
  );
}
```

## Semantic list

With `isList`, the slider creates `<ul>` and an `<li>` wrapper for **every** slide. Pass the content, not an existing `<li>`:

```jsx
<Slider isList slidesToShow={2} arrows>
  <article>First item</article>
  <article>Second item</article>
  <article>Third item</article>
</Slider>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | required | Slide content |
| `isList` | `boolean` | `false` | Use `<ul><li>` instead of `<div><div>` |
| `className` | `string` | `""` | Outer root class |
| `itemClassName` | `string` | `""` | Technical wrapper class for each slide |
| `arrows` | `boolean` | `false` | Display previous / next buttons |
| `prevArrowClassName` | `string` | `""` | Previous button class |
| `nextArrowClassName` | `string` | `""` | Next button class |
| `slidesToShow` | `number` | `1` | Visible slides |
| `slidesToScroll` | `number` | `1` | Slides advanced per action |
| `initialSlide` | `number` | `0` | Starting first visible index (uncontrolled) |
| `speed` | `number` | `500` | Transition duration, ms; 0 = instant |
| `infinite` | `boolean` | `false` | Wrap between last and first slide |
| `breakpoints` | `SliderBreakpoint[]` | `[]` | Mobile-first rules selected by `window.innerWidth` |
| `autoplay` | `boolean` | `false` | Automatically advances slides. |
| `autoplaySpeed` | `number` | `5000` | Delay in milliseconds before automatically advancing to the next slide. |
| `dots` | `boolean` | `false` | Shows navigation dots, one per slide. Only available when `slidesToShow` is `1`. |
| `dotsClassName` | `string \| null` | `null` | Custom CSS class applied to each navigation dot. Uses default inline styles when not specified. |
| `afterChange` | `(index: number) => void` | – | Called after completed navigation with first visible original slide index |
| `ref` | `Ref<SliderRef>` | – | Exposes imperative API on React 19+ |

`ref.current.goTo(index)`, `goToPrev()`, and `goToNext()` return `true` when a transition starts and `false` when blocked (e.g. edge, active transition, current index). Values for `goTo` are clamped in finite mode and wrapped in infinite mode. `initialSlide` is only read during initial mount.

### Layout notes

- Layout sizing, flex track and movement use inline styles. There is **no CSS file to import**.
- Items have a technical wrapper: put padding/margins carefully on the wrapper (`itemClassName`) or inside its content.
- The parent should have a meaningful width; the slider uses `ResizeObserver` and viewport resize events.
- Mouse dragging and touch swiping are supported; keyboard shortcuts are not.
- Infinite mode adds technical copies, which duplicate slide contents in the DOM. Avoid assuming slide IDs are unique when infinite mode is enabled, and avoid side effects solely tied to mount of a child.

## Live examples and local development

```bash
npm install
npm run demo
```

Open the local URL printed by Vite. The `demo/` directory has: infinite responsive swiping, a semantic list, and `initialSlide` examples. GitHub Pages deploys the same demo on pushes to `main`.

```bash
npm run typecheck
npm run build
npm pack --dry-run
```

Build output is ESM (`dist/index.js`), CommonJS (`dist/index.cjs`), and corresponding `.d.ts` / `.d.cts` types.

## Releases

See [PUBLISHING.ru.md](PUBLISHING.ru.md) for GitHub setup, first npm bootstrap, trusted publishing, and GitHub Release steps.

## License

MIT
