"use client"

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { GalleryItem } from "@/lib/api";

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
    galleryFilterLabels[0] || "Todas"
  );
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  // Filter gallery items based on the active selection
  // "Todas" is considered the default catch-all category (typically the first index)
  const isAllFilter = activeFilter === galleryFilterLabels[0];
  const filteredItems = isAllFilter
    ? gallery
    : gallery.filter(
        (item) => item.category.toLowerCase() === activeFilter.toLowerCase()
      );

  // Lightbox handlers
  const handleOpenLightbox = (index: number) => {
    setSelectedItemIndex(index);
  };

  const handleCloseLightbox = useCallback(() => {
    setSelectedItemIndex(null);
  }, []);

  const handlePrev = useCallback(() => {
    if (selectedItemIndex === null) return;
    setSelectedItemIndex((prev) =>
      prev === null ? null : prev === 0 ? filteredItems.length - 1 : prev - 1
    );
  }, [selectedItemIndex, filteredItems.length]);

  const handleNext = useCallback(() => {
    if (selectedItemIndex === null) return;
    setSelectedItemIndex((prev) =>
      prev === null ? null : prev === filteredItems.length - 1 ? 0 : prev + 1
    );
  }, [selectedItemIndex, filteredItems.length]);

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

  return (
    <section id="galeria" className="w-full py-16 bg-white">
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
                onClick={() => {
                  setActiveFilter(label);
                  setSelectedItemIndex(null); // Close or reset lightbox indexing if filter changes
                }}
                className={`px-4 py-2 font-bold uppercase text-sm transition-all duration-300 border-b-2 hover:text-primary ${
                  isActive
                    ? "text-[#111111] border-primary"
                    : "text-muted-foreground border-transparent"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Grid with entry transition effect */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay elementos disponibles en esta categoría.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-500">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handleOpenLightbox(index)}
                className="relative group overflow-hidden bg-muted aspect-square cursor-zoom-in rounded shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-primary/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <ZoomIn className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-white mt-0 mb-1 font-heading text-lg font-bold transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                    {item.title}
                  </h4>
                  <p className="text-white/80 text-xs uppercase tracking-wider transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-100">
                    {item.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modern Lightbox Modal */}
      {selectedItemIndex !== null && filteredItems[selectedItemIndex] && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm transition-opacity duration-300"
          onClick={handleCloseLightbox}
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <button
            onClick={handleCloseLightbox}
            className="absolute top-4 right-4 z-50 p-3 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
            aria-label="Cerrar galería"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Previous image navigation */}
          <button
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
                src={filteredItems[selectedItemIndex].image_url}
                alt={filteredItems[selectedItemIndex].title}
                fill
                priority
                sizes="(min-width: 1200px) 1200px, 90vw"
                className="object-contain transition-all duration-300"
              />
            </div>
          </div>

          {/* Next image navigation */}
          <button
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
              {filteredItems[selectedItemIndex].title}
            </h3>
            <p className="text-sm text-white/60 uppercase tracking-widest mb-2">
              {filteredItems[selectedItemIndex].category}
            </p>
            <div className="text-xs text-white/40">
              {selectedItemIndex + 1} de {filteredItems.length}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
