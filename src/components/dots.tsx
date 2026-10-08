import type { CSSProperties } from "react";

/**
 * Параметры компонента точек.
 */
interface DotsProps {
	display: boolean;
	count: number;
	currentIndex: number;
	className?: string | null;
	disabled?: boolean;
	onClick: (index: number) => void;
}

/**
 * Отображает навигационные точки слайдера.
 *
 * @param {DotsProps} props
 * @returns {React.ReactElement | null}
 */
export default function Dots(props: DotsProps) {
	if (props.display === false || props.count <= 0) {
		return null;
	}

	const containerStyle: CSSProperties = {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		flexWrap: "wrap",
		gap: "8px",
		marginTop: "12px",
	};

	const defaultDotStyle: CSSProperties = {
		border: "2px solid #fff",
		borderRadius: "100%",
		height: "10px",
		width: "10px",
		padding: 0,
		boxSizing: "border-box",
		background: "transparent",
		cursor: "pointer",
		display: "block",
	};

	const activeDotStyle: CSSProperties = {
		...defaultDotStyle,
		background: "#fff",
	};

	return (
		<div
			style={containerStyle}
			role="group"
			aria-label=""
		>
			{Array.from({ length: props.count }, (_, index) => {
				const active = index === props.currentIndex;

				return (
					<button
						key={index}
						type="button"
						className={props.className || undefined}
						style={
							props.className
								? undefined
								: active
									? activeDotStyle
									: defaultDotStyle
						}
						disabled={props.disabled}
						aria-label={`${index + 1}`}
						aria-current={active ? "true" : undefined}
						onClick={() => props.onClick(index)}
					/>
				);
			})}
		</div>
	);
}