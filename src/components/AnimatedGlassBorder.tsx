import { useEffect, useState, RefObject } from "react";
import { motion } from "framer-motion";

const BORDER_RADIUS = 42;
const BORDER_WIDTH = 5;

type AnimatedGlassBorderProps = {
  panelRef: RefObject<HTMLDivElement>;
  onComplete: () => void;
  duration?: number;
};

export default function AnimatedGlassBorder({
  panelRef,
  onComplete,
  duration = 2, // медленнее
}: AnimatedGlassBorderProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function updateSize() {
      if (panelRef.current) {
        const { width, height } = panelRef.current.getBoundingClientRect();
        setSize({ width, height });
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [panelRef]);

  const { width, height } = size;
  const r = BORDER_RADIUS;
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);

  const d = `
    M${r},0
    H${w - r}
    Q${w},0 ${w},${r}
    V${h - r}
    Q${w},${h} ${w - r},${h}
    H${r}
    Q0,${h} 0,${h - r}
    V${r}
    Q0,0 ${r},0
    Z
  `;

  return (
    <>
      {width > 0 && height > 0 && (
        <svg
          width={width}
          height={height}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          <defs>
            <linearGradient id="glassBorder" x1="0" y1="0" x2={width} y2={height} gradientUnits="userSpaceOnUse">
              <stop stopColor="#3ffdfd" />
              <stop offset="1" stopColor="#2afec3" />
            </linearGradient>
          </defs>
          <motion.path
            d={d}
            stroke="url(#glassBorder)"
            strokeWidth={BORDER_WIDTH}
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration, ease: "easeInOut" }}
            style={{
              filter: "drop-shadow(0 0 12px #09f6)",
            }}
            onAnimationComplete={onComplete}
          />
        </svg>
      )}
    </>
  );
}