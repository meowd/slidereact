import type { ReactNode } from "react";

/** Адаптивные настройки от заданной ширины окна (mobile first). */
export interface SliderBreakpoint {
	minWidth: number;
	slidesToShow?: number;
	slidesToScroll?: number;
}

/** Публичные методы слайдера. true означает, что переход запущен. */
export interface SliderRef {
	goTo: (slideIndex: number) => boolean;
	goToPrev: () => boolean;
	goToNext: () => boolean;
}

/** Параметры слайдера. */
export interface SliderProps {
	children: ReactNode;
	isList?: boolean;
	itemClassName?: string;
	arrows?: boolean;
	autoplay?: boolean;
	autoplaySpeed?: number;
	dots?: boolean;
	dotsClassName?: string | null;
	prevArrowClassName?: string;
	nextArrowClassName?: string;
	className?: string;
	slidesToShow?: number;
	slidesToScroll?: number;
	initialSlide?: number;
	speed?: number;
	infinite?: boolean;
	breakpoints?: SliderBreakpoint[];
	afterChange?: (index: number) => void;
	ref?: import("react").Ref<SliderRef>;
}
