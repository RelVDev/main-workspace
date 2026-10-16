// Efek animasi konfeti perayaan murni HTML5 Canvas tanpa dependensi pihak ketiga.
"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  opacity: number;
  shape: "circle" | "rect";
};

const BRAND_PALETTE = [
  "#1677B8", // Blue
  "#6035A8", // Purple
  "#B313A5", // Magenta
  "#E66B72", // Coral
  "#F2B92E", // Gold
  "#F28B43", // Orange
  "#267A57", // Emerald Success
];

export function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Particle[] = [];
    const count = 90;
    const originX = width / 2;
    const originY = height * 0.35;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = 4 + Math.random() * 8;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed * (0.8 + Math.random() * 0.5),
        vy: Math.sin(angle) * speed - 3 - Math.random() * 4,
        size: 6 + Math.random() * 6,
        color: BRAND_PALETTE[Math.floor(Math.random() * BRAND_PALETTE.length)],
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2,
        opacity: 1,
        shape: Math.random() > 0.4 ? "rect" : "circle",
      });
    }

    const startTime = Date.now();
    const duration = 3800;

    const render = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      const progress = elapsed / duration;
      const globalAlpha = Math.max(0, 1 - progress * 1.2);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.16; // Gravitasi
        p.vx *= 0.985; // Gesekan udara
        p.rotation += p.vRot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity * globalAlpha;
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 size-full"
    />
  );
}
