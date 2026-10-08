interface ArrowProps {
	display: boolean;
	className?: string;
	disabled: boolean;
	onClick: () => void;
}

/** Отображает стрелку назад. */
export default function PrevArrow(props: ArrowProps) {
	if (props.display === false) return null;
	return <button type="button" className={props.className || undefined} disabled={props.disabled} onClick={props.onClick} aria-label="Previous slides">‹</button>;
}
