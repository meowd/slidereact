import type { CSSProperties, ReactNode } from "react";

interface SlideItemProps {
	child: ReactNode;
	isList: boolean;
	itemClassName: string;
	slideStyle: CSSProperties;
}

/** Рендерит техническую обёртку слайда, не изменяя переданный React-элемент. */
export default function SlideItem({ child, isList, itemClassName, slideStyle }: SlideItemProps) {
	const Tag = isList ? "li" : "div";
	return <Tag className={itemClassName || undefined} style={slideStyle}>{child}</Tag>;
}
