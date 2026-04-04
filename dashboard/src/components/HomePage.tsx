import { useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const TITLE = "Introducing Andromeda";
const TYPE_SPEED = 80;
const DELETE_SPEED = 50;
const PAUSE_FULL = 2500;
const PAUSE_EMPTY = 600;

export function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -500, y: -500 });
  const [displayed, setDisplayed] = useState("");

  // Typewriter: types forward then erases, loops forever
  useEffect(() => {
    let index = 0;
    let typing = true;
    let timeout: ReturnType<typeof setTimeout>;

    function tick() {
      if (typing) {
        index++;
        setDisplayed(TITLE.slice(0, index));
        if (index >= TITLE.length) {
          typing = false;
          timeout = setTimeout(tick, PAUSE_FULL);
        } else {
          timeout = setTimeout(tick, TYPE_SPEED);
        }
      } else {
        index--;
        setDisplayed(TITLE.slice(0, index));
        if (index <= 0) {
          typing = true;
          timeout = setTimeout(tick, PAUSE_EMPTY);
        } else {
          timeout = setTimeout(tick, DELETE_SPEED);
        }
      }
    }

    timeout = setTimeout(tick, 800);
    return () => clearTimeout(timeout);
  }, []);

  // Rainbow cloud canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let animId: number;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      hue: number;
      size: number;
    }

    const particles: Particle[] = [];
    let hueOffset = 0;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function spawnParticles() {
      const mx = mouse.current.x;
      const my = mouse.current.y;
      if (mx < 0) return;

      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 0.3;
        particles.push({
          x: mx + (Math.random() - 0.5) * 60,
          y: my + (Math.random() - 0.5) * 60,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: Math.random() * 60 + 40,
          hue: (hueOffset + Math.random() * 80) % 360,
          size: Math.random() * 30 + 15,
        });
      }
      hueOffset = (hueOffset + 0.8) % 360;
    }

    function animate() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      spawnParticles();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.life -= 1 / p.maxLife;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const alpha = p.life * 0.35;
        const radius = p.size * (0.5 + p.life * 0.5);

        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, radius
        );
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 65%, ${alpha})`);
        gradient.addColorStop(0.4, `hsla(${p.hue + 30}, 70%, 55%, ${alpha * 0.5})`);
        gradient.addColorStop(1, `hsla(${p.hue + 60}, 60%, 45%, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      if (mouse.current.x >= 0) {
        const glow = ctx.createRadialGradient(
          mouse.current.x, mouse.current.y, 0,
          mouse.current.x, mouse.current.y, 180
        );
        glow.addColorStop(0, `hsla(${hueOffset}, 70%, 60%, 0.08)`);
        glow.addColorStop(0.5, `hsla(${hueOffset + 60}, 60%, 50%, 0.03)`);
        glow.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(mouse.current.x, mouse.current.y, 180, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseLeave = () => {
    mouse.current = { x: -500, y: -500 };
  };

  return (
    <div
      className="homepage"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className="homepage-canvas" />

      <div className="homepage-content">
        <h1 className="homepage-title">
          {displayed}
          <span className="homepage-cursor">|</span>
        </h1>
        <p className="homepage-subtitle">
          Real-time analytics for your Discord servers
        </p>

        {/* Glass login button */}
        <a
          href={`${API_URL}/auth/discord`}
          className="homepage-login"
        >
          <span className="homepage-login-glow" />
          Sign in with Discord
        </a>
      </div>
    </div>
  );
}
