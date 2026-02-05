import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

const hexToRgb = hex => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const vertex = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uTimeSpeed;
uniform float uWarpStrength;
uniform float uWarpFrequency;
uniform float uWarpAmplitude;
uniform float uRotationAmount;
uniform float uNoiseScale;
uniform float uGrainAmount;
uniform float uContrast;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;
mat2 Rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i),f),dot(-1.0+2.0*hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(-1.0+2.0*hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);return 0.5+0.5*n;}
void main(){
  float t=iTime*uTimeSpeed;
  vec2 uv=gl_FragCoord.xy/iResolution.xy;
  float ratio=iResolution.x/iResolution.y;
  vec2 tuv=uv-0.5;
  float degree=noise(vec2(t*0.1,tuv.x*tuv.y)*uNoiseScale);
  tuv.y*=1.0/ratio;
  tuv*=Rot(radians((degree-0.5)*uRotationAmount+180.0));
  tuv.y*=ratio;
  float amp=uWarpAmplitude/max(uWarpStrength,0.001);
  tuv.x+=sin(tuv.y*uWarpFrequency+t)/amp;
  tuv.y+=sin(tuv.x*uWarpFrequency*1.5+t)/(amp*0.5);
  vec3 layer1=mix(uColor3,uColor2,smoothstep(-0.3,0.2,tuv.x));
  vec3 layer2=mix(uColor2,uColor1,smoothstep(-0.3,0.2,tuv.x));
  vec3 col=mix(layer1,layer2,smoothstep(0.5,-0.3,tuv.y));
  float grain=fract(sin(dot(uv*2.0,vec2(12.9898,78.233)))*43758.5453);
  col+=(grain-0.5)*uGrainAmount;
  col=(col-0.5)*uContrast+0.5;
  fragColor=vec4(clamp(col,0.0,1.0),1.0);
}`;

export default function Grainient({ color1 = '#a855f7', color2 = '#ec4899', color3 = '#c4b5fd', className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const renderer = new Renderer({ webgl: 2, alpha: true, antialias: false, dpr: 1 });
    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.style.cssText = 'width:100%;height:100%;display:block';
    container.appendChild(canvas);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uTimeSpeed: { value: 0.15 },
        uWarpStrength: { value: 1 },
        uWarpFrequency: { value: 4 },
        uWarpAmplitude: { value: 60 },
        uRotationAmount: { value: 400 },
        uNoiseScale: { value: 2 },
        uGrainAmount: { value: 0.08 },
        uContrast: { value: 1.3 },
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
    const loop = t => {
      program.uniforms.iTime.value = (t - t0) * 0.001;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); container.removeChild(canvas); };
  }, [color1, color2, color3]);

  return <div ref={containerRef} className={`absolute inset-0 ${className}`} />;
}
