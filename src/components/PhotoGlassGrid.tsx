// src/components/PhotoGlassGrid.tsx
"use client";

import React, { useEffect, useState } from "react";
import PhotoGlassPanel from "./PhotoGlassPanel";

type Item = { file: string; type: "image" | "video"; captionRu?: string; captionEn?: string };
type Project = { name: string; description?: string; items: Item[] };

export default function PhotoGlassGrid({ projects: initial }: { projects?: Project[] }) {
  const [projects, setProjects] = useState<Project[] | null>(initial ?? null);

  useEffect(() => {
    if (initial) return;
    let c = false;
    (async () => {
      try {
        const r = await fetch("/api/portfolio/projects", { cache: "no-store" });
        const j = await r.json();
        if (!c) setProjects(Array.isArray(j.projects) ? j.projects : []);
      } catch {
        if (!c) setProjects([]);
      }
    })();
    return () => { c = true; };
  }, [initial]);

  if (!projects) {
    return (
      <section className="mt-40 md:mt-44">
        <div className="mx-auto max-w-screen-2xl px-4 md:px-6">
          <div className="w-full h-[200px] rounded-xl border border-white/10 bg-white/10 backdrop-blur-xl grid place-items-center">
            <div className="w-10 h-10 border-4 border-t-transparent border-white rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (!projects.length) {
    return (
      <section className="mt-40 md:mt-44">
        <div className="mx-auto max-w-screen-2xl px-4 md:px-6 text-gray-300">
          Нет проектов в /public/portfolio.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-40 md:mt-44">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-6">
        {/* 1 / 2 / 3 колонки — штатный Responsive Tailwind */}
        <div
  className="
    grid gap-8 justify-center
    [grid-template-columns:repeat(auto-fit,minmax(280px,420px))]
  "
>
  {projects.map((p) => (
    <div key={p.name} className="w-full max-w-[420px]">
      <PhotoGlassPanel project={p} />
    </div>
  ))}
</div>

      </div>
    </section>
  );
}
