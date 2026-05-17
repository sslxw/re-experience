import React, { useEffect, useRef } from 'react';

interface JournalConfettiProps {
    active: boolean;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    w: number;
    h: number;
    color: string;
    rot: number;
    vr: number;
    life: number;
}

const COLORS = ['#dc2626', '#4ade80', '#fbbf24', '#f87171', '#a3a3a3', '#fafafa'];

const JournalConfetti: React.FC<JournalConfettiProps> = ({ active }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const particles: Particle[] = Array.from({ length: 140 }, () => ({
            x: Math.random() * canvas.width,
            y: -20 - Math.random() * canvas.height * 0.4,
            vx: (Math.random() - 0.5) * 4,
            vy: 2 + Math.random() * 5,
            w: 6 + Math.random() * 6,
            h: 4 + Math.random() * 5,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.2,
            life: 1,
        }));

        let frame = 0;
        const maxFrames = 220;

        const tick = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.06;
                p.rot += p.vr;
                if (frame > maxFrames * 0.6) {
                    p.life -= 0.012;
                }

                if (p.life <= 0) continue;

                ctx.save();
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            }

            frame += 1;
            if (frame < maxFrames) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(rafRef.current);
        };
    }, [active]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            aria-hidden
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 10001,
            }}
        />
    );
};

export default JournalConfetti;
