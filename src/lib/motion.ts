

export const EASE_OUT_SOFT = [0.32, 0.72, 0, 1] as const;

export const contentTransition = {
  duration: 0.28,
  ease: EASE_OUT_SOFT,
};

export const springSnappy = {
  type: "spring" as const,
  stiffness: 500,
  damping: 34,
  mass: 0.9,
};

export const springGentle = {
  type: "spring" as const,
  stiffness: 260,
  damping: 28,
};

export const viewEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: contentTransition,
};

export function stepVariants(direction: 1 | -1) {
  return {
    initial: { opacity: 0, x: direction * 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: direction * -16 },
    transition: contentTransition,
  };
}
