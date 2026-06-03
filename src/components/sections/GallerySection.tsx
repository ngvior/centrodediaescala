"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { GalleryItem } from "@/lib/api";

const GALLERY_VISIBLE_INCREMENT = 20;

const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

interface GallerySectionProps {
  gallery: GalleryItem[];
  gallerySectionTitle: string;
  galleryFilterLabels: string[];
}

export function GallerySection({
  gallery,
  gallerySectionTitle,
  galleryFilterLabels,
}: GallerySectionProps) {
  const [activeFilter, setActiveFilter] = useState<string>(
    galleryFilterLabels[0] || "Todas",
  );
  const [visibleCount, setVisibleCount] = useState(GALLERY_VISIBLE_INCREMENT);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null,
  );

  // Filter gallery items based on the active selection
  // "Todas" is considered the default catch-all category (typically the first index)
  const isAllFilter = activeFilter === galleryFilterLabels[0];
  const filteredItems = isAllFilter
    ? gallery
    : gallery.filter(
        (item) => item.category.toLowerCase() === activeFilter.toLowerCase(),
      );
  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMoreItems = visibleCount < filteredItems.length;

  const handleFilterClick = (label: string) => {
    setActiveFilter(label);
    setVisibleCount(GALLERY_VISIBLE_INCREMENT);
    setSelectedItemIndex(null);
  };

  const handleShowMore = () => {
    setVisibleCount((count) =>
      Math.min(count + GALLERY_VISIBLE_INCREMENT, filteredItems.length),
    );
  };

  // Lightbox handlers
  const handleOpenLightbox = (index: number) => {
    setSelectedItemIndex(index);
  };

  const handleCloseLightbox = useCallback(() => {
    setSelectedItemIndex(null);
  }, []);

  const handlePrev = useCallback(() => {
    if (selectedItemIndex === null || visibleItems.length === 0) return;
    setSelectedItemIndex((prev) =>
      prev === null ? null : prev === 0 ? visibleItems.length - 1 : prev - 1,
    );
  }, [selectedItemIndex, visibleItems.length]);

  const handleNext = useCallback(() => {
    if (selectedItemIndex === null || visibleItems.length === 0) return;
    setSelectedItemIndex((prev) =>
      prev === null ? null : prev === visibleItems.length - 1 ? 0 : prev + 1,
    );
  }, [selectedItemIndex, visibleItems.length]);

  // Handle keyboard events inside the lightbox
  useEffect(() => {
    if (selectedItemIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseLightbox();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Prevent background scrolling when lightbox is open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedItemIndex, handleCloseLightbox, handlePrev, handleNext]);

  const selectedItem =
    selectedItemIndex !== null ? visibleItems[selectedItemIndex] : null;

  return (
    <section id="galeria" className="w-full overflow-x-hidden bg-white py-16">
      <div className="container px-4 md:px-6 mx-auto">
        <h2 className="text-3xl font-heading text-center mb-8 uppercase text-foreground">
          {gallerySectionTitle}
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 border-b border-[#e5e5e5] pb-4">
          {galleryFilterLabels.map((label) => {
            const isActive = label === activeFilter;
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleFilterClick(label)}
                className={`rounded-button px-4 py-2 font-bold uppercase text-sm transition-colors duration-300 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7e2e] focus-visible:ring-offset-2 ${
                  isActive
                    ? "bg-[#ff7e2e] text-white"
                    : "text-muted-foreground hover:bg-[#ff7e2e] hover:text-white"
                }`}
              >
                {label}
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
              {visibleItems.map((item, index) => (
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
                      width={640}
                      height={480}
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

      {hasMoreItems && (
        <div className="container mx-auto flex justify-center px-4 pt-10 md:px-6">
          <button
            type="button"
            onClick={handleShowMore}
            className="rounded-lg bg-[#ff7e2e] px-6 py-3 font-bold uppercase text-white transition-colors hover:bg-[#e86f24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7e2e] focus-visible:ring-offset-2"
          >
            Ver más
          </button>
        </div>
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
              handlePrev();
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
                priority
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
              handleNext();
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
              {selectedItemIndex + 1} de {visibleItems.length}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
