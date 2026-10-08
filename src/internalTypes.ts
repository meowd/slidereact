export interface SliderSettings {
	slidesToShow: number;
	slidesToScroll: number;
}

export interface SliderState {
	settings: SliderSettings;
	containerWidth: number;
	currentIndex: number;
	virtualIndex: number;
	isAnimating: boolean;
	isDragging: boolean;
	dragOffset: number;
}

export interface SlideDescriptor {
	sourceIndex: number;
	trackIndex: number;
	isOriginal: boolean;
}

export type MutableRefObject<T> = { current: T };
