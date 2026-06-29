"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

type ObjectiveCardProps = {
	title: string;
	description: string;
	delay: string;
	colors: { hex: string; borderClass: string; textClass: string };
};

export function ObjectiveCard({
	title,
	description,
	delay,
	colors,
}: ObjectiveCardProps) {
	const cardRef = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					if (cardRef.current) {
						observer.unobserve(cardRef.current);
					}
				}
			},
			{ threshold: 0.1 },
		);

		if (cardRef.current) {
			observer.observe(cardRef.current);
		}

		return () => observer.disconnect();
	}, []);

	return (
		<div ref={cardRef} className="text-center group">
			{/* Icon Circle */}
			<div
				className={`mx-auto w-[90px] h-[90px] rounded-full border-[3px] border-white flex items-center justify-center mb-6 shadow-md transition-all duration-300 hover:scale-110 ${
					isVisible ? "animate-legacy-zoom-in" : "opacity-0"
				}`}
				style={{
					backgroundColor: colors.hex,
					animationDelay: delay,
					animationFillMode: "both",
				}}
			>
				<Check className="h-8 w-8 text-white" />
			</div>

			{/* Title */}
			<h3
				className={`mb-4 text-xl font-bold animate-legacy-fade-in-up ${
					isVisible ? "animate-legacy-fade-in-up" : "opacity-0"
				}`}
				style={{
					animationDelay: delay,
					animationFillMode: "both",
				}}
			>
				{title}
			</h3>

			{/* Description */}
			<p
				className={`text-[16px] leading-[26px] text-escala-gray ${
					isVisible ? "animate-legacy-fade-in-down" : "opacity-0"
				}`}
				style={{
					animationDelay: delay,
					animationFillMode: "both",
				}}
			>
				{description}
			</p>
		</div>
	);
}
