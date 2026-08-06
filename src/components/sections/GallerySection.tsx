"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { GalleryCategory, GalleryItem } from "@/lib/api";
import {
  buildGalleryFilterChips,
  filterByCategoryId,
} from "@/lib/gallery-filter";
import {
  GALLERY_PAGE_SIZE,
  clampPage,
  getPageCount,
  getPageForIndex,
  getPageItems,
  wrapIndex,
} from "@/lib/gallery-pagination";

const GALLERY_SECTION_ID = "galeria";

/**
 * Nominal box for a row stored before the browser started capturing dimensions.
 * It only decides how much space is reserved before the photo decodes — the
 * preview itself stays `h-auto object-contain` and is never cropped. Rows that
 * do carry dimensions reserve their real box, which is what stops the section
 * from jumping as images load.
 */
const FALLBACK_IMAGE_WIDTH = 640;
const FALLBACK_IMAGE_HEIGHT = 480;

const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

/**
 * Next lightbox position, plus the page that holds it.
 *
 * Module scope on purpose: both the arrow buttons and the keyboard handler need
 * this, and a stable identity is what keeps the keyboard effect from
 * re-subscribing on every render.
 */
function nextLightboxPosition(current: number, total: number, delta: 1 | -1) {
  const index = wrapIndex(current, total, delta);

  return { index, page: getPageForIndex(index) };
}

const PAGE_BUTTON_CLASSNAME =
  "inline-flex items-center gap-1.5 rounded-lg bg-[#ff7e2e] px-6 py-3 font-bold uppercase text-white transition-colors hover:bg-[#e86f24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7e2e] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40";

interface GallerySectionProps {
  gallery: GalleryItem[];
  gallerySectionTitle: string;
  /** Active categories, already in ascending chip order. */
  galleryCategories: GalleryCategory[];
  galleryAllFilterLabel: string;
}

export function GallerySection({
  gallery,
  gallerySectionTitle,
  galleryCategories,
  galleryAllFilterLabel,
}: GallerySectionProps) {
  /**
   * The selected category's identity, `null` for the catch-all chip.
   *
   * An id and not a label. A label is admin-editable text, so comparing it
   * against a photo's category name meant a rename emptied the chip it renamed:
   * the photos' resolved names moved while the stored label did not. `null`
   * cannot collide with a real id, which is why the catch-all needs no sentinel
   * string either.
   */
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  /** Absolute index into the filtered collection, not into the current page. */
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null,
  );

  const chips = buildGalleryFilterChips(
    galleryCategories,
    galleryAllFilterLabel,
  );
  const filteredItems = filterByCategoryId(gallery, activeCategoryId);
  // Read once as a primitive. The callbacks below depend on how many items the
  // filter matched, and depending on `filteredItems.length` instead would defeat
  // their memoization: the array is handed to imported helpers, so the React
  // Compiler has to assume those could mutate it.
  const filteredCount = filteredItems.length;

  const pageCount = getPageCount(filteredCount);
  // Clamped on read rather than corrected in an effect: the collection shrinks
  // under the visitor when a narrower category is selected, and a page index
  // past the end would otherwise render an empty grid for one frame.
  const currentPage = clampPage(page, filteredCount);
  const pageItems = getPageItems(filteredItems, currentPage);

  const handleFilterClick = (categoryId: string | null) => {
    setActiveCategoryId(categoryId);
    setPage(0);
    setSelectedItemIndex(null);
  };

  const goToPage = (nextPage: number) => {
    setPage(clampPage(nextPage, filteredCount));

    // The grid is replaced wholesale, so without this the visitor is left
    // standing in the middle of a page they never saw the start of. Animating
    // that jump is a preference, not a requirement, so it is skipped for anyone
    // who asked for less motion.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    document.getElementById(GALLERY_SECTION_ID)?.scrollIntoView({
      block: "start",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  // Lightbox handlers
  const handleOpenLightbox = (indexInPage: number) => {
    setSelectedItemIndex(currentPage * GALLERY_PAGE_SIZE + indexInPage);
  };

  const handleCloseLightbox = () => {
    setSelectedItemIndex(null);
  };

  /**
   * Walks the whole filtered collection, not just the visible page: paging keeps
   * the section short, and the lightbox is where a visitor who wants to see
   * everything gets to. The grid follows so closing the lightbox lands them on
   * the page holding the photo they were last looking at.
   */
  const stepLightbox = (delta: 1 | -1) => {
    if (selectedItemIndex === null || filteredCount === 0) {
      return;
    }

    const next = nextLightboxPosition(selectedItemIndex, filteredCount, delta);
    setSelectedItemIndex(next.index);
    setPage(next.page);
  };

  // Handle keyboard events inside the lightbox.
  //
  // Depends only on primitives and setters, never on the handlers above: those
  // are recreated every render, and listing them here would re-subscribe the
  // listener and re-apply the body scroll lock on each one.
  useEffect(() => {
    if (selectedItemIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedItemIndex(null);
        return;
      }

      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
        return;
      }

      const next = nextLightboxPosition(
        selectedItemIndex,
        filteredCount,
        e.key === "ArrowLeft" ? -1 : 1,
      );
      setSelectedItemIndex(next.index);
      setPage(next.page);
    };

    window.addEventListener("keydown", handleKeyDown);
    // Prevent background scrolling when lightbox is open.
    //
    // Written through setProperty/removeProperty rather than as an assignment to
    // `style.overflow`: the React Compiler's immutability rule reads assigning to
    // a property of a value from outside the component as mutating that value,
    // and rejects it even inside an effect. The method form expresses the same
    // inline-style write — `removeProperty` clears the declaration exactly as
    // assigning `""` did — and does not trip the rule.
    document.body.style.setProperty("overflow", "hidden");

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.removeProperty("overflow");
    };
  }, [selectedItemIndex, filteredCount]);

  const selectedItem =
    selectedItemIndex !== null
      ? (filteredItems[selectedItemIndex] ?? null)
      : null;

  return (
    <section
      id={GALLERY_SECTION_ID}
      className="w-full overflow-x-hidden bg-white py-16"
    >
      <div className="container px-4 md:px-6 mx-auto">
        <h2 className="text-3xl font-heading text-center mb-8 uppercase text-foreground">
          {gallerySectionTitle}
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 border-b border-[#e5e5e5] pb-4">
          {chips.map((chip) => {
            const isActive = chip.id === activeCategoryId;
            return (
              <button
                // The catch-all carries no id, and a label is not a key: two
                // categories may legitimately read the same.
                key={chip.id ?? "all"}
                type="button"
                onClick={() => handleFilterClick(chip.id)}
                className={`rounded-button px-4 py-2 font-bold uppercase text-sm transition-colors duration-300 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7e2e] focus-visible:ring-offset-2 ${
                  isActive
                    ? "bg-[#ff7e2e] text-white"
                    : "text-muted-foreground hover:bg-[#ff7e2e] hover:text-white"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-width grid with entry/exit transition effects */}
      <div className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay elementos disponibles en esta categoría.
          </div>
        ) : (
          <div className="columns-2 md:columns-4 gap-0 [column-fill:_balance] transition-all duration-500">
            <AnimatePresence mode="popLayout">
              {pageItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  variants={gridItemVariants}
                  layout
                  initial={{
                    opacity: 0,
                    y: 20,
                    scale: 0.98,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: -20,
                    scale: 0.98,
                  }}
                  transition={{
                    delay: index * 0.025,
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  className="break-inside-avoid bg-muted"
                >
                  <button
                    type="button"
                    onClick={() => handleOpenLightbox(index)}
                    className="relative group block w-full overflow-hidden cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7e2e] focus-visible:ring-offset-2"
                  >
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      width={item.width ?? FALLBACK_IMAGE_WIDTH}
                      height={item.height ?? FALLBACK_IMAGE_HEIGHT}
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="h-auto w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-center p-4">
                      <h4 className="font-heading text-[18px] leading-none font-bold text-[#222222] [margin:25px_0_20px] normal-case transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                        {item.title}
                      </h4>
                      <p className="font-sans text-[14px] leading-normal text-[#000000] normal-case transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                        {item.category}
                      </p>
                    </div>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/*
       * Pages replace each other instead of accumulating, so the section keeps a
       * bounded height no matter how many photos the admin loads.
       */}
      {pageCount > 1 && (
        <nav
          aria-label="Paginación de la galería"
          className="container mx-auto flex flex-wrap items-center justify-center gap-4 px-4 pt-10 md:px-6"
        >
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className={PAGE_BUTTON_CLASSNAME}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Anterior
          </button>

          <p
            aria-live="polite"
            className="text-sm font-bold uppercase text-muted-foreground"
          >
            Página {currentPage + 1} de {pageCount}
          </p>

          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === pageCount - 1}
            className={PAGE_BUTTON_CLASSNAME}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}

      {/* Modern Lightbox Modal */}
      {selectedItemIndex !== null && selectedItem && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm transition-opacity duration-300"
          onClick={handleCloseLightbox}
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleCloseLightbox}
            className="absolute top-4 right-4 z-50 p-3 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
            aria-label="Cerrar galería"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Previous image navigation */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              stepLightbox(-1);
            }}
            className="absolute left-4 p-3 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200 z-40"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          {/* Centered Image Container */}
          <div
            className="relative w-full max-w-[90vw] max-h-[75vh] md:max-h-[80vh] flex items-center justify-center select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-[75vh] md:h-[80vh] max-w-4xl">
              <Image
                src={selectedItem.image_url}
                alt={selectedItem.title}
                fill
                // `priority` is deprecated as of Next 16 in favour of `preload`.
                preload
                sizes="(min-width: 1200px) 1200px, 90vw"
                className="object-contain transition-all duration-300"
              />
            </div>
          </div>

          {/* Next image navigation */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              stepLightbox(1);
            }}
            className="absolute right-4 p-3 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200 z-40"
            aria-label="Siguiente imagen"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          {/* Bottom Caption and Index */}
          <div
            className="w-full max-w-xl text-center text-white mt-4 px-6 z-40"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-heading font-bold mb-1">
              {selectedItem.title}
            </h3>
            <p className="text-sm text-white/60 uppercase tracking-widest mb-2">
              {selectedItem.category}
            </p>
            <div className="text-xs text-white/40">
              {selectedItemIndex + 1} de {filteredCount}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
