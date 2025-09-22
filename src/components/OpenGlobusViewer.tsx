'use client';

import { useEffect, useRef, useState } from 'react';
import useTourPoints from '@/lib/useTourPoints';

// ====== НАСТРОЙКИ ОРБИТЫ И ВЗГЛЯДА (РЕДАКТИРУЕМ В КОДЕ) ======
const CENTER_LON = 30.36;         // центр — Санкт-Петербург (можно поправить)
const CENTER_LAT = 59.94;

const EYE_ALT_M  = 10_000;        // высота зависания камеры (м)
const ORBIT_R_M  = 5_000;        // радиус орбиты (м) — расстояние от центра
const ORBIT_DEG_PER_SEC = 6;      // скорость вращения (град/сек)

const LOOK_REL_UP = 0.1;         // «поднять взгляд»: доля от высоты камеры (0..0.4)
const LOOK_AHEAD_M = 50_000;      // смотреть немного вперёд по курсу (м); 0 — строго в центр

const TICK_MS = 40;               // шаг обновления анимации (мс)

// ====== РЕСУРСЫ ======
const DEFAULT_PATH = '/points/default.png';
const OG_MARKER    = '/external/og/lib/res/marker.png';

type TourPoint = { lon: number; lat: number; img?: string; name?: string };

// ====== МАТЕМАТИКА ГЕОДЕЗИИ ======
const R_EARTH = 6371000;
const toRad = (d: number) => d * Math.PI / 180;
const toDeg = (r: number) => r * 180 / Math.PI;

// Смещение от (lon,lat) на distM по азимуту bearingDeg (0 — север, 90 — восток)
function destPoint(lon: number, lat: number, bearingDeg: number, distM: number) {
  const br = toRad(bearingDeg);
  const φ1 = toRad(lat);
  const λ1 = toRad(lon);
  const δ = distM / R_EARTH;

  const sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ), cosδ = Math.cos(δ);

  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(br);
  const φ2 = Math.asin(sinφ2);

  const y = Math.sin(br) * sinδ * cosφ1;
  const x = cosδ - sinφ1 * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  return { lon: (toDeg(λ2) + 540) % 360 - 180, lat: toDeg(φ2) };
}

export default function OpenGlobusViewer({ ready = true }: { ready?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef     = useRef<any | null>(null);
  const loopRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Точки (для пинов), без перелётов
  const tourPts = (useTourPoints() || []) as TourPoint[];
  const ptsRef  = useRef<TourPoint[]>([]);
  useEffect(() => { ptsRef.current = tourPts; }, [tourPts]);

  // Пауза анимации
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Кастомная иконка пина?
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

    const stopLoop = () => { if (loopRef.current) { clearTimeout(loopRef.current); loopRef.current = null; } };

    (async () => {
      const og: any = await import('../../public/external/og/lib/og.es.js');
      if (destroyed) return;
      const { Globe, XYZ, Vector, Entity, LonLat } = og || {};
      if (!Globe || !XYZ || !Vector || !Entity || !LonLat) {
        console.error('OpenGlobus ESM: отсутствуют классы', { Globe, XYZ, Vector, Entity, LonLat });
        return;
      }

      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

      // Слои
      const osm = new XYZ('osm', {
        isBaseLayer: true,
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        visibility: true,
        crossOrigin: 'anonymous',
        maxZoom: 19
      });
      const vect = new Vector('tour', { clampToGround: false, async: false, visibility: true });

      // Маркеры
      (ptsRef.current || []).forEach((p, idx) => {
        vect.add(new Entity({
          name: p.name || `P${idx + 1}`,
          lonlat: [p.lon, p.lat, 1],
          billboard: {
            src: p.img || pinSrcRef.current,
            width: 48,
            height: 48,
            offset: [0, 35],
          }
        }));
      });

      // Глобус
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

      // ===== Подлёт к СПб =====
      const ell = globe.planet.ellipsoid;

      const centerLL = new LonLat(CENTER_LON, CENTER_LAT, Math.max(200, EYE_ALT_M * Math.max(LOOK_REL_UP, 0.06)));
      const startAz  = 315; // северо-запад
      const eye0     = destPoint(CENTER_LON, CENTER_LAT, startAz, ORBIT_R_M);
      const eyeLL0   = new LonLat(eye0.lon, eye0.lat, EYE_ALT_M);

      await new Promise<void>((resolve) => {
        globe.planet.camera.flyCartesian(
          ell.lonLatToCartesian(eyeLL0),
          {
            look: ell.lonLatToCartesian(centerLL),
            duration: 2200,
            completeCallback: () => resolve()
          }
        );
      });

      // ===== Бесконечная орбита =====
      let angle = startAz;
      const stepDeg = ORBIT_DEG_PER_SEC * (TICK_MS / 1000);

      const tick = () => {
        if (destroyed || pausedRef.current || !globeRef.current) return;

        angle = (angle + stepDeg) % 360;

        // Позиция камеры по орбите
        const eyeGeo = destPoint(CENTER_LON, CENTER_LAT, angle, ORBIT_R_M);
        const eyeLL  = new og.LonLat(eyeGeo.lon, eyeGeo.lat, EYE_ALT_M);

        // Куда смотреть: вперёд по курсу или строго в центр
        let lookLon = CENTER_LON, lookLat = CENTER_LAT;
        if (LOOK_AHEAD_M > 0.1) {
          const ahead = destPoint(CENTER_LON, CENTER_LAT, angle, LOOK_AHEAD_M);
          lookLon = ahead.lon; lookLat = ahead.lat;
        }
        const lookLL = new og.LonLat(lookLon, lookLat, Math.max(50, EYE_ALT_M * LOOK_REL_UP));

        globeRef.current.planet.camera.flyCartesian(
          ell.lonLatToCartesian(eyeLL),
          {
            look: ell.lonLatToCartesian(lookLL),
            duration: TICK_MS,
            completeCallback: () => {
              if (!destroyed && !pausedRef.current) {
                loopRef.current = setTimeout(tick, 0);
              }
            }
          }
        );
      };

      loopRef.current = setTimeout(tick, 200);
    })();

    return () => {
      destroyed = true;
      try { globeRef.current?.destroy?.(); } catch {}
      globeRef.current = null;
      stopLoop();
    };
  }, [ready, tourPts]);

  // Сняли паузу — мягкий рестарт
  useEffect(() => {
    if (!paused && !loopRef.current) {
      loopRef.current = setTimeout(() => {
        const evt = new Event('og:resume');
        window.dispatchEvent(evt);
      }, 150);
    }
  }, [paused]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 'inherit' }}>
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden' }}
      />
      
    </div>
  );
}
