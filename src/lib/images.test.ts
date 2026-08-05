import { describe, it, expect } from "vitest";

import { planCropDraw } from "@/lib/images";

describe("planCropDraw", () => {
	const image = { width: 2000, height: 1500 };

	it("keeps a crop that already fits under the max edge at its natural size", () => {
		const plan = planCropDraw({ x: 10, y: 20, width: 400, height: 400 }, image, 512);

		expect(plan).toEqual({
			source: { x: 10, y: 20, width: 400, height: 400 },
			canvasWidth: 400,
			canvasHeight: 400,
		});
	});

	it("scales a large crop down to the max edge preserving its ratio", () => {
		const plan = planCropDraw({ x: 0, y: 0, width: 1200, height: 600 }, image, 512);

		expect(plan.canvasWidth).toBe(512);
		expect(plan.canvasHeight).toBe(256);
	});

	it("rounds fractional selections to whole pixels", () => {
		const plan = planCropDraw(
			{ x: 10.4, y: 20.6, width: 300.5, height: 300.5 },
			image,
			512,
		);

		expect(plan.source).toEqual({ x: 10, y: 21, width: 301, height: 301 });
	});

	it("clamps a selection that overflows the right edge", () => {
		const plan = planCropDraw({ x: 1900, y: 0, width: 400, height: 400 }, image);

		expect(plan.source.x).toBe(1900);
		expect(plan.source.width).toBe(100);
	});

	it("clamps a selection that overflows the bottom edge", () => {
		const plan = planCropDraw({ x: 0, y: 1400, width: 400, height: 400 }, image);

		expect(plan.source.y).toBe(1400);
		expect(plan.source.height).toBe(100);
	});

	it("clamps negative offsets to the image origin", () => {
		const plan = planCropDraw({ x: -30, y: -12, width: 400, height: 400 }, image);

		expect(plan.source.x).toBe(0);
		expect(plan.source.y).toBe(0);
	});

	it("never returns a zero-sized source or canvas", () => {
		const plan = planCropDraw({ x: 0, y: 0, width: 0, height: 0 }, image);

		expect(plan.source.width).toBe(1);
		expect(plan.source.height).toBe(1);
		expect(plan.canvasWidth).toBe(1);
		expect(plan.canvasHeight).toBe(1);
	});

	it("handles a square crop of a square source at the max edge exactly", () => {
		const plan = planCropDraw(
			{ x: 0, y: 0, width: 512, height: 512 },
			{ width: 512, height: 512 },
			512,
		);

		expect(plan).toEqual({
			source: { x: 0, y: 0, width: 512, height: 512 },
			canvasWidth: 512,
			canvasHeight: 512,
		});
	});
});
