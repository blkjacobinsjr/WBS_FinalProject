import { useRef, useEffect, useState } from 'react';

export default function BlurText({ text = '', delay = 50, className = '' }) {
  const words = text.split(' ');
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <p ref={ref} className={`flex flex-wrap justify-center ${className}`}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block transition-all duration-500"
          style={{
            opacity: inView ? 1 : 0,
            filter: inView ? 'blur(0px)' : 'blur(8px)',
            transform: inView ? 'translateY(0)' : 'translateY(-10px)',
            transitionDelay: `${i * delay}ms`,
          }}
        >
          {word}&nbsp;
        </span>
      ))}
    </p>
  );
}
