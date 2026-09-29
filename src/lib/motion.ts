/**
 * Tokens de movimiento compartidos por toda la app.
 *
 * Filosofía (inspirada en el trabajo de Emil Kowalski sobre animación de
 * interfaces — Vaul, Sonner): el movimiento responde a una acción de la
 * persona (abrir, confirmar, cambiar de paso) y no decora contenido
 * estático. Se prefiere UNA transición orquestada por vista sobre efectos
 * repetidos en cada tarjeta/elemento. Los easings son "salidas rápidas,
 * llegadas suaves" (ease-out con algo de overshoot en springs), nunca
 * curvas lineales ni el ease-in-out por defecto del navegador.
 */

/** Curva usada por Vaul para el drawer: entra rápido, se asienta suave. */
export const EASE_OUT_SOFT = [0.32, 0.72, 0, 1] as const;

/** Para transiciones de contenido (paso a paso, fade entre vistas). */
export const contentTransition = {
  duration: 0.28,
  ease: EASE_OUT_SOFT,
};

/** Spring "táctil" tipo Sonner: llega rápido, un mínimo de rebote, sin oscilar. */
export const springSnappy = {
  type: "spring" as const,
  stiffness: 500,
  damping: 34,
  mass: 0.9,
};

/** Spring un poco más suave, para paneles/entradas grandes. */
export const springGentle = {
  type: "spring" as const,
  stiffness: 260,
  damping: 28,
};

/** Entrada única de una vista completa (login, paneles). Un solo momento, no por elemento. */
export const viewEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: contentTransition,
};

/** Deslizamiento horizontal entre pasos (encuesta). */
export function stepVariants(direction: 1 | -1) {
  return {
    initial: { opacity: 0, x: direction * 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: direction * -16 },
    transition: contentTransition,
  };
}
