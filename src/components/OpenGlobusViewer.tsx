'use client';

import { useEffect, useRef, useState } from 'react';
import useTourPoints from '@/lib/useTourPoints';

// === ПАРАМЕТРЫ ПОВЕДЕНИЯ КАМЕРЫ ===
const MIN_DIST_M = 150;            // ближе — считаем шумом/кластером и перескакиваем дальше
const MAX_SCAN_AHEAD = 8;          // максимум точек вперёд, чтобы найти «далёкую»
const ALT_NEAR = 1_500;            // высота камеры для близких перелётов (м)
const ALT_FAR  = 220_000;          // высота камеры для дальних перелётов (м)
const LOOK_REL_DOWN = 0.03;        // «наклон вниз»: высота цели = EYE_ALT * 3%
const LOOK_AHEAD_MIN = 0.3;       // минимум «смотреть вперёд» (доля пути i→j)
const LOOK_AHEAD_MAX = 0.45;       // максимум «смотреть вперёд»
const DUR_MIN_MS = 3400;           // минимальная длительность полёта
const DUR_MAX_MS = 5200;           // максимальная длительность полёта
const PAUSE_NEAR_MS = 2500;         // пауза между близкими кадрами
const PAUSE_FAR_MS  = 1800;        // пауза между дальними кадрами

// Ресурсы
const DEFAULT_PATH = '/points/default.png';
const OG_MARKER    = '/external/og/lib/res/marker.png';

type TourPoint = { lon: number; lat: number; img?: string; name?: string };

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
const R_EARTH = 6371000; // м

function toRad(deg: number) { return deg * Math.PI / 180; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function smooth01(x: number) { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); }

// Гаверсин для оценки расстояния (метры)
function haversine(lon1: number, lat1: number, lon2: number, lat2: number) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s1 = Math.sin(dLat/2), s2 = Math.sin(dLon/2);
  const a = s1*s1 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * s2*s2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(a));
}

export default function OpenGlobusViewer({ ready = true }: { ready?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef     = useRef<any | null>(null);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tourPts = (useTourPoints() || []) as TourPoint[];
  const ptsRef  = useRef<TourPoint[]>([]);
  useEffect(() => { ptsRef.current = tourPts; }, [tourPts]);

  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Есть ли кастомная иконка пина
  const pinSrcRef = useRef<string>(OG_MARKER);
  useEffect(() => {
    let ignore = false;
    fetch(DEFAULT_PATH, { method: 'HEAD' })
      .then(r => { if (!ignore && r.ok) pinSrcRef.current = DEFAULT_PATH; })
      .catch(() => {});
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    let destroyed = false;

    const clearT = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

    (async () => {
      // ESM-импорт OpenGlobus (Globe/XYZ/Vector/Entity/LonLat используются в оф. примерах)
      const og: any = await import('../../public/external/og/lib/og.es.js');
      if (destroyed) return;
      const { Globe, XYZ, Vector, Entity, LonLat } = og || {};
      if (!Globe || !XYZ || !Vector || !Entity || !LonLat) {
        console.error('OpenGlobus ESM: отсутствуют классы', { Globe, XYZ, Vector, Entity, LonLat });
        return;
      }

      const dpr = clamp(window.devicePixelRatio || 1, 1, 2);

      // Базовый слой OSM
      const osm = new XYZ('osm', {
        isBaseLayer: true,
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        visibility: true,
        crossOrigin: 'anonymous',
        maxZoom: 19
      });

      // Векторный слой для маркеров
      const vect = new Vector('tour', { clampToGround: false, async: false, visibility: true });

      (ptsRef.current || []).forEach((p, idx) => {
        vect.add(new Entity({
          name: p.name || `P${idx + 1}`,
          lonlat: [p.lon, p.lat, 1],
          billboard: {
            src: p.img || pinSrcRef.current,
            width: 48,
            height: 48,
            offset: [0, 16], // приподнимаем, чтобы не «резало» низ
          }
        }));
      });

      // Инициализация глобуса
      const globe = new Globe({
        target: containerRef.current!,
        name: 'Earth',
        dpi: dpr,
        layers: [osm, vect],
        resourcesSrc: '/external/og/lib/res',
        fontsSrc: '/external/og/lib/res/fonts',
        maxLoading: 12
      });
      globeRef.current = globe;

      // Подгон под контейнер
      setTimeout(() => window.dispatchEvent(new Event('resize')), 0);

      // === Адаптивный перелёт ===
      let step = 0;

      const pickNextIndex = (i: number) => {
        const list = ptsRef.current;
        if (!list?.length) return i;
        // ищем следующую точку не ближе MIN_DIST_M
        for (let n = 1; n <= Math.min(MAX_SCAN_AHEAD, list.length - 1); n++) {
          const j = (i + n) % list.length;
          const d = haversine(list[i].lon, list[i].lat, list[j].lon, list[j].lat);
          if (d >= MIN_DIST_M) return j;
        }
        // если все рядом — берём ближайшую следующую
        return (i + 1) % list.length;
      };

      const fly = () => {
        if (destroyed || pausedRef.current || !globeRef.current) return;
        const list = ptsRef.current;
        if (!list?.length) return;

        const i = step % list.length;
        const j = pickNextIndex(i);

        const a = list[i], b = list[j];
        const dist = haversine(a.lon, a.lat, b.lon, b.lat);        // м
        const norm = smooth01((dist - MIN_DIST_M) / (500_000 - MIN_DIST_M)); // до ~500 км

        // 1) Высота камеры ~ от расстояния
        const EYE_ALT = lerp(ALT_NEAR, ALT_FAR, norm);

        // 2) Куда смотреть: немного вперёд по дуге i→j + «вниз»
        const t = lerp(LOOK_AHEAD_MIN, LOOK_AHEAD_MAX, norm);
        const lookLon = a.lon * (1 - t) + b.lon * t;
        const lookLat = a.lat * (1 - t) + b.lat * t;
        const lookAlt = Math.max(50, EYE_ALT * LOOK_REL_DOWN);

        // 3) Длительность/пауза — тоже от расстояния
        const duration = Math.round(lerp(DUR_MIN_MS, DUR_MAX_MS, norm));
        const pause    = Math.round(lerp(PAUSE_NEAR_MS, PAUSE_FAR_MS, norm));

        const camLL  = new LonLat(a.lon, a.lat, EYE_ALT);
        const lookLL = new LonLat(lookLon, lookLat, lookAlt);

        const ell = globeRef.current.planet.ellipsoid;
        globeRef.current.planet.camera.flyCartesian(
          ell.lonLatToCartesian(camLL),
          {
            look: ell.lonLatToCartesian(lookLL),
            duration,
            completeCallback: () => {
              if (destroyed || pausedRef.current) return;
              step = j;
              clearT();
              timerRef.current = setTimeout(fly, pause);
            }
          }
        );
      };

      // старт
      clearT();
      timerRef.current = setTimeout(fly, 500);
    })();

    return () => {
      destroyed = true;
      try { globeRef.current?.destroy?.(); } catch {}
      globeRef.current = null;
      clearT();
    };
  }, [ready, tourPts]);

  // Сняли паузу — мягкий рестарт
  useEffect(() => {
    if (!paused && !timerRef.current) {
      timerRef.current = setTimeout(() => {
        const evt = new Event('og:resume');
        window.dispatchEvent(evt);
      }, 200);
    }
  }, [paused]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 'inherit' }}>
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden' }}
      />
      <button
        onClick={() => setPaused(v => !v)}
        style={{
          position: 'absolute', bottom: 12, left: 12, padding: '8px 12px',
          borderRadius: 8, background: 'rgba(0,0,0,0.6)', color: '#fff',
          border: 'none', cursor: 'pointer', fontSize: 14, zIndex: 10
        }}
      >
        {paused ? 'Старт' : 'Пауза'}
      </button>
    </div>
  );
}
