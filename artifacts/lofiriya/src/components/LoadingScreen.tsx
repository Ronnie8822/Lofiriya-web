import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [text, setText] = useState('');
  const fullText = 'Initializing audio engine...';
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem('lofiriya_loaded');
    if (hasLoaded) {
      onComplete();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem('lofiriya_loaded', 'true');
        setTimeout(onComplete, 500);
      }
    });

    // Logo reveal
    tl.fromTo(
      logoRef.current,
      { opacity: 0, scale: 0.8, filter: 'blur(10px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1, ease: 'power3.out' }
    );

    // Bars animation
    if (barsRef.current) {
      const bars = barsRef.current.children;
      tl.fromTo(
        bars,
        { height: '10%' },
        { height: '100%', duration: 0.5, stagger: 0.1, yoyo: true, repeat: 3, ease: 'power1.inOut' },
        "-=0.5"
      );
    }

    // Typewriter effect
    let currentText = '';
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < fullText.length) {
        currentText += fullText.charAt(i);
        setText(currentText);
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, 50);

    return () => {
      clearInterval(typeInterval);
      tl.kill();
    };
  }, [onComplete]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] text-white"
      data-testid="loading-screen"
    >
      <div className="flex flex-col items-center gap-8">
        <div 
          ref={logoRef}
          className="text-5xl md:text-7xl font-bold tracking-tighter text-glow"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          LOFIRIYA
        </div>
        
        <div ref={barsRef} className="flex items-end gap-2 h-16 w-32">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className="w-full bg-primary rounded-t-sm opacity-80" 
              style={{ height: `${20 * i}%`, boxShadow: '0 0 10px var(--primary)' }}
            />
          ))}
        </div>

        <div className="font-mono text-primary text-sm tracking-widest min-h-[20px]">
          {text}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            _
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
