import { Children } from "react";
import type { CSSProperties } from "react";
import SlideItem from "./components/slideItem";
import PrevArrow from "./components/prevArrow";
import NextArrow from "./components/nextArrow";
import Dots from "./components/dots";
import { useSliderBusiness } from "./sliderBusiness";
import type { SliderProps } from "./types";

/** Лёгкий React-слайдер без runtime-зависимостей, кроме React. */
export default function Slider({
	ref, children, isList = false, itemClassName = "", arrows = false,
	prevArrowClassName = "", nextArrowClassName = "", className = "",
	slidesToShow = 1, slidesToScroll = 1, initialSlide = 0, speed = 500,
	infinite = false, breakpoints, afterChange,
	autoplay = false, autoplaySpeed = 5000,
	dots = false, dotsClassName = null,
}: SliderProps) {
	const slides = Children.toArray(children);
	const slider = useSliderBusiness({
		sliderRef: ref, slideCount: slides.length, slidesToShow, slidesToScroll,
		initialSlide, speed, infinite, breakpoints, afterChange,
		autoplay, autoplaySpeed,
	});
	const Track = isList ? "ul" : "div";
	const slidePercent = 100 / slider.slidesToShow;
	const rootStyle: CSSProperties = { position: "relative", minWidth: 0, maxWidth: "100%" };
	const viewportStyle: CSSProperties = {
		width: "100%", maxWidth: "100%", minWidth: 0,
		overflow: "hidden", touchAction: "pan-y pinch-zoom"
	};
	const trackStyle: CSSProperties = {
		display: "flex", flexWrap: "nowrap", width: "100%",
		transform: `translate3d(${slider.translateX}px, 0, 0)`,
		transition: slider.isAnimating ? `transform ${slider.animationSpeed}ms ease` : "none",
		willChange: "transform", userSelect: slider.isDragging ? "none" : undefined,
		...(isList ? { margin: 0, padding: 0, listStyle: "none" } : {}),
	};
	const slideStyle: CSSProperties = { flex: `0 0 ${slidePercent}%`, width: `${slidePercent}%`, minWidth: 0, boxSizing: "border-box" };

	return (
		<div className={className || undefined} style={rootStyle}>
			<PrevArrow display={arrows === true} className={prevArrowClassName} disabled={slider.prevDisabled} onClick={slider.goPrev} />
			<div ref={slider.viewportRef} style={viewportStyle}
				onPointerDown={slider.handlePointerDown} onPointerMove={slider.handlePointerMove}
				onPointerUp={slider.handlePointerUp} onPointerCancel={slider.handlePointerCancel}
				onClickCapture={slider.handleClickCapture} onDragStart={slider.handleDragStart}>
				<Track style={trackStyle} onTransitionEnd={slider.handleTransitionEnd}>
					{slider.renderedSlides.map(descriptor => (
						<SlideItem key={`slider-${descriptor.trackIndex}-${descriptor.sourceIndex}`}
							child={slides[descriptor.sourceIndex]} isList={isList}
							itemClassName={itemClassName} slideStyle={slideStyle} />
					))}
				</Track>
			</div>
			<NextArrow display={arrows === true} className={nextArrowClassName} disabled={slider.nextDisabled} onClick={slider.goNext} />
			<Dots
				display={dots === true && slider.slidesToShow === 1}
				count={slider.slideCount}
				currentIndex={slider.currentIndex}
				className={dotsClassName}
				disabled={slider.isAnimating || slider.isDragging}
				onClick={slider.goTo}
			/>
		</div>
	);
}
