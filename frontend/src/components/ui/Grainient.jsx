import { useEffect, useRef, useState } from 'react';

export default function Grainient() {
  const containerRef = useRef(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Mobile Safari can flicker/black-flash with fixed WebGL layers while scrolling.
    // Use the static gradient fallback on small screens for stable rendering.
    if (window.matchMedia("(max-width: 768px)").matches) {
      setFallback(true);
      return;
    }

    const testCanvas = document.createElement('canvas');
    const testGl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
    if (!testGl) { setFallback(true); return; }

    let renderer, program, mesh, raf, ro;

    const init = async () => {
      try {
        const { Renderer, Program, Mesh, Triangle } = await import('ogl');
        const container = containerRef.current;
        if (!container) return;

        renderer = new Renderer({ webgl: 2, alpha: false, antialias: false, dpr: 1 });
        const gl = renderer.gl;
        gl.canvas.style.cssText = 'width:100%;height:100%;display:block';
        container.appendChild(gl.canvas);

        // Based on ReactBits Grainient with adjusted colors
        program = new Program(gl, {
          vertex: `#version 300 es
            in vec2 position;
            void main() { gl_Position = vec4(position, 0.0, 1.0); }`,
          fragment: `#version 300 es
            precision highp float;
            uniform vec2 iResolution;
            uniform float iTime;
            out vec4 fragColor;

            mat2 Rot(float a) { float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }

            vec2 hash(vec2 p) {
              p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
              return fract(sin(p)*43758.5453);
            }

            float noise(vec2 p) {
              vec2 i = floor(p), f = fract(p);
              vec2 u = f*f*(3.0-2.0*f);
              return mix(
                mix(dot(-1.0+2.0*hash(i), f), dot(-1.0+2.0*hash(i+vec2(1,0)), f-vec2(1,0)), u.x),
                mix(dot(-1.0+2.0*hash(i+vec2(0,1)), f-vec2(0,1)), dot(-1.0+2.0*hash(i+vec2(1,1)), f-vec2(1,1)), u.x),
                u.y
              ) * 0.5 + 0.5;
            }

            void main() {
              vec2 uv = gl_FragCoord.xy / iResolution.xy;
              float ratio = iResolution.x / iResolution.y;
              vec2 tuv = uv - 0.5;
              float t = iTime * 0.06;

              // Rotation based on noise
              float degree = noise(vec2(t*0.1, tuv.x*tuv.y) * 2.0);
              tuv.y *= 1.0/ratio;
              tuv *= Rot(radians((degree-0.5)*400.0 + 180.0));
              tuv.y *= ratio;

              // Warp
              tuv.x += sin(tuv.y * 4.0 + t) / 50.0;
              tuv.y += sin(tuv.x * 6.0 + t) / 25.0;

              // Colors: lavender, soft purple, baby blue
              vec3 colLav = vec3(0.94, 0.92, 0.98);   // soft lavender
              vec3 colPurple = vec3(0.68, 0.58, 0.84); // muted purple
              vec3 colBlue = vec3(0.72, 0.85, 0.96);   // baby blue

              // Three-way blend
              vec3 layer1 = mix(colBlue, colPurple, smoothstep(-0.3, 0.2, tuv.x));
              vec3 layer2 = mix(colPurple, colLav, smoothstep(-0.3, 0.2, tuv.x));
              vec3 col = mix(layer1, layer2, smoothstep(0.2, -0.3, tuv.y));

              // Fine film grain
              float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);
              col += (grain - 0.5) * 0.04;

              // Slight contrast boost
              col = (col - 0.5) * 1.1 + 0.5;

              fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
            }`,
          uniforms: {
            iTime: { value: 0 },
            iResolution: { value: new Float32Array([1, 1]) },
          }
        });

        mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

        const resize = () => {
          const { width, height } = container.getBoundingClientRect();
          renderer.setSize(width, height);
          program.uniforms.iResolution.value.set([gl.drawingBufferWidth, gl.drawingBufferHeight]);
        };

        ro = new ResizeObserver(resize);
        ro.observe(container);
        resize();

        const t0 = performance.now();
        let lastFrame = 0;
        const loop = t => {
          raf = requestAnimationFrame(loop);
          if (t - lastFrame < 50) return; // 20fps
          lastFrame = t;
          program.uniforms.iTime.value = (t - t0) * 0.001;
          renderer.render({ scene: mesh });
        };
        raf = requestAnimationFrame(loop);
      } catch (e) {
        console.warn('Grainient fallback:', e);
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
        background: 'linear-gradient(135deg, #b8d4eb 0%, #c4b5e0 50%, #ebe8f4 100%)'
      }} />
    );
  }

  return <div ref={containerRef} className="absolute inset-0 bg-[#e8e4f0]" style={{ transform: 'translateZ(0)' }} />;
}
