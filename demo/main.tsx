import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Slider from "../src/slider";
import type { SliderRef } from "../src/types";
import "./style.css";

function Demo() {
	const slider = useRef<SliderRef>(null);
	const [index, setIndex] = useState(0);
	const numbers = Array.from({ length: 10 }, (_, n) => n);
	return (
		<main>
			<h1>the-slidereact</h1>
			<p>Zero extra runtime dependencies. React 19+, TypeScript, responsive, swipe, SSR-safe.</p>
			<h2>1. Infinite, responsive, drag &amp; external controls</h2>
			<p>First visible slide index: <strong>{index}</strong></p>
			<div className="controls">
				<button onClick={() => slider.current?.goToPrev()}>External previous</button>
				<button onClick={() => slider.current?.goTo(6)}>Go to index 6</button>
				<button onClick={() => slider.current?.goToNext()}>External next</button>
			</div>
			<Slider ref={slider} className="slider" itemClassName="slide" arrows infinite
				slidesToShow={1} slidesToScroll={1} speed={350}
				breakpoints={[{ minWidth: 700, slidesToShow: 3, slidesToScroll: 3 }]}
				afterChange={setIndex}>
				{numbers.map(n => <div className="tile" key={n}>{n}</div>)}
			</Slider>
			<h2>2. Semantic list, finite mode</h2>
			<Slider isList className="slider" itemClassName="slide" arrows slidesToShow={2} slidesToScroll={2}>
				{numbers.slice(0, 6).map(n => <div className="tile secondary" key={n}>Item {n + 1}</div>)}
			</Slider>
			<h2>3. initialSlide and disabled arrows at edges</h2>
			<Slider className="slider" itemClassName="slide" arrows initialSlide={2} slidesToShow={1} slidesToScroll={1}>
				{numbers.slice(0, 5).map(n => <article className="tile tertiary" key={n}>Card {n}</article>)}
			</Slider>
			<footer>Demo source: <a href="https://github.com/meowd/slidereact/tree/main/demo">GitHub</a></footer>
		</main>
	);
}

createRoot(document.getElementById("root")!).render(<Demo />);
