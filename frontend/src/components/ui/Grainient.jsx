import { useEffect, useRef, useState } from 'react';

export default function Grainient() {
  const containerRef = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) { setFallback(true); return; }

    let renderer, program, mesh, raf, ro;

    const init = async () => {
      try {
        const { Renderer, Program, Mesh, Triangle } = await import('ogl');
        const container = containerRef.current;
        if (!container) return;

        // Full resolution for crisp grain
        renderer = new Renderer({ webgl: 2, alpha: false, antialias: false, dpr: 1 });
        const glCtx = renderer.gl;
        glCtx.canvas.style.cssText = 'width:100%;height:100%;display:block';
        container.appendChild(glCtx.canvas);

        program = new Program(glCtx, {
          vertex: `#version 300 es
            in vec2 position;
            void main() { gl_Position = vec4(position, 0.0, 1.0); }`,
          fragment: `#version 300 es
            precision highp float;
            uniform vec2 iResolution;
            uniform float iTime;
            out vec4 fragColor;

            void main() {
              vec2 uv = gl_FragCoord.xy / iResolution.xy;
              vec2 p = uv - 0.5;
              float t = iTime * 0.05;

              // Gentle warp
              p.x += sin(p.y * 2.5 + t) * 0.02;
              p.y += cos(p.x * 2.5 + t) * 0.02;

              // Soft purple-lavender palette (less pink)
              vec3 c1 = vec3(0.92, 0.90, 0.98);  // soft lavender white
              vec3 c2 = vec3(0.76, 0.68, 0.90);  // muted purple
              vec3 c3 = vec3(0.60, 0.50, 0.78);  // deeper purple

              // Blend - more purple, less pink
              float blend = smoothstep(-0.4, 0.4, p.x + p.y * 0.5);
              vec3 col = mix(c1, mix(c2, c3, smoothstep(-0.2, 0.3, p.y)), blend);

              // Fine film grain (high frequency, low amplitude)
              vec2 grainUV = gl_FragCoord.xy;
              float grain = fract(sin(dot(grainUV, vec2(12.9898, 78.233))) * 43758.5453);
              grain = (grain - 0.5) * 0.035;  // subtle
              col += grain;

              fragColor = vec4(col, 1.0);
            }`,
          uniforms: {
            iTime: { value: 0 },
            iResolution: { value: new Float32Array([1, 1]) },
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
          if (t - lastFrame < 50) return; // 20fps - slow dreamy movement
          lastFrame = t;
          program.uniforms.iTime.value = (t - t0) * 0.001;
          renderer.render({ scene: mesh });
        };
        raf = requestAnimationFrame(loop);
      } catch (e) {
        setFallback(true);
      }
    };

    init();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (renderer?.gl?.canvas?.parentNode) renderer.gl.canvas.parentNode.removeChild(renderer.gl.canvas);
    };
  }, []);

  if (fallback) {
    return (
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, #ebe8f4 0%, #c4b5e0 50%, #9987c4 100%)'
      }} />
    );
  }

  return <div ref={containerRef} className="absolute inset-0" />;
}
