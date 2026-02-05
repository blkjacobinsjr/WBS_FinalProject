import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

const hexToRgb = hex => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16) / 255, parseInt(r[2], 16) / 255, parseInt(r[3], 16) / 255] : [1, 1, 1];
};

// Simplified shader - fewer operations, no grain animation
const vertex = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const fragment = `#version 300 es
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uColor1, uColor2, uColor3;
out vec4 fragColor;

vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash(i) - 0.5, f), dot(hash(i + vec2(1, 0)) - 0.5, f - vec2(1, 0)), u.x),
             mix(dot(hash(i + vec2(0, 1)) - 0.5, f - vec2(0, 1)), dot(hash(i + vec2(1, 1)) - 0.5, f - vec2(1, 1)), u.x), u.y) + 0.5;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  vec2 p = uv - 0.5;
  float t = iTime * 0.08;

  // Simple warp
  p.x += sin(p.y * 3.0 + t) * 0.03;
  p.y += cos(p.x * 3.0 + t) * 0.03;

  // Blend colors
  float n = noise(p * 2.0 + t * 0.5);
  vec3 col = mix(mix(uColor3, uColor2, smoothstep(-0.2, 0.2, p.x + n * 0.3)),
                 uColor1, smoothstep(0.0, -0.4, p.y + n * 0.2));

  // Static grain (no animation)
  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.06;

  fragColor = vec4(col, 1.0);
}`;

export default function Grainient({ color1 = '#a855f7', color2 = '#ec4899', color3 = '#ddd6fe' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Lower resolution for performance (0.5 = half res)
    const renderer = new Renderer({ webgl: 2, alpha: false, antialias: false, dpr: 0.5 });
    const gl = renderer.gl;
    gl.canvas.style.cssText = 'width:100%;height:100%;display:block';
    container.appendChild(gl.canvas);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uColor1: { value: new Float32Array(hexToRgb(color1)) },
        uColor2: { value: new Float32Array(hexToRgb(color2)) },
        uColor3: { value: new Float32Array(hexToRgb(color3)) },
      }
    });

    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height);
      program.uniforms.iResolution.value.set([gl.drawingBufferWidth, gl.drawingBufferHeight]);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    let raf = 0;
    const t0 = performance.now();
    let lastFrame = 0;

    // Throttle to ~24fps for performance
    const loop = t => {
      raf = requestAnimationFrame(loop);
      if (t - lastFrame < 41) return; // ~24fps
      lastFrame = t;
      program.uniforms.iTime.value = (t - t0) * 0.001;
      renderer.render({ scene: mesh });
    };
    raf = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); container.removeChild(gl.canvas); };
  }, [color1, color2, color3]);

  return <div ref={containerRef} className="absolute inset-0" style={{ willChange: 'transform' }} />;
}
