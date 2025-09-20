"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";

type Item = { file: string; type: "image" | "video"; captionRu?: string; captionEn?: string };

export default function PortfolioExpandablePanel({
  title = "Портфолио",
  description,
  lang = "ru",
  items,
  variant = "panel", // 'panel' | 'card'
}: {
  title?: string;
  description?: string;
  lang?: "ru" | "en";
  items?: Item[];
  variant?: "panel" | "card";
}) {
  const [list] = useState<Item[]>(items ?? []);
  const [expanded, setExpanded] = useState(false);
  const [index, setIndex] = useState(0);
  const [mediaLoading, setMediaLoading] = useState(false);

  const hasItems = list.length > 0;
  const first = useMemo(() => (hasItems ? list[0] : null), [hasItems, list]);
  const current = useMemo(() => (hasItems ? list[index] : null), [hasItems, list, index]);

  const prev = useCallback(() => {
    if (!hasItems) return;
    setMediaLoading(true);
    setIndex((i) => (i - 1 + list.length) % list.length);
  }, [hasItems, list.length]);

  const next = useCallback(() => {
    if (!hasItems) return;
    setMediaLoading(true);
    setIndex((i) => (i + 1) % list.length);
  }, [hasItems, list.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!expanded) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, prev, next]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => next(),
    onSwipedRight: () => prev(),
    trackMouse: true,
  });

  const glass =
    "relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]";

  const headerHeight = variant === "card" ? "h-[220px] md:h-[260px]" : "h-[260px] md:h-[300px]";
  const viewerH = variant === "card" ? "h-[46vh] md:h-[56vh]" : "h-[56vh] md:h-[68vh]";
  const showDesc = description ?? (variant === "panel" ? "Подборка работ. Нажмите, чтобы развернуть." : undefined);
  const count = list.length;

  return (
    <motion.div layout className={glass} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      {/* COLLAPSED header */}
      <motion.button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="group relative w-full text-left"
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
        <div className={`relative ${headerHeight} overflow-hidden rounded-3xl`}>
          {first && first.type === "image" ? (
            <img
              src={first.file}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-[1.03] transition-transform duration-700"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/60" />
          )}
          <div className="absolute inset-0 bg-black/30" />

          <div className="relative z-10 p-5 md:p-8 pr-24">
            <h3 className="text-2xl md:text-3xl font-bold text-white">{title}</h3>
            {showDesc && <p className="mt-2 text-sm md:text-base text-gray-200 max-w-3xl">{showDesc}</p>}
          </div>

          <div className="absolute right-4 top-4 z-10">
            <span className="px-2 py-1 rounded-full bg-black/50 text-white text-xs md:text-sm">{count} файлов</span>
          </div>

          <div className="absolute right-4 bottom-4 z-10 text-white/80 text-sm md:text-base">
            {expanded ? "Свернуть" : "Нажмите, чтобы развернуть"}
          </div>
        </div>
      </motion.button>

      {/* EXPANDED viewer */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="viewer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="border-t border-white/10"
          >
            <div {...swipeHandlers} className={`relative bg-black/30 grid place-items-center ${viewerH}`}>
              {!current && (
                <div className="w-14 h-14 border-4 border-t-transparent border-white rounded-full animate-spin" />
              )}

              {current && (
                <>
                  {current.type === "video" ? (
                    <video
                      key={current.file}
                      src={current.file}
                      className="max-h-[90%] max-w-[92%] object-contain rounded-xl shadow-xl"
                      controls
                      playsInline
                      onLoadedData={() => setMediaLoading(false)}
                    />
                  ) : (
                    <img
                      key={current.file}
                      src={current.file}
                      alt={current[lang === "ru" ? "captionRu" : "captionEn"] || "Изображение портфолио"}
                      className="max-h-[90%] max-w-[92%] object-contain rounded-xl shadow-xl"
                      onLoad={() => setMediaLoading(false)}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.png"; setMediaLoading(false); }}
                    />
                  )}

                  {mediaLoading && (
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin" />
                    </div>
                  )}
                </>
              )}

              <button
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 text-white text-3xl md:text-4xl bg-black/40 hover:bg-black/60 rounded-full px-3 py-1 md:px-4 md:py-2 transition-transform active:scale-95"
                aria-label="Предыдущее"
                onClick={prev}
              >⟨</button>
              <button
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 text-white text-3xl md:text-4xl bg-black/40 hover:bg-black/60 rounded-full px-3 py-1 md:px-4 md:py-2 transition-transform active:scale-95"
                aria-label="Следующее"
                onClick={next}
              >⟩</button>
            </div>

            {current && (
              <div className="px-5 md:px-8 py-4 text-center text-gray-200 text-sm">
                {current[lang === "ru" ? "captionRu" : "captionEn"] || current.file.replace(/^\/portfolio\//, "")}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
