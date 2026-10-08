import { Slider } from "./index";

/** Public global API for plain HTML usage. */
(globalThis as typeof globalThis & {
	TheSlidereact?: {
		Slider: typeof Slider
	}
}).TheSlidereact = { Slider };
