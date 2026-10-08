interface ArrowProps {
	display: boolean;
	className?: string;
	disabled: boolean;
	onClick: () => void;
}

/** Отображает стрелку вперёд. */
export default function NextArrow(props: ArrowProps) {
	if (props.display === false) return null;
	return <button type="button" className={props.className || undefined} disabled={props.disabled} onClick={props.onClick} aria-label="Next slides">›</button>;
}
