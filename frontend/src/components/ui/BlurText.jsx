import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function BlurText({
  text = "",
  delay = 50,
  className = "",
  animateBy = "words", // 'words' or 'characters'
  direction = "top", // 'top' or 'bottom'
  threshold = 0.1,
  rootMargin = "0px",
  animationFrom,
  animationTo,
  easing = [0.25, 0.4, 0.25, 1],
  onAnimationComplete,
}) {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  const defaultFrom = direction === "top"
    ? { filter: "blur(10px)", opacity: 0, y: -20 }
    : { filter: "blur(10px)", opacity: 0, y: 20 };

  const defaultTo = { filter: "blur(0px)", opacity: 1, y: 0 };

  const from = animationFrom || defaultFrom;
  const to = animationTo || defaultTo;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <p ref={ref} className={`flex flex-wrap ${className}`}>
      {elements.map((el, i) => (
        <motion.span
          key={i}
          initial={from}
          animate={inView ? to : from}
          transition={{
            duration: 0.5,
            delay: i * (delay / 1000),
            ease: easing,
          }}
          onAnimationComplete={
            i === elements.length - 1 ? onAnimationComplete : undefined
          }
          style={{ display: "inline-block", willChange: "transform, filter, opacity" }}
        >
          {el}
          {animateBy === "words" && i < elements.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </p>
  );
}
