import { motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

type StartupScreenProps = { onComplete: () => void };

const easeOut: [number, number, number, number] = [0.22, 0.08, 0.24, 1];

/** App-local state makes this run once for each newly created WebApp document. */
export function StartupScreen({ onComplete }: StartupScreenProps) {
  const reducedMotion = useReducedMotion();
  const duration = reducedMotion ? 220 : 1450;

  useEffect(() => {
    const timer = window.setTimeout(onComplete, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <motion.div
      className="startup-screen"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.16 : 0.24, ease: easeOut }}
      onAnimationComplete={() => undefined}
    >
      <motion.div
        className="startup-screen__brand"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reducedMotion ? 0.16 : 0.46, ease: easeOut }}
      >
        <div className="startup-screen__mark" aria-hidden>G</div>
        <motion.p
          className="startup-screen__title"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0.16 : 0.32, delay: reducedMotion ? 0.04 : 0.38, ease: easeOut }}
        >
          GHOSTEEK ROYALE
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
