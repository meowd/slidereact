# Changelog

## [1.0.3] - 2026-10-08

### Changed

- New props: autoplay, autoplaySpeed, dots, dotsClassName

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `autoplay` | `boolean` | `false` | Automatically advances slides. |
| `autoplaySpeed` | `number` | `5000` | Delay in milliseconds before automatically advancing to the next slide. |
| `dots` | `boolean` | `false` | Shows navigation dots, one per slide. Only available when `slidesToShow` is `1`. |
| `dotsClassName` | `string \| null` | `null` | Custom CSS class applied to each navigation dot. Uses default inline styles when not specified. |

## [1.0.2] - 2026-10-08

### Changed
- Updated npm package. Slider accessibility in static HTML.

## [1.0.1] - 2026-10-08

### Changed
- Updated npm package name to `the-slidereact`.

## [1.0.0] — first stable release

- React 19+ function component and ref methods.
- Finite and infinite carousel, mobile-first breakpoints, initialSlide.
- Mouse dragging and touch swipes.
- Semantic list mode and inline sizing.
- SSR-safe rendering, TypeScript definitions, ESM and CommonJS.

## [0.0.0] — registry bootstrap

- Reserved package name to enable npm Trusted Publishing.
