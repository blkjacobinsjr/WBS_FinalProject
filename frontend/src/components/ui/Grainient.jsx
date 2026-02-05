import { useEffect, useRef, useState } from 'react';

export default function Grainient({ color1 = '#a855f7', color2 = '#ec4899', color3 = '#ddd6fe' }) {
  const containerRef = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check WebGL support first
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      setFallback(true);
      return;
    }

    let renderer, program, mesh, raf, ro;

    const init = async () => {
      try {
        const { Renderer, Program, Mesh, Triangle } = await import('ogl');
        const container = containerRef.current;
        if (!container) return;

        renderer = new Renderer({ webgl: 2, alpha: false, antialias: false, dpr: 0.5 });
        const glCtx = renderer.gl;
        glCtx.canvas.style.cssText = 'width:100%;height:100%;display:block';
        container.appendChild(glCtx.canvas);

        const hexToRgb = hex => {
          const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return r ? [parseInt(r[1], 16) / 255, parseInt(r[2], 16) / 255, parseInt(r[3], 16) / 255] : [1, 1, 1];
        };

        program = new Program(glCtx, {
          vertex: `#version 300 es
            in vec2 position;
            void main() { gl_Position = vec4(position, 0.0, 1.0); }`,
          fragment: `#version 300 es
            precision mediump float;
            uniform vec2 iResolution;
            uniform float iTime;
            uniform vec3 uColor1, uColor2, uColor3;
            out vec4 fragColor;
            void main() {
              vec2 uv = gl_FragCoord.xy / iResolution.xy;
              vec2 p = uv - 0.5;
              float t = iTime * 0.08;
              p.x += sin(p.y * 3.0 + t) * 0.03;
              p.y += cos(p.x * 3.0 + t) * 0.03;
              vec3 col = mix(mix(uColor3, uColor2, smoothstep(-0.2, 0.2, p.x)),
                             uColor1, smoothstep(0.0, -0.4, p.y));
              float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
              col += (grain - 0.5) * 0.06;
              fragColor = vec4(col, 1.0);
            }`,
          uniforms: {
            iTime: { value: 0 },
            iResolution: { value: new Float32Array([1, 1]) },
            uColor1: { value: new Float32Array(hexToRgb(color1)) },
            uColor2: { value: new Float32Array(hexToRgb(color2)) },
            uColor3: { value: new Float32Array(hexToRgb(color3)) },
          }
        });

        mesh = new Mesh(glCtx, { geometry: new Triangle(glCtx), program });

        const resize = () => {
          const { width, height } = container.getBoundingClientRect();
          renderer.setSize(width, height);
          program.uniforms.iResolution.value.set([glCtx.drawingBufferWidth, glCtx.drawingBufferHeight]);
        };

        ro = new ResizeObserver(resize);
        ro.observe(container);
        resize();

        const t0 = performance.now();
        let lastFrame = 0;
        const loop = t => {
          raf = requestAnimationFrame(loop);
          if (t - lastFrame < 41) return;
          lastFrame = t;
          program.uniforms.iTime.value = (t - t0) * 0.001;
          renderer.render({ scene: mesh });
        };
        raf = requestAnimationFrame(loop);
      } catch (e) {
        console.warn('Grainient WebGL failed, using CSS fallback', e);
        setFallback(true);
      }
    };

    init();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (renderer?.gl?.canvas?.parentNode) {
        renderer.gl.canvas.parentNode.removeChild(renderer.gl.canvas);
      }
    };
  }, [color1, color2, color3]);

  // CSS fallback gradient
  if (fallback) {
    return (
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${color3} 0%, ${color2} 50%, ${color1} 100%)`
        }}
      />
    );
  }

  return <div ref={containerRef} className="absolute inset-0" />;
}
