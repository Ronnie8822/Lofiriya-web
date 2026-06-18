import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Server, Users, Music2, Activity } from 'lucide-react';

const stats = [
  { id: 1, label: 'Servers', value: 60, suffix: '+', icon: Server, color: 'text-primary', displayVal: '60' },
  { id: 2, label: 'Users', value: 80000, suffix: '+', icon: Users, color: 'text-accent', displayVal: '80K' },
  { id: 3, label: 'Songs Played', value: 5000, suffix: '+', icon: Music2, color: 'text-primary', displayVal: '5K' },
  { id: 4, label: 'Uptime', value: 99.9, suffix: '%', icon: Activity, color: 'text-green-400', displayVal: '99.9' },
];

function AnimatedCounter({ value, suffix, displayVal }: { value: number; suffix: string; displayVal: string }) {
  const [count, setCount] = useState(0);
  const nodeRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  const animate = useCallback(() => {
    if (animatedRef.current) return;
    animatedRef.current = true;
    const start = 0;
    const end = value;
    const duration = 1800;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) animate(); },
      { threshold: 0.4 }
    );
    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, [animate]);

  const formatCount = (val: number) => {
    if (displayVal === '80K') return Math.round(val / 1000) + 'K';
    if (displayVal === '5K') return Math.round(val / 1000) + 'K';
    if (displayVal === '99.9') return val.toFixed(1);
    return Math.round(val).toString();
  };

  return (
    <div ref={nodeRef} className="text-4xl md:text-5xl font-display font-bold text-white">
      {animatedRef.current ? formatCount(count) : '0'}{suffix}
    </div>
  );
}

export function StatsSection() {
  return (
    <section className="py-20 relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/4 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Trusted By The Community</h2>
          <p className="text-2xl md:text-3xl font-display font-bold text-white">Numbers That Speak For Themselves</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-surface/50 border border-white/6 hover:border-white/12 hover:bg-surface/70 transition-all duration-300 group"
              style={{ willChange: 'transform' }}
            >
              <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/8 transition-colors`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <AnimatedCounter value={stat.value} suffix={stat.suffix} displayVal={stat.displayVal} />
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-2 text-center">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
