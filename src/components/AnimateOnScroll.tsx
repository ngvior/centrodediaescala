"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type AnimateOnScrollProps = {
	children: ReactNode;
	className?: string;
	animationClass: string; // e.g. 'animate-flip-in-y'
	delay?: string;
};

export function AnimateOnScroll({
	children,
	className = "",
	animationClass,
	delay = "0ms",
}: AnimateOnScrollProps) {
	const elementRef = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					observer.unobserve(entry.target);
				}
			},
			{
				threshold: 0.1, // Trigger when 10% of the element is visible
			},
		);

		if (elementRef.current) {
			observer.observe(elementRef.current);
		}

		return () => {
			observer.disconnect();
		};
	}, []);

	return (
		<div
			ref={elementRef}
			className={`${className} ${isVisible ? animationClass : "opacity-0"}`}
			style={{
				animationDelay: delay,
				animationFillMode: "both",
			}}
		>
			{children}
		</div>
	);
}
