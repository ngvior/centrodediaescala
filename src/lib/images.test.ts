import { describe, it, expect } from "vitest";

import {
	ALLOWED_IMAGE_MIME_TYPES,
	GALLERY_OUTPUT_MAX_EDGE,
	isOptimizableImageType,
	planCropDraw,
	planFullFrameResize,
} from "@/lib/images";

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

describe("planFullFrameResize", () => {
	it("reads the whole frame, never a sub-region", () => {
		const plan = planFullFrameResize({ width: 4000, height: 3000 }, 2048);

		expect(plan.source).toEqual({ x: 0, y: 0, width: 4000, height: 3000 });
	});

	it("scales a landscape photo down to the max edge preserving its ratio", () => {
		const plan = planFullFrameResize({ width: 4000, height: 3000 }, 2048);

		expect(plan.canvasWidth).toBe(2048);
		expect(plan.canvasHeight).toBe(1536);
	});

	it("scales a portrait photo by its long edge, which is the height", () => {
		const plan = planFullFrameResize({ width: 3000, height: 4000 }, 2048);

		expect(plan.canvasHeight).toBe(2048);
		expect(plan.canvasWidth).toBe(1536);
	});

	// The gallery renders previews uncropped, so a resize that drifted off the
	// source ratio would letterbox or squash the photo on the public site.
	it("never upscales an image already smaller than the max edge", () => {
		const plan = planFullFrameResize({ width: 800, height: 600 }, 2048);

		expect(plan.canvasWidth).toBe(800);
		expect(plan.canvasHeight).toBe(600);
	});

	it("defaults to the gallery max edge", () => {
		const plan = planFullFrameResize({ width: 8000, height: 8000 });

		expect(plan.canvasWidth).toBe(GALLERY_OUTPUT_MAX_EDGE);
		expect(plan.canvasHeight).toBe(GALLERY_OUTPUT_MAX_EDGE);
	});
});

describe("isOptimizableImageType", () => {
	it("accepts the still formats the gallery re-encodes", () => {
		expect(isOptimizableImageType("image/jpeg")).toBe(true);
		expect(isOptimizableImageType("image/png")).toBe(true);
		expect(isOptimizableImageType("image/webp")).toBe(true);
	});

	// A canvas re-encode keeps only the first frame, so an animated GIF would
	// silently lose its animation. It stays on the plain upload path instead.
	it("rejects GIF so an animated upload is never flattened", () => {
		expect(isOptimizableImageType("image/gif")).toBe(false);
	});

	it("rejects a type the upload does not accept at all", () => {
		expect(isOptimizableImageType("image/avif")).toBe(false);
		expect(ALLOWED_IMAGE_MIME_TYPES).not.toContain("image/avif");
	});
});
