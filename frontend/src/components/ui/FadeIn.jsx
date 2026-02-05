import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function FadeIn({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
  direction = "up", // 'up', 'down', 'left', 'right', 'none'
  distance = 24,
  threshold = 0.1,
  once = true,
}) {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  const getInitialPosition = () => {
    switch (direction) {
      case "up": return { y: distance };
      case "down": return { y: -distance };
      case "left": return { x: distance };
      case "right": return { x: -distance };
      default: return {};
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, once]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...getInitialPosition() }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...getInitialPosition() }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
