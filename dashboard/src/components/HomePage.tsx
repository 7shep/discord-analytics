import { useEffect, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -500, y: -500 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let animId: number;

    // Particle pool for the rainbow cloud
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

      // Draw + update particles
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

      // Ambient glow at cursor
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
        {/* Logo */}
        <div className="homepage-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
          </svg>
        </div>

        <h1 className="homepage-title">Discordlytics</h1>
        <p className="homepage-subtitle">
          Real-time analytics for your Discord servers
        </p>

        {/* Glass login button */}
        <a
          href={`${API_URL}/auth/discord`}
          className="homepage-login"
        >
          <span className="homepage-login-glow" />
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
            className="homepage-login-icon"
          >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          Sign in with Discord
        </a>
      </div>
    </div>
  );
}
