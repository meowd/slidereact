import { useCallback, useRef } from "react";
import type { DragEvent, MouseEvent, PointerEvent } from "react";
import type { MutableRefObject } from "./internalTypes";
import type { SliderState } from "./internalTypes";

/** Минимальная дистанция для определения оси жеста. */
const DRAG_AXIS_THRESHOLD = 6;
/** Сопротивление перетаскиванию за границы конечного слайдера. */
const EDGE_RESISTANCE = 0.3;
/** Минимальный порог переключения свайпом, px. */
const MIN_SWIPE_THRESHOLD = 24;
/** Максимальный порог переключения свайпом, px. */
const MAX_SWIPE_THRESHOLD = 80;
/** Доля ширины слайда для расчёта порога свайпа. */
const SWIPE_THRESHOLD_RATIO = 0.18;

interface DragParams {
	count: number;
	infinite: boolean;
	duration: number;
	stateRef: MutableRefObject<SliderState>;
	updateState: (patch: Partial<SliderState>) => SliderState;
	pendingAfterChangeRef: MutableRefObject<number | null>;
	moveBy: (direction: number) => boolean;
}

interface PointerState {
	active: boolean;
	pointerId?: number;
	startX?: number;
	startY?: number;
	axis?: "x" | "y" | null;
}

/** Реализует жесты мышью и касанием; навигацию выполняет основной бизнес-хук. */
export function useSliderDragAndDropBusiness({ count, infinite, duration, stateRef, updateState, pendingAfterChangeRef, moveBy }: DragParams) {
	const pointerRef = useRef<PointerState>({ active: false });
	const didDragRef = useRef(false);
	const suppressClickRef = useRef(false);

	/** Возвращает слайдер обратно при недостаточном движении. */
	const snapBack = useCallback(() => {
		const current = stateRef.current;
		if (Math.abs(current.dragOffset) < 0.5 || duration <= 0) {
			updateState({ isDragging: false, dragOffset: 0 });
			return;
		}
		pendingAfterChangeRef.current = null;
		updateState({ isAnimating: true, isDragging: false, dragOffset: 0 });
	}, [duration, pendingAfterChangeRef, stateRef, updateState]);

	/** Начинает отслеживать указатель. */
	const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
		const current = stateRef.current;
		if (count <= current.settings.slidesToShow || current.isAnimating || current.isDragging || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
		didDragRef.current = false;
		suppressClickRef.current = false;
		pointerRef.current = { active: true, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, axis: null };
		// Не захватываем указатель сразу, чтобы вертикальная прокрутка страницы оставалась естественной.
		updateState({ isDragging: true, dragOffset: 0 });
	}, [count, stateRef, updateState]);

	/** Сдвигает трек только при горизонтальном жесте. */
	const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
		const pointer = pointerRef.current;
		if (!pointer.active || pointer.pointerId !== event.pointerId) return;
		const deltaX = event.clientX - (pointer.startX ?? event.clientX);
		const deltaY = event.clientY - (pointer.startY ?? event.clientY);
		if (pointer.axis === null) {
			if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < DRAG_AXIS_THRESHOLD) return;
			pointer.axis = Math.abs(deltaX) >= Math.abs(deltaY) ? "x" : "y";
			if (pointer.axis === "x" && event.pointerType === "mouse") {
				try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture необязателен. */ }
			}
		}
		if (pointer.axis !== "x") return;
		if (event.cancelable) event.preventDefault();
		didDragRef.current = true;
		const current = stateRef.current;
		const loopEnabled = infinite && count > current.settings.slidesToShow;
		const max = Math.max(0, count - current.settings.slidesToShow);
		const outside = !loopEnabled && ((current.currentIndex <= 0 && deltaX > 0) || (current.currentIndex >= max && deltaX < 0));
		updateState({ dragOffset: outside ? deltaX * EDGE_RESISTANCE : deltaX });
	}, [count, infinite, stateRef, updateState]);

	/** Завершает жест и запускает переход при достижении порога. */
	const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
		const pointer = pointerRef.current;
		if (!pointer.active || pointer.pointerId !== event.pointerId) return;
		try { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* Захват мог быть освобождён. */ }
		const deltaX = event.clientX - (pointer.startX ?? event.clientX);
		const horizontal = pointer.axis === "x";
		pointerRef.current = { active: false };
		if (!horizontal) {
			updateState({ isDragging: false, dragOffset: 0 });
			return;
		}
		suppressClickRef.current = didDragRef.current;
		const current = stateRef.current;
		const slideWidth = current.containerWidth / current.settings.slidesToShow;
		const threshold = Math.min(MAX_SWIPE_THRESHOLD, Math.max(MIN_SWIPE_THRESHOLD, slideWidth * SWIPE_THRESHOLD_RATIO));
		if (Math.abs(deltaX) >= threshold) {
			// moveBy блокирует переходы, пока isDragging=true.
			updateState({ isDragging: false, dragOffset: 0 });
			const moved = moveBy(deltaX < 0 ? 1 : -1);
			if (!moved) snapBack();
			return;
		}
		snapBack();
	}, [moveBy, snapBack, stateRef, updateState]);

	/** Сбрасывает жест при отмене браузером. */
	const handlePointerCancel = useCallback((event: PointerEvent<HTMLDivElement>) => {
		if (pointerRef.current.pointerId !== event.pointerId) return;
		pointerRef.current = { active: false };
		didDragRef.current = false;
		updateState({ isDragging: false, dragOffset: 0 });
	}, [updateState]);

	/** Не открывает ссылку после перетаскивания, но сохраняет обычные клики. */
	const handleClickCapture = useCallback((event: MouseEvent<HTMLDivElement>) => {
		if (!suppressClickRef.current) return;
		suppressClickRef.current = false;
		event.preventDefault();
		event.stopPropagation();
	}, []);

	/** Отключает нативный drag изображений и ссылок. */
	const handleDragStart = useCallback((event: DragEvent<HTMLDivElement>) => event.preventDefault(), []);

	/** Прерывает активный жест при перерасчёте геометрии. */
	const resetDrag = useCallback(() => {
		pointerRef.current = { active: false };
		didDragRef.current = false;
		suppressClickRef.current = false;
	}, []);

	return { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel, handleClickCapture, handleDragStart, resetDrag };
}
