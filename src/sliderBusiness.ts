import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { TransitionEvent } from "react";
import { useSliderDragAndDropBusiness } from "./sliderDragAndDropBusiness";
import type { SlideDescriptor, SliderSettings, SliderState } from "./internalTypes";
import type { SliderBreakpoint, SliderProps, SliderRef } from "./types";

/** Неизменяемая настройка breakpoints по умолчанию. */
const EMPTY_BREAKPOINTS: SliderBreakpoint[] = [];
/** Запас времени для fallback-таймера окончания анимации. */
const TRANSITION_FALLBACK_MS = 80;

/** Приводит число к конечному числовому значению. */
function numberOr(value: unknown, fallback = 0): number {
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
}

/** Ограничивает значение диапазоном. */
function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(numberOr(value, min), min), max);
}

/** Возвращает неотрицательный остаток от деления. */
function modulo(value: number, divisor: number): number {
	if (!Number.isFinite(divisor) || divisor <= 0) return 0;
	return ((Math.trunc(numberOr(value)) % divisor) + divisor) % divisor;
}

/** Нормализует положительное целое число. */
function positiveInt(value: unknown, fallback = 1): number {
	const n = numberOr(value, fallback);
	return n > 0 ? Math.max(1, Math.trunc(n)) : fallback;
}

/** Нормализует настройки для доступного числа слайдов. */
function normalizeSettings(show: unknown, scroll: unknown, count: number): SliderSettings {
	return {
		slidesToShow: count > 0 ? Math.min(count, positiveInt(show)) : 1,
		slidesToScroll: count > 0 ? Math.min(count, positiveInt(scroll)) : 1,
	};
}

/** Сортирует и очищает breakpoints (mobile first). */
function normalizeBreakpoints(breakpoints: SliderBreakpoint[]): SliderBreakpoint[] {
	return breakpoints.filter(item => item && Number.isFinite(item.minWidth) && item.minWidth >= 0)
		.map(item => ({
			minWidth: item.minWidth,
			slidesToShow: item.slidesToShow !== undefined && Number(item.slidesToShow) > 0 ? positiveInt(item.slidesToShow) : undefined,
			slidesToScroll: item.slidesToScroll !== undefined && Number(item.slidesToScroll) > 0 ? positiveInt(item.slidesToScroll) : undefined,
		}))
		.sort((a, b) => a.minWidth - b.minWidth);
}

/** Находит актуальные настройки для ширины viewport. */
function resolveSettings(viewportWidth: number, show: number, scroll: number, breakpoints: SliderBreakpoint[], count: number): SliderSettings {
	let selectedShow = show;
	let selectedScroll = scroll;
	for (const breakpoint of breakpoints) {
		if (viewportWidth < breakpoint.minWidth) break;
		selectedShow = breakpoint.slidesToShow ?? selectedShow;
		selectedScroll = breakpoint.slidesToScroll ?? selectedScroll;
	}
	return normalizeSettings(selectedShow, selectedScroll, count);
}

/** Возвращает максимальную стартовую позицию конечного слайдера. */
function maxIndex(count: number, show: number): number {
	return Math.max(0, count - positiveInt(show));
}

/** Нормализует исходный индекс для конечного или циклического режима. */
function normalizeIndex(value: unknown, count: number, show: number, loop: boolean): number {
	if (count <= 0) return 0;
	const index = Math.trunc(numberOr(value));
	return loop ? modulo(index, count) : clamp(index, 0, maxIndex(count, show));
}

/** Определяет число технических копий по краям трека. */
function bufferSize(loop: boolean, settings: SliderSettings): number {
	return loop ? settings.slidesToShow + settings.slidesToScroll : 0;
}

/** Создаёт карту оригинальных и технических слайдов. */
function buildDescriptors(count: number, loop: boolean, buffer: number): SlideDescriptor[] {
	if (count <= 0) return [];
	const result: SlideDescriptor[] = [];
	const append = (sourceIndex: number, isOriginal: boolean) => {
		result.push({ sourceIndex: modulo(sourceIndex, count), trackIndex: result.length, isOriginal });
	};
	if (loop) for (let i = 0; i < buffer; i++) append(count - buffer + i, false);
	for (let i = 0; i < count; i++) append(i, true);
	if (loop) for (let i = 0; i < buffer; i++) append(i, false);
	return result;
}

/** Возвращает размер и доступность циклической прокрутки. */
function loopFor(count: number, settings: SliderSettings, infinite: boolean): boolean {
	return infinite && count > settings.slidesToShow;
}

interface SliderBusinessParams extends Pick<SliderProps,
	"slidesToShow" | "slidesToScroll" | "initialSlide" | "speed" | "infinite" | "breakpoints" | "afterChange" | "autoplay" | "autoplaySpeed"> {
	slideCount: number;
	sliderRef?: SliderProps["ref"];
}

/** Управляет слайдером: навигация, responsive-геометрия, loop и анимации. */
export function useSliderBusiness({
	sliderRef, slideCount, slidesToShow = 1, slidesToScroll = 1, initialSlide = 0,
	speed = 500, infinite = false, breakpoints = EMPTY_BREAKPOINTS, afterChange, autoplay = false, autoplaySpeed = 5000,
}: SliderBusinessParams) {
	const count = Math.max(0, Math.trunc(numberOr(slideCount)));
	const duration = Math.max(0, numberOr(speed, 500));
	const preparedBreakpoints = useMemo(() => normalizeBreakpoints(breakpoints), [breakpoints]);
	const viewportRef = useRef<HTMLDivElement>(null);
	const afterChangeRef = useRef(afterChange);
	const pendingAfterChangeRef = useRef<number | null>(null);
	const stateRef = useRef<SliderState | null>(null);

	/** Инициализирует положение один раз с учётом initialSlide. */
	const [state, setState] = useState<SliderState>(() => {
		const settings = normalizeSettings(slidesToShow, slidesToScroll, count);
		const loop = loopFor(count, settings, infinite);
		const index = normalizeIndex(initialSlide, count, settings.slidesToShow, loop);
		const initial: SliderState = {
			settings, containerWidth: 0, currentIndex: index,
			virtualIndex: (loop ? bufferSize(loop, settings) : 0) + index,
			isAnimating: false, isDragging: false, dragOffset: 0,
		};
		stateRef.current = initial;
		return initial;
	});

	// Поведение по клику должно видеть актуальный callback.
	useEffect(() => { afterChangeRef.current = afterChange; }, [afterChange]);

	/** Синхронизирует React-состояние с ref для обработчиков событий. */
	const updateState = useCallback((patch: Partial<SliderState>): SliderState => {
		const previous = stateRef.current!;
		const next = { ...previous, ...patch };
		stateRef.current = next;
		setState(next);
		return next;
	}, []);

	const loopEnabled = loopFor(count, state.settings, infinite);
	const canNavigate = count > state.settings.slidesToShow;
	const buffer = bufferSize(loopEnabled, state.settings);

	/** Заканчивает transition и сбрасывает виртуальную позицию за буфером. */
	const finishTransition = useCallback(() => {
		const current = stateRef.current!;
		if (!current.isAnimating) return;
		const loop = loopFor(count, current.settings, infinite);
		const index = normalizeIndex(current.currentIndex, count, current.settings.slidesToShow, loop);
		const completed = pendingAfterChangeRef.current;
		pendingAfterChangeRef.current = null;
		updateState({
			currentIndex: index, virtualIndex: (loop ? bufferSize(loop, current.settings) : 0) + index,
			isAnimating: false, isDragging: false, dragOffset: 0
		});
		if (completed !== null) afterChangeRef.current?.(index);
	}, [count, infinite, updateState]);

	/** Переходит на указанный индекс; virtualTarget нужен для короткого loop-перехода. */
	const navigateTo = useCallback((slideIndex: number, virtualTarget?: number): boolean => {
		if (!Number.isFinite(slideIndex)) return false;
		const current = stateRef.current!;
		const loop = loopFor(count, current.settings, infinite);
		if (count <= current.settings.slidesToShow || current.isAnimating || current.isDragging) return false;
		const next = normalizeIndex(slideIndex, count, current.settings.slidesToShow, loop);
		const index = normalizeIndex(current.currentIndex, count, current.settings.slidesToShow, loop);
		if (next === index) return false;
		const normalizedVirtual = (loop ? bufferSize(loop, current.settings) : 0) + next;
		pendingAfterChangeRef.current = next;
		if (duration === 0) {
			pendingAfterChangeRef.current = null;
			updateState({ currentIndex: next, virtualIndex: normalizedVirtual, dragOffset: 0, isAnimating: false, isDragging: false });
			afterChangeRef.current?.(next);
			return true;
		}
		updateState({
			currentIndex: next, virtualIndex: virtualTarget ?? normalizedVirtual,
			dragOffset: 0, isDragging: false, isAnimating: true
		});
		return true;
	}, [count, duration, infinite, updateState]);

	/** Перемещает на slidesToScroll вперёд или назад. */
	const moveBy = useCallback((direction: number): boolean => {
		const current = stateRef.current!;
		const loop = loopFor(count, current.settings, infinite);
		const index = normalizeIndex(current.currentIndex, count, current.settings.slidesToShow, loop);
		const delta = (direction > 0 ? 1 : -1) * current.settings.slidesToScroll;
		const next = normalizeIndex(index + delta, count, current.settings.slidesToShow, loop);
		const virtual = loop ? current.virtualIndex + delta : next;
		return navigateTo(next, virtual);
	}, [count, infinite, navigateTo]);

	/** Переходит к произвольному индексу оригинального набора. */
	const goTo = useCallback((index: number) => navigateTo(index), [navigateTo]);
	/** Переходит назад на одну группу. */
	const goToPrev = useCallback(() => moveBy(-1), [moveBy]);
	/** Переходит вперёд на одну группу. */
	const goToNext = useCallback(() => moveBy(1), [moveBy]);

	/**
	 * Нормализует задержку автопрокрутки.
	 *
	 * @param {number} value
	 * @returns {number}
	 */
	const normalizeAutoplaySpeed = (value: number): number => {
		return Number.isFinite(value) && value > 0
			? value
			: 5000;
	};

	const autoplayDelay = normalizeAutoplaySpeed(autoplaySpeed);

	/**
	 * Запускает автопрокрутку после заданной задержки.
	 * Таймер пересоздаётся после каждого переключения.
	 */
	useEffect(() => {
		if (!autoplay || !canNavigate) {
			return;
		}

		if (state.isAnimating || state.isDragging) {
			return;
		}

		const currentIndex = normalizeIndex(
			state.currentIndex,
			count,
			state.settings.slidesToShow,
			loopEnabled,
		);

		if (
			!loopEnabled &&
			currentIndex >= maxIndex(count, state.settings.slidesToShow)
		) {
			return;
		}

		const timer = window.setTimeout(() => {
			goToNext();
		}, autoplayDelay);

		return () => {
			window.clearTimeout(timer);
		};
	}, [
		autoplay,
		autoplayDelay,
		canNavigate,
		count,
		loopEnabled,
		state.currentIndex,
		state.settings.slidesToShow,
		state.isAnimating,
		state.isDragging,
		goToNext,
	]);

	useImperativeHandle<SliderRef, SliderRef>(sliderRef, () => ({ goTo, goToPrev, goToNext }), [goTo, goToPrev, goToNext]);

	const drag = useSliderDragAndDropBusiness({
		count, infinite, duration, stateRef: stateRef as { current: SliderState },
		updateState, pendingAfterChangeRef, moveBy
	});

	/** Пересчитывает геометрию только при реальном изменении размеров или правил. */
	const recalculate = useCallback(() => {
		if (typeof window === "undefined" || !viewportRef.current) return;
		const settings = resolveSettings(window.innerWidth, slidesToShow, slidesToScroll, preparedBreakpoints, count);
		const width = Math.max(0, numberOr(viewportRef.current.getBoundingClientRect().width));
		const current = stateRef.current!;
		if (current.containerWidth === width && current.settings.slidesToShow === settings.slidesToShow &&
			current.settings.slidesToScroll === settings.slidesToScroll &&
			current.currentIndex === normalizeIndex(current.currentIndex, count, settings.slidesToShow, loopFor(count, settings, infinite))) return;
		const loop = loopFor(count, settings, infinite);
		const index = normalizeIndex(current.currentIndex, count, settings.slidesToShow, loop);
		const changed = index !== current.currentIndex;
		pendingAfterChangeRef.current = null;
		drag.resetDrag();
		updateState({
			settings, containerWidth: width, currentIndex: index,
			virtualIndex: (loop ? bufferSize(loop, settings) : 0) + index,
			isAnimating: false, isDragging: false, dragOffset: 0
		});
		if (changed) afterChangeRef.current?.(index);
	}, [count, infinite, preparedBreakpoints, slidesToScroll, slidesToShow, updateState, drag.resetDrag]);

	useEffect(() => {
		if (typeof window === "undefined" || !viewportRef.current) return;
		const element = viewportRef.current;
		let frame: number | null = null;
		/** Объединяет частые resize-события в один пересчёт. */
		const schedule = () => {
			if (frame !== null) window.cancelAnimationFrame(frame);
			frame = window.requestAnimationFrame(() => { frame = null; recalculate(); });
		};
		schedule();
		window.addEventListener("resize", schedule, { passive: true });
		const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
		observer?.observe(element);
		return () => {
			if (frame !== null) window.cancelAnimationFrame(frame);
			window.removeEventListener("resize", schedule);
			observer?.disconnect();
		};
	}, [recalculate]);

	// transitionend иногда не приходит (вкладка скрыта, нет реального движения и т. д.).
	useEffect(() => {
		if (!state.isAnimating || duration === 0 || typeof window === "undefined") return;
		const timer = window.setTimeout(finishTransition, duration + TRANSITION_FALLBACK_MS);
		return () => window.clearTimeout(timer);
	}, [duration, finishTransition, state.isAnimating]);

	/** Обрабатывает завершение анимации именно трека. */
	const handleTransitionEnd = useCallback((event: TransitionEvent<HTMLElement>) => {
		if (event.target === event.currentTarget && event.propertyName === "transform") finishTransition();
	}, [finishTransition]);

	const renderedSlides = useMemo(() => buildDescriptors(count, loopEnabled, buffer), [count, loopEnabled, buffer]);
	const slideWidth = Math.max(0, numberOr(state.containerWidth)) / positiveInt(state.settings.slidesToShow);
	const virtualIndex = loopEnabled ? state.virtualIndex : state.currentIndex;
	const currentIndex = normalizeIndex(state.currentIndex, count, state.settings.slidesToShow, loopEnabled);
	const unavailable = !canNavigate || state.isAnimating || state.isDragging;

	return {
		viewportRef, renderedSlides,
		currentIndex,
		slideCount: count,
		translateX: -(numberOr(virtualIndex) * slideWidth) + numberOr(state.dragOffset),
		slidesToShow: state.settings.slidesToShow,
		animationSpeed: duration,
		isAnimating: state.isAnimating,
		isDragging: state.isDragging,
		prevDisabled: unavailable || (!loopEnabled && currentIndex <= 0),
		nextDisabled: unavailable || (!loopEnabled && currentIndex >= maxIndex(count, state.settings.slidesToShow)),
		goPrev: goToPrev, goNext: goToNext, handleTransitionEnd,
		goTo,
		handlePointerDown: drag.handlePointerDown,
		handlePointerMove: drag.handlePointerMove,
		handlePointerUp: drag.handlePointerUp,
		handlePointerCancel: drag.handlePointerCancel,
		handleClickCapture: drag.handleClickCapture,
		handleDragStart: drag.handleDragStart,
	};
}
