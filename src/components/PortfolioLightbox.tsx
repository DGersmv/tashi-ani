"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type Item = { file: string; type: "image" | "video"; captionRu?: string; captionEn?: string };

export default function PortfolioLightbox({
  items,
  title = "Портфолио",
  description = "Нажмите, чтобы открыть галерею.",
  lang = "ru",
}: {
  items?: Item[];
  title?: string;
  description?: string;
  lang?: "ru" | "en";
}) {
  const [apiItems, setApiItems] = useState<Item[] | null>(items ?? null);
  const [loadingList, setLoadingList] = useState(!items);
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  // подгрузка (если items не передали)
  useEffect(() => {
    if (items) return;
    let c = false;
    (async () => {
      try {
        setLoadingList(true);
        const r = await fetch("/api/portfolio", { cache: "no-store" });
        const j = await r.json();
        if (!c) setApiItems(Array.isArray(j.items) ? j.items : []);
      } finally {
        if (!c) setLoadingList(false);
      }
    })();
    return () => { c = true; };
  }, [items]);

  const list = useMemo<Item[]>(() => items ?? apiItems ?? [], [items, apiItems]);
  useEffect(() => setI(0), [list.length]);

  // портал под модалку
  useEffect(() => {
    let el = document.getElementById("lightbox-portal-root");
    if (!el) {
      el = document.createElement("div");
      el.id = "lightbox-portal-root";
      document.body.appendChild(el);
    }
    setPortalEl(el);
  }, []);

  // блокируем скролл фона, пока открыта модалка
  useEffect(() => {
    if (!open) return;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    const prevPad  = document.body.style.paddingRight;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      document.body.style.paddingRight = prevPad;
    };
  }, [open]);

  const ready = !loadingList && list.length > 0;
  const cover = ready ? list[0] : undefined;
  const count = list.length;

  // ———— КАРТОЧКА ————
  return (
    <>
      <div
        className="
          relative overflow-hidden rounded-3xl
          border border-white/10 bg-white/10 backdrop-blur-xl
          shadow-[0_20px_60px_rgba(0,0,0,0.35)] cursor-pointer
        "
        style={{ height: "clamp(220px, 22vw, 320px)" }}     // никакого vh — аккуратная высота
        onClick={() => ready && setOpen(true)}
      >
        {/* фон без абсолютов — чтобы исключить «поехавшую» высоту */}
        {ready && cover ? (
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `url(${cover.file})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "saturate(105%) brightness(0.9)",
              transform: "scale(1)",
              transition: "transform .5s",
            }}
          />
        ) : (
          <div className="h-full w-full grid place-items-center bg-black/30">
            <div className="w-10 h-10 border-4 border-t-transparent border-white rounded-full animate-spin" />
          </div>
        )}
        {/* стеклянная вуаль + текст */}
        <div className="absolute inset-0 bg-black/35 rounded-3xl pointer-events-none" />
        <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl md:text-2xl font-bold text-white">{title}</h3>
            <span className="px-2 py-1 rounded-full bg-black/50 text-white text-xs md:text-sm">{count} файлов</span>
          </div>
          {description && <p className="text-sm md:text-base text-gray-200 max-w-[85%]">{description}</p>}
          <div className="self-end text-white/85 text-sm md:text-base">Нажмите, чтобы открыть →</div>
        </div>
      </div>

      {/* ———— ЛАЙТБОКС (ПОРТАЛ) ———— */}
      {portalEl && open && ready && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center"
          style={{ overscrollBehavior: "contain" }}  // отключаем scroll-chaining
          onClick={() => setOpen(false)}
          role="dialog" aria-modal="true"
        >
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black/50 rounded-full px-3 py-1"
            onClick={(e) => { e.stopPropagation(); setI((k) => (k - 1 + list.length) % list.length); }}
            aria-label="Предыдущее"
          >⟨</button>

          {/* медиа */}
          {list[i].type === "video" ? (
            <video
              key={list[i].file}
              src={list[i].file}
              className="max-h-[90vh] max-w-[92vw] object-contain rounded-xl shadow-xl"
              controls autoPlay loop playsInline
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              key={list[i].file}
              src={list[i].file}
              alt={list[i][lang === "ru" ? "captionRu" : "captionEn"] || "Изображение портфолио"}
              className="max-h-[90vh] max-w-[92vw] object-contain rounded-xl shadow-xl"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          <div className="mt-4 text-center text-gray-300 text-sm px-6">
            {list[i][lang === "ru" ? "captionRu" : "captionEn"] || list[i].file.replace(/^\/portfolio\//, "")}
          </div>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black/50 rounded-full px-3 py-1"
            onClick={(e) => { e.stopPropagation(); setI((k) => (k + 1) % list.length); }}
            aria-label="Следующее"
          >⟩</button>

          <button
            className="absolute top-4 right-4 text-white text-4xl bg-black/50 rounded-full px-3 py-1"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            aria-label="Закрыть"
          >✕</button>
        </div>,
        portalEl
      )}
    </>
  );
}
