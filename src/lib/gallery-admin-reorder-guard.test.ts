import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/*
  This guards DATA INTEGRITY, not styling.

  `reorderRecords` derives every `order_index` from the position of the id in
  the array it receives, and compacts the result to `0..ids.length-1`.
  `useReorder` hands it the rendered id array verbatim. So a drag inside a
  filtered list renumbers only the visible subset into that short range while
  every row the filter hid keeps its old index — the stored order of photos the
  administrator cannot see is corrupted, silently, with nothing on screen to
  show it happened.

  The component therefore renders two different tables: plain rows with no drag
  handle while a category filter is active, and the sortable wrapper only on the
  unfiltered list. Reinstating the sortable wrapper inside the filtered branch
  brings the corruption back. Vitest runs on `node` and collects only `.test.ts`
  files under `src`, so the component cannot be rendered here; the source of the
  filtered branch is asserted instead.
*/

const FILTERED_BRANCH_MARKER = "No hay imágenes para este filtro.";
const FILTERED_BRANCH_START = "selectedCategory ? (";
const BRANCH_SEPARATOR = ") : (";

function readProjectFile(filePath: string) {
	return readFileSync(path.join(process.cwd(), filePath), "utf8");
}

function splitGalleryTableBranches(componentSource: string) {
	const markerIndex = componentSource.indexOf(FILTERED_BRANCH_MARKER);
	expect(
		markerIndex,
		`Could not find the filtered branch marker ${FILTERED_BRANCH_MARKER}. This test cannot locate the branch it guards — re-anchor it instead of deleting it.`,
	).toBeGreaterThan(-1);

	const startIndex = componentSource.lastIndexOf(
		FILTERED_BRANCH_START,
		markerIndex,
	);
	expect(
		startIndex,
		`Could not find the ${FILTERED_BRANCH_START} ternary that opens the filtered branch. This test cannot locate the branch it guards — re-anchor it instead of deleting it.`,
	).toBeGreaterThan(-1);

	const separatorIndex = componentSource.indexOf(BRANCH_SEPARATOR, markerIndex);
	expect(
		separatorIndex,
		`Could not find the ${BRANCH_SEPARATOR} separator that closes the filtered branch. This test cannot locate the branch it guards — re-anchor it instead of deleting it.`,
	).toBeGreaterThan(-1);

	return {
		filteredBranch: componentSource.slice(startIndex, separatorIndex),
		unfilteredBranch: componentSource.slice(separatorIndex),
	};
}

describe("gallery admin reorder guard", () => {
	it("renders the filtered list without any drag-to-reorder wiring", () => {
		const { filteredBranch } = splitGalleryTableBranches(
			readProjectFile("src/components/admin/gallery-admin.tsx"),
		);

		expect(filteredBranch).not.toContain("SortableTable");
		expect(filteredBranch).not.toContain("SortableTableRows");
		expect(filteredBranch).not.toContain("onReorder");
		expect(filteredBranch).toContain("handle={null}");
	});

	// Deleting the ternary altogether would satisfy the assertions above while
	// making every list sortable again, so the other half of the branch is
	// asserted too: reordering must stay reachable, and only from here.
	it("keeps drag-to-reorder on the unfiltered list", () => {
		const { unfilteredBranch } = splitGalleryTableBranches(
			readProjectFile("src/components/admin/gallery-admin.tsx"),
		);

		expect(unfilteredBranch).toContain("<SortableTable");
		expect(unfilteredBranch).toContain("onReorder={handleReorder}");
		expect(unfilteredBranch).toContain("<SortableTableRows />");
	});
});
