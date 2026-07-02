import { useMemo } from "react";

interface Particle {
  id: number;
  left: string;
  size: number;
  duration: string;
  delay: string;
}

export default function Particles({ count = 15 }: { count?: number }) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      duration: `${Math.random() * 8 + 8}s`,
      delay: `${Math.random() * 10}s`,
    }));
  }, [count]);

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            "--duration": p.duration,
            "--delay": p.delay,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}
