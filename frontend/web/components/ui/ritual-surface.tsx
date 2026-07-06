'use client';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Ritual color palette (normalized 0–1)
const CYAN   = [0.0,   0.961, 0.831] as const; // #00f5d4
const PURPLE = [0.659, 0.333, 0.969] as const; // #a855f7
const AURORA = [0.2,   0.647, 1.0  ] as const; // #33a5ff — mid-gradient accent

export function RitualSurface() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const SEPARATION = 130;
    const AMOUNTX = 50;
    const AMOUNTY = 58;
    const COUNT = AMOUNTX * AMOUNTY;

    // Scene — fog matches body background so dots fade into void
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x090909, 1600, 7500);

    const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, 440, 1350);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // transparent — body bg shows through
    el.appendChild(renderer.domElement);

    // Build geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);

    let i = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
      // t: 0 = cyan (left), 1 = purple (right)
      const t = ix / (AMOUNTX - 1);
      // blend through aurora accent in the middle (peaks at t=0.5)
      const mid = 1 - Math.abs(t - 0.5) * 2; // 0→1→0 as t goes 0→0.5→1
      const r = CYAN[0] * (1 - t) + PURPLE[0] * t + AURORA[0] * mid * 0.18;
      const g = CYAN[1] * (1 - t) + PURPLE[1] * t + AURORA[1] * mid * 0.18;
      const b = CYAN[2] * (1 - t) + PURPLE[2] * t + AURORA[2] * mid * 0.18;

      for (let iy = 0; iy < AMOUNTY; iy++) {
        const base = i * 3;
        positions[base]     = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        positions[base + 1] = 0;
        positions[base + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
        colors[base]     = r;
        colors[base + 1] = g;
        colors[base + 2] = b;
        i++;
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.Float32BufferAttribute(colors,    3));

    const material = new THREE.PointsMaterial({
      size: 5.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.58,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let frame = 0;
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const pos = geometry.attributes.position.array as Float32Array;
      let idx = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          // Two overlapping sine waves — gives the ocean-ritual feel
          pos[idx + 1] =
            Math.sin((ix + frame) * 0.28) * 85 +
            Math.sin((iy + frame * 0.65) * 0.42) * 65;
          idx += 3;
        }
      }
      geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      frame += 0.055; // slow, majestic
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
