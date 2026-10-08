"use client";

import { useReducedMotion } from "framer-motion";

export function useMotionSafe() {
  const reduce = useReducedMotion();
  return {
    reduce: Boolean(reduce),
    spring: reduce ? { duration: 0.01 } : { type: "spring" as const, stiffness: 400, damping: 25 },
    fade: reduce ? { duration: 0 } : { duration: 0.45 },
  };
}
